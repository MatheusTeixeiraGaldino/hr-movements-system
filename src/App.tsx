import { useState, useEffect } from 'react'
import { supabase, Usuario, Setor, Equipe, Periodo, PeriodoLancamento, Meta, Lancamento, DashboardLancamento } from './lib/supabase'
import { ExternalLink, Target, Calendar, AlertCircle, LogOut, Users, Building2, Shield, Clock, CheckCircle, XCircle, Plus, Edit, Eye } from 'lucide-react'

function App() {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'login' | 'cadastro' | 'aguardando' | 'dashboard' | 'periodos' | 'metas' | 'lancamentos' | 'usuarios' | 'estrutura'>('login')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .single()
      
      if (data) {
        setUser(data)
        if (data.status_aprovacao === 'pendente') {
          setView('aguardando')
        } else if (data.status_aprovacao === 'aprovado') {
          setView('dashboard')
        }
      }
    }
    setLoading(false)
  }

  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data.user) {
      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single()
      
      if (userData) {
        setUser(userData)
        if (userData.status_aprovacao === 'aprovado') {
          setView('dashboard')
        } else {
          setView('aguardando')
        }
      }
    } else {
      alert('Erro ao fazer login. Verifique suas credenciais.')
    }
  }

  const handleCadastro = async (nome: string, email: string, password: string, tipo: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError

      if (authData.user) {
        const { error: insertError } = await supabase.from('usuarios').insert({
          auth_user_id: authData.user.id,
          nome,
          email,
          tipo,
          status_aprovacao: 'pendente',
          ativo: false
        })

        if (insertError) throw insertError
        alert('Cadastro realizado! Aguarde aprovação do administrador.')
        setView('aguardando')
      }
    } catch (error: any) {
      alert('Erro ao cadastrar: ' + error.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setView('login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (view === 'aguardando') {
    return <AguardandoAprovacao onLogout={handleLogout} />
  }

  if (!user || view === 'login') {
    return <Login onLogin={handleLogin} onCadastro={() => setView('cadastro')} />
  }

  if (view === 'cadastro') {
    return <Cadastro onCadastro={handleCadastro} onVoltar={() => setView('login')} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'dashboard' && <Dashboard user={user} onNavigate={setView} />}
        {view === 'periodos' && <GerenciarPeriodos user={user} onBack={() => setView('dashboard')} />}
        {view === 'metas' && <GerenciarMetas user={user} onBack={() => setView('dashboard')} />}
        {view === 'lancamentos' && <RealizarLancamentos user={user} onBack={() => setView('dashboard')} />}
        {view === 'usuarios' && <GerenciarUsuarios user={user} onBack={() => setView('dashboard')} />}
        {view === 'estrutura' && <GerenciarEstrutura user={user} onBack={() => setView('dashboard')} />}
      </main>
    </div>
  )
}

function Login({ onLogin, onCadastro }: { onLogin: (email: string, password: string) => void; onCadastro: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Target className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Gestão de Metas</h1>
          <p className="text-gray-600 mt-2">Acesse sua conta</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="seu@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onLogin(email, password)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          
          <button
            onClick={() => onLogin(email, password)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Entrar
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Não tem conta?</span>
            </div>
          </div>

          <button
            onClick={onCadastro}
            className="w-full bg-white text-blue-600 py-2 px-4 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors font-medium"
          >
            Criar Conta
          </button>
        </div>
      </div>
    </div>
  )
}

function Cadastro({ onCadastro, onVoltar }: { onCadastro: (nome: string, email: string, password: string, tipo: string) => void; onVoltar: () => void }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tipo, setTipo] = useState('lancamento')

  const handleSubmit = () => {
    if (!nome || !email || !password) {
      alert('Preencha todos os campos')
      return
    }
    if (password !== confirmPassword) {
      alert('As senhas não coincidem')
      return
    }
    if (password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres')
      return
    }
    onCadastro(nome, email, password, tipo)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Users className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Criar Conta</h1>
          <p className="text-gray-600 mt-2">Preencha seus dados</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Acesso</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="lancamento">Lançamento</option>
              <option value="visualizacao">Visualização</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Criar Conta
          </button>

          <button
            onClick={onVoltar}
            className="w-full bg-white text-gray-700 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
          >
            Voltar
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-xs text-yellow-800">
            <strong>Atenção:</strong> Aguarde aprovação do administrador.
          </p>
        </div>
      </div>
    </div>
  )
}

function AguardandoAprovacao({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
        <Clock className="w-20 h-20 text-yellow-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Aguardando Aprovação</h1>
        <p className="text-gray-600 mb-6">
          Sua conta foi criada! Aguarde a aprovação do administrador.
        </p>
        <button
          onClick={onLogout}
          className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          Voltar
        </button>
      </div>
    </div>
  )
}

function Header({ user, onLogout }: { user: Usuario; onLogout: () => void }) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sistema de Gestão de Metas</h1>
              <p className="text-sm text-gray-600">
                {user.nome} - 
                {user.tipo === 'admin' && ' Administrador'}
                {user.tipo === 'lancamento' && ' Lançamento'}
                {user.tipo === 'visualizacao' && ' Visualização'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}

function Dashboard({ user, onNavigate }: { user: Usuario; onNavigate: (view: string) => void }) {
  const [stats, setStats] = useState({
    totalMetas: 0,
    metasAtivas: 0,
    lancamentosRealizados: 0,
    lancamentosPendentes: 0,
    usuariosPendentes: 0
  })

  useEffect(() => {
    carregarEstatisticas()
  }, [])

  const carregarEstatisticas = async () => {
    const { data: metas } = await supabase.from('metas').select('*')
    const { data: dashboard } = await supabase.from('vw_dashboard_lancamentos').select('*') as { data: DashboardLancamento[] | null }
    
    let usuariosPendentes = 0
    if (user.tipo === 'admin') {
      const { count } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('status_aprovacao', 'pendente')
      usuariosPendentes = count || 0
    }

    setStats({
      totalMetas: metas?.length || 0,
      metasAtivas: metas?.filter(m => m.status === 'ativa').length || 0,
      lancamentosRealizados: dashboard?.filter(d => d.status_lancamento === 'Lançado').length || 0,
      lancamentosPendentes: dashboard?.filter(d => d.status_lancamento === 'Pendente').length || 0,
      usuariosPendentes
    })
  }

  const cards = [
    { title: 'Metas Ativas', value: stats.metasAtivas, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Lançamentos Realizados', value: stats.lancamentosRealizados, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Lançamentos Pendentes', value: stats.lancamentosPendentes, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    ...(user.tipo === 'admin' ? [
      { title: 'Usuários Pendentes', value: stats.usuariosPendentes, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' }
    ] : [])
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <div key={idx} className={`${card.bg} rounded-lg p-6 border border-gray-200`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{card.title}</p>
                <p className="text-3xl font-bold mt-2 text-gray-900">{card.value}</p>
              </div>
              <card.icon className={`w-12 h-12 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      {stats.usuariosPendentes > 0 && user.tipo === 'admin' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
          <Users className="w-5 h-5 text-purple-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-purple-900">Novos Cadastros</p>
            <p className="text-sm text-purple-700">
              {stats.usuariosPendentes} {stats.usuariosPendentes === 1 ? 'usuário aguardando' : 'usuários aguardando'} aprovação.
            </p>
          </div>
          <button
            onClick={() => onNavigate('usuarios')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
          >
            Revisar
          </button>
        </div>
      )}

      {stats.lancamentosPendentes > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-orange-900">Lançamentos Pendentes</p>
            <p className="text-sm text-orange-700">
              Você possui {stats.lancamentosPendentes} lançamentos pendentes.
            </p>
          </div>
          <button
            onClick={() => onNavigate('lancamentos')}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
          >
            Lançar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Menu Principal</h3>
          <div className="space-y-2">
            {user.tipo === 'admin' && (
              <>
                <button
                  onClick={() => onNavigate('periodos')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Períodos</p>
                    <p className="text-xs text-gray-500">Gerenciar períodos de acompanhamento</p>
                  </div>
                </button>
                <button
                  onClick={() => onNavigate('metas')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Target className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Metas</p>
                    <p className="text-xs text-gray-500">Cadastrar e gerenciar metas</p>
                  </div>
                </button>
                <button
                  onClick={() => onNavigate('estrutura')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="font-medium">Estrutura</p>
                    <p className="text-xs text-gray-500">Setores e Equipes</p>
                  </div>
                </button>
                <button
                  onClick={() => onNavigate('usuarios')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Shield className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Usuários</p>
                    <p className="text-xs text-gray-500">Gerenciar usuários e permissões</p>
                  </div>
                </button>
              </>
            )}
            <button
              onClick={() => onNavigate('lancamentos')}
              className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium">Lançamentos</p>
                <p className="text-xs text-gray-500">Realizar lançamentos de resultados</p>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Sobre o Sistema</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>✅ Sistema 100% informativo</p>
            <p>✅ Sem cálculos ou análises automáticas</p>
            <p>✅ Organização por períodos</p>
            <p>✅ Acompanhamento visual de status</p>
            <p>✅ Controle de permissões por setor/equipe</p>
          </div>
        </div>
      </div>
    </div>
  )
}
// ============================================
// COLAR ESTE CÓDIGO NO App.tsx ANTES DO "export default App"
// ============================================

function GerenciarPeriodos({ user, onBack }: { user: Usuario; onBack: () => void }) {
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    data_inicio: '',
    data_fim: '',
    tipo_acompanhamento: 'mensal'
  })

  useEffect(() => {
    carregarPeriodos()
  }, [])

  const carregarPeriodos = async () => {
    const { data } = await supabase
      .from('periodos')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setPeriodos(data)
  }

  const handleSalvar = async () => {
    if (!form.nome || !form.data_inicio || !form.data_fim) {
      alert('Preencha todos os campos')
      return
    }

    const { error } = await supabase.from('periodos').insert(form)

    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      alert('Período criado! Os períodos de lançamento foram gerados automaticamente.')
      setForm({ nome: '', data_inicio: '', data_fim: '', tipo_acompanhamento: 'mensal' })
      setMostrarForm(false)
      carregarPeriodos()
    }
  }

  const toggleStatus = async (id: string, ativo: boolean) => {
    const { error } = await supabase
      .from('periodos')
      .update({ ativo: !ativo })
      .eq('id', id)

    if (!error) {
      carregarPeriodos()
    }
  }

  const verPeriodosLancamento = async (periodoId: string) => {
    const { data } = await supabase
      .from('periodos_lancamento')
      .select('*')
      .eq('periodo_id', periodoId)
      .order('ordem')

    if (data) {
      const lista = data.map((p, idx) => `${idx + 1}. ${p.descricao}`).join('\n')
      alert(`Períodos de lançamento:\n\n${lista}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Voltar</button>
          <h2 className="text-3xl font-bold">Períodos</h2>
        </div>
        {user.tipo === 'admin' && !mostrarForm && (
          <button
            onClick={() => setMostrarForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Novo Período
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Novo Período</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Nome</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({...form, nome: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Ex: Período 2025/2026"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Data Início</label>
              <input
                type="date"
                value={form.data_inicio}
                onChange={(e) => setForm({...form, data_inicio: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Data Fim</label>
              <input
                type="date"
                value={form.data_fim}
                onChange={(e) => setForm({...form, data_fim: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Tipo de Acompanhamento</label>
              <select
                value={form.tipo_acompanhamento}
                onChange={(e) => setForm({...form, tipo_acompanhamento: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="mensal">Mensal</option>
                <option value="bimestral">Bimestral</option>
                <option value="trimestral">Trimestral</option>
                <option value="quadrimestral">Quadrimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Os períodos de lançamento serão gerados automaticamente
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="font-semibold">Períodos Cadastrados</h3>
        </div>
        <div className="divide-y">
          {periodos.map(periodo => (
            <div key={periodo.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{periodo.nome}</h4>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>
                      {new Date(periodo.data_inicio).toLocaleDateString('pt-BR')} até{' '}
                      {new Date(periodo.data_fim).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="capitalize">{periodo.tipo_acompanhamento}</span>
                  </div>
                  <div className="mt-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      periodo.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {periodo.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => verPeriodosLancamento(periodo.id)}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                  >
                    Ver Períodos
                  </button>
                  {user.tipo === 'admin' && (
                    <button
                      onClick={() => toggleStatus(periodo.id, periodo.ativo)}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      {periodo.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {periodos.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Nenhum período cadastrado
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GerenciarMetas({ user, onBack }: { user: Usuario; onBack: () => void }) {
  const [metas, setMetas] = useState<any[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    equipe_id: '',
    periodo_id: '',
    tipo_acompanhamento: 'mensal'
  })

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    const { data: metasData } = await supabase
      .from('metas')
      .select('*, equipes(nome, setores(nome)), periodos(nome)')
      .order('created_at', { ascending: false })
    
    const { data: equipesData } = await supabase.from('equipes').select('*').eq('ativo', true)
    const { data: periodosData } = await supabase.from('periodos').select('*').eq('ativo', true)
    
    if (metasData) setMetas(metasData)
    if (equipesData) setEquipes(equipesData)
    if (periodosData) setPeriodos(periodosData)
  }

  const handlePeriodoChange = (periodoId: string) => {
    const periodo = periodos.find(p => p.id === periodoId)
    setForm({
      ...form,
      periodo_id: periodoId,
      tipo_acompanhamento: periodo?.tipo_acompanhamento || 'mensal'
    })
  }

  const handleSalvar = async () => {
    if (!form.nome || !form.equipe_id || !form.periodo_id) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    const { error } = await supabase.from('metas').insert({
      ...form,
      created_by: user.id,
      status: 'ativa'
    })

    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      alert('Meta criada com sucesso!')
      setForm({ nome: '', descricao: '', equipe_id: '', periodo_id: '', tipo_acompanhamento: 'mensal' })
      setMostrarForm(false)
      carregarDados()
    }
  }

  const toggleStatus = async (id: string, status: string) => {
    const novoStatus = status === 'ativa' ? 'inativa' : 'ativa'
    const { error } = await supabase
      .from('metas')
      .update({ status: novoStatus })
      .eq('id', id)

    if (!error) {
      carregarDados()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Voltar</button>
          <h2 className="text-3xl font-bold">Metas</h2>
        </div>
        {user.tipo === 'admin' && !mostrarForm && (
          <button
            onClick={() => setMostrarForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nova Meta
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Nova Meta</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome da Meta *</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({...form, nome: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Ex: Vendas do Trimestre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <textarea
                value={form.descricao}
                onChange={(e) => setForm({...form, descricao: e.target.value})}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Descreva a meta..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Equipe Responsável *</label>
                <select
                  value={form.equipe_id}
                  onChange={(e) => setForm({...form, equipe_id: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Selecione...</option>
                  {equipes.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Período *</label>
                <select
                  value={form.periodo_id}
                  onChange={(e) => handlePeriodoChange(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Selecione...</option>
                  {periodos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-800">
                <strong>Tipo de acompanhamento:</strong> {form.tipo_acompanhamento || 'Selecione um período'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Herdado automaticamente do período selecionado
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="font-semibold">Metas Cadastradas</h3>
        </div>
        <div className="divide-y">
          {metas.map(meta => (
            <div key={meta.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{meta.nome}</h4>
                  {meta.descricao && (
                    <p className="text-sm text-gray-600 mt-1">{meta.descricao}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>Equipe: {meta.equipes?.nome}</span>
                    <span>Período: {meta.periodos?.nome}</span>
                    <span className="capitalize">Acompanhamento: {meta.tipo_acompanhamento}</span>
                  </div>
                  <div className="mt-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      meta.status === 'ativa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {meta.status === 'ativa' ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
                {user.tipo === 'admin' && (
                  <button
                    onClick={() => toggleStatus(meta.id, meta.status)}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                  >
                    {meta.status === 'ativa' ? 'Desativar' : 'Ativar'}
                  </button>
                )}
              </div>
            </div>
          ))}
          {metas.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Nenhuma meta cadastrada
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
// ============================================
// COLAR DEPOIS DA PARTE 2, ANTES DO "export default App"
// ============================================

function RealizarLancamentos({ user, onBack }: { user: Usuario; onBack: () => void }) {
  const [dashboard, setDashboard] = useState<DashboardLancamento[]>([])
  const [filtros, setFiltros] = useState({
    status: 'todos',
    setor: '',
    equipe: ''
  })
  const [metaSelecionada, setMetaSelecionada] = useState<any>(null)
  const [periodoSelecionado, setPeriodoSelecionado] = useState<any>(null)
  const [form, setForm] = useState({
    resultado: '',
    observacao: '',
    comprovante_anexado: false
  })

  useEffect(() => {
    carregarDashboard()
  }, [filtros])

  const carregarDashboard = async () => {
    let query = supabase.from('vw_dashboard_lancamentos').select('*')
    
    if (filtros.status === 'pendente') {
      query = query.eq('status_lancamento', 'Pendente')
    } else if (filtros.status === 'lancado') {
      query = query.eq('status_lancamento', 'Lançado')
    }

    if (filtros.setor) {
      query = query.eq('setor_nome', filtros.setor)
    }

    if (filtros.equipe) {
      query = query.eq('equipe_nome', filtros.equipe)
    }

    const { data } = await query
    if (data) setDashboard(data)
  }

  const abrirFormLancamento = (item: DashboardLancamento) => {
    if (item.status_lancamento === 'Lançado' && user.tipo !== 'admin') {
      alert('Este lançamento já foi realizado. Apenas administradores podem editar.')
      return
    }

    setMetaSelecionada(item)
    setPeriodoSelecionado(item)
    setForm({
      resultado: item.resultado || '',
      observacao: '',
      comprovante_anexado: false
    })
  }

  const handleSalvarLancamento = async () => {
    if (!form.resultado) {
      alert('Preencha o resultado')
      return
    }

    if (!form.comprovante_anexado && user.tipo !== 'admin') {
      alert('Confirme que o comprovante foi anexado')
      return
    }

    const { data: meta } = await supabase
      .from('metas')
      .select('*, equipes(link_comprovantes)')
      .eq('id', metaSelecionada.meta_id)
      .single()

    const { data: periodoLanc } = await supabase
      .from('periodos_lancamento')
      .select('*')
      .eq('periodo_id', meta?.periodo_id)
      .eq('mes_referencia', metaSelecionada.mes_referencia)
      .single()

    if (!periodoLanc) {
      alert('Erro ao localizar período de lançamento')
      return
    }

    const { error } = await supabase.from('lancamentos').upsert({
      meta_id: metaSelecionada.meta_id,
      periodo_lancamento_id: periodoLanc.id,
      resultado: form.resultado,
      observacao: form.observacao,
      comprovante_anexado: form.comprovante_anexado,
      lancado_por: user.id,
      editado_por: user.tipo === 'admin' ? user.id : null,
      data_edicao: user.tipo === 'admin' ? new Date().toISOString() : null
    })

    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      alert('Lançamento salvo com sucesso!')
      setMetaSelecionada(null)
      setPeriodoSelecionado(null)
      setForm({ resultado: '', observacao: '', comprovante_anexado: false })
      carregarDashboard()
    }
  }

  const setores = [...new Set(dashboard.map(d => d.setor_nome))]
  const equipes = [...new Set(dashboard.map(d => d.equipe_nome))]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Voltar</button>
        <h2 className="text-3xl font-bold">Lançamentos</h2>
      </div>

      {metaSelecionada && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Lançamento: {metaSelecionada.meta_nome} - {metaSelecionada.periodo_descricao}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Resultado *</label>
              <input
                type="text"
                value={form.resultado}
                onChange={(e) => setForm({...form, resultado: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Digite o resultado (apenas informativo)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Exemplo: 150 clientes, R$ 50.000,00, 85%, etc
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Observação</label>
              <textarea
                value={form.observacao}
                onChange={(e) => setForm({...form, observacao: e.target.value})}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Informações adicionais sobre este resultado..."
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">Link para Anexar Comprovante</p>
              <p className="text-xs text-blue-700 mb-3">
                Acesse o link da equipe para anexar o comprovante e marque a confirmação abaixo
              </p>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir Link
              </a>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.comprovante_anexado}
                  onChange={(e) => setForm({...form, comprovante_anexado: e.target.checked})}
                  className="mt-1 w-5 h-5"
                />
                <div>
                  <p className="font-medium">Confirmo que anexei o comprovante *</p>
                  <p className="text-sm text-gray-600">
                    Marque após fazer upload do comprovante no link fornecido
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                setMetaSelecionada(null)
                setPeriodoSelecionado(null)
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvarLancamento}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Salvar Lançamento
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4 mb-4">
          <select
            value={filtros.status}
            onChange={(e) => setFiltros({...filtros, status: e.target.value})}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="todos">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="lancado">Lançados</option>
          </select>
          <select
            value={filtros.setor}
            onChange={(e) => setFiltros({...filtros, setor: e.target.value})}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Todos os Setores</option>
            {setores.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filtros.equipe}
            onChange={(e) => setFiltros({...filtros, equipe: e.target.value})}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Todas as Equipes</option>
            {equipes.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div className="divide-y">
          {dashboard.map((item, idx) => (
            <div key={idx} className="py-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold">{item.meta_nome}</h4>
                  <div className="flex gap-4 mt-1 text-sm text-gray-600">
                    <span>{item.setor_nome}</span>
                    <span>{item.equipe_nome}</span>
                    <span>{item.periodo_descricao}</span>
                  </div>
                  {item.resultado && (
                    <p className="text-sm text-blue-600 mt-2">
                      <strong>Resultado:</strong> {item.resultado}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {item.status_lancamento === 'Lançado' ? (
                    <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Lançado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm">
                      <Clock className="w-4 h-4" />
                      Pendente
                    </span>
                  )}
                  {(user.tipo === 'admin' || user.tipo === 'lancamento') && (
                    <button
                      onClick={() => abrirFormLancamento(item)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {item.status_lancamento === 'Lançado' ? 'Editar' : 'Lançar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {dashboard.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Nenhum lançamento encontrado
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GerenciarUsuarios({ user, onBack }: { user: Usuario; onBack: () => void }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const carregarUsuarios = async () => {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setUsuarios(data)
  }

  const handleAprovar = async (id: string) => {
    const { error } = await supabase
      .from('usuarios')
      .update({
        status_aprovacao: 'aprovado',
        ativo: true,
        aprovado_por: user.id,
        data_aprovacao: new Date().toISOString()
      })
      .eq('id', id)

    if (!error) {
      alert('Usuário aprovado!')
      carregarUsuarios()
    }
  }

  const handleReprovar = async (id: string) => {
    const { error } = await supabase
      .from('usuarios')
      .update({
        status_aprovacao: 'reprovado',
        ativo: false,
        aprovado_por: user.id,
        data_aprovacao: new Date().toISOString()
      })
      .eq('id', id)

    if (!error) {
      alert('Usuário reprovado!')
      carregarUsuarios()
    }
  }

  const handleAlterarTipo = async (id: string, novoTipo: string) => {
    const { error } = await supabase
      .from('usuarios')
      .update({ tipo: novoTipo })
      .eq('id', id)

    if (!error) {
      carregarUsuarios()
    }
  }

  const pendentes = usuarios.filter(u => u.status_aprovacao === 'pendente')
  const ativos = usuarios.filter(u => u.status_aprovacao === 'aprovado')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Voltar</button>
        <h2 className="text-3xl font-bold">Usuários</h2>
      </div>

      {pendentes.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b bg-yellow-50">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              Pendentes de Aprovação ({pendentes.length})
            </h3>
          </div>
          <div className="divide-y">
            {pendentes.map(usuario => (
              <div key={usuario.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{usuario.nome}</h4>
                    <p className="text-sm text-gray-600">{usuario.email}</p>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mt-2 inline-block">
                      {usuario.tipo}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReprovar(usuario.id)}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50"
                    >
                      Reprovar
                    </button>
                    <button
                      onClick={() => handleAprovar(usuario.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Aprovar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="font-semibold">Usuários Ativos ({ativos.length})</h3>
        </div>
        <div className="divide-y">
          {ativos.map(usuario => (
            <div key={usuario.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{usuario.nome}</h4>
                  <p className="text-sm text-gray-600">{usuario.email}</p>
                  <div className="mt-2">
                    <select
                      value={usuario.tipo}
                      onChange={(e) => handleAlterarTipo(usuario.id, e.target.value)}
                      className="px-3 py-1 border rounded text-sm"
                    >
                      <option value="admin">Admin</option>
                      <option value="lancamento">Lançamento</option>
                      <option value="visualizacao">Visualização</option>
                    </select>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                  Aprovado
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GerenciarEstrutura({ user, onBack }: { user: Usuario; onBack: () => void }) {
  const [setores, setSetores] = useState<Setor[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    const { data: setoresData } = await supabase.from('setores').select('*')
    const { data: equipesData } = await supabase.from('equipes').select('*, setores(nome)')
    
    if (setoresData) setSetores(setoresData)
    if (equipesData) setEquipes(equipesData as any)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Voltar</button>
        <h2 className="text-3xl font-bold">Estrutura Organizacional</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Setores</h3>
          <div className="space-y-2">
            {setores.map(setor => (
              <div key={setor.id} className="p-3 border rounded">
                <p className="font-medium">{setor.nome}</p>
                {setor.descricao && (
                  <p className="text-sm text-gray-600">{setor.descricao}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Equipes</h3>
          <div className="space-y-2">
            {equipes.map(equipe => (
              <div key={equipe.id} className="p-3 border rounded">
                <p className="font-medium">{equipe.nome}</p>
                <p className="text-sm text-gray-600">Setor: {(equipe as any).setores?.nome}</p>
                {equipe.link_comprovantes && (
                  <a
                    href={equipe.link_comprovantes}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Link para comprovantes
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
