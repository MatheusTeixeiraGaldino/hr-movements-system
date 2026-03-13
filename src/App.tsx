import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Briefcase, LogOut, Users, Building2, Mail, Clock, CheckCircle,
  Plus, AlertCircle, X, Trash2, FileText, Send, Eye,
  BarChart3, ChevronRight, Shield, Edit
} from 'lucide-react'

// ─────────────────────────────────────────────
// SUPABASE CLIENT
// ─────────────────────────────────────────────
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase     = createClient(supabaseUrl, supabaseKey)

const WEBHOOK_URL  = 'https://hook.eu2.make.com/acgp1d7grpmgeubdn2vm6fwohfs73p7w'
const SESSION_KEY  = 'hr_session'

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
interface User {
  id: string
  email: string
  name: string
  role: string
  can_manage_demissoes?: boolean
  can_manage_transferencias?: boolean
  team_id?: string
  team_name?: string
  team_ids?: string[]
  team_names?: string[]
  created_at?: string
}

interface Setor {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
  created_at: string
}

interface EmailSetor {
  id: string
  setor_id: string
  nome: string
  email: string
  ativo: boolean
  created_at: string
  setores?: { nome: string }
}

interface MovimentacaoSetor {
  setor_id: string
  status: string
  setores: { nome: string }
}

interface Movimentacao {
  id: string
  funcionario_nome: string
  tipo: string
  prazo?: string
  descricao?: string
  status: string
  setores_ids: string[]
  criado_por?: string
  created_at: string
  updated_at: string
  movimentacoes_setores?: MovimentacaoSetor[]
}

// ─────────────────────────────────────────────
// CONSTANTES DE DOMÍNIO
// ─────────────────────────────────────────────
const TIPO_LABELS: Record<string, string> = {
  demissao:      'Demissão',
  transferencia: 'Transferência',
  alteracao:     'Alteração Salarial',
  promocao:      'Promoção',
  afastamento:   'Afastamento',
  outros:        'Outros',
}

const TIPO_BADGE: Record<string, { color: string; border: string; bg: string }> = {
  demissao:      { color: '#dc2626', border: '#fca5a5', bg: '#fef2f2' },
  transferencia: { color: '#2563eb', border: '#93c5fd', bg: '#eff6ff' },
  alteracao:     { color: '#ca8a04', border: '#fde047', bg: '#fefce8' },
  promocao:      { color: '#16a34a', border: '#86efac', bg: '#f0fdf4' },
  afastamento:   { color: '#9333ea', border: '#d8b4fe', bg: '#faf5ff' },
  outros:        { color: '#4b5563', border: '#d1d5db', bg: '#f9fafb' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; border: string; bg: string; icon: any }> = {
  pendente:     { label: 'Pendente',     color: '#d97706', border: '#fcd34d', bg: '#fffbeb', icon: Clock        },
  em_andamento: { label: 'Em Andamento', color: '#2563eb', border: '#93c5fd', bg: '#eff6ff', icon: AlertCircle  },
  concluido:    { label: 'Concluído',    color: '#16a34a', border: '#86efac', bg: '#f0fdf4', icon: CheckCircle  },
  cancelado:    { label: 'Cancelado',    color: '#6b7280', border: '#d1d5db', bg: '#f9fafb', icon: X            },
}

type View = 'dashboard' | 'movimentacoes' | 'setores' | 'usuarios'

// ─────────────────────────────────────────────
// ESTILOS COMPARTILHADOS
// ─────────────────────────────────────────────
const S = {
  input: {
    width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
    border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
    fontFamily: 'var(--font-body)',
  } as React.CSSProperties,

  label: {
    display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text)',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6,
  } as React.CSSProperties,

  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 9, border: 'none',
    background: 'var(--accent)', color: 'white',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  } as React.CSSProperties,

  btnSecondary: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 9,
    border: '1px solid var(--border)', background: 'var(--surface)',
    color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  } as React.CSSProperties,

  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: 6,
    borderRadius: 7, color: 'var(--muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  } as React.CSSProperties,

  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  } as React.CSSProperties,

  modalBox: {
    background: 'var(--surface)', borderRadius: 16, padding: 30,
    width: '100%', maxHeight: '92vh', overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
  } as React.CSSProperties,

  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 14, padding: 24,
  } as React.CSSProperties,

  pageTitle: {
    fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700,
    color: 'var(--text)', letterSpacing: '-0.4px',
  } as React.CSSProperties,

  pageSubtitle: {
    color: 'var(--muted)', fontSize: 14, marginTop: 4,
  } as React.CSSProperties,
}

const focusAccent  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = 'var(--accent)' }
const blurBorder   = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = 'var(--border)' }

// ─────────────────────────────────────────────
// APP PRINCIPAL
// ─────────────────────────────────────────────
export default function App() {
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [view,    setView]    = useState<View>('dashboard')

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY)
    if (saved) {
      try { setUser(JSON.parse(saved)); setView('dashboard') }
      catch { localStorage.removeItem(SESSION_KEY) }
    }
    setLoading(false)
  }, [])

  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('password', password)
      .single()

    if (error || !data) { alert('E-mail ou senha incorretos.'); return }

    localStorage.setItem(SESSION_KEY, JSON.stringify(data))
    setUser(data as User)
    setView('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        <p style={{ marginTop: 12, color: 'var(--muted)', fontSize: 14 }}>Carregando...</p>
      </div>
    </div>
  )

  if (!user) return <LoginScreen onLogin={handleLogin} />

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>
      <Sidebar user={user} currentView={view} onNavigate={setView} onLogout={handleLogout} />
      <main style={{ flex: 1, marginLeft: 252, padding: '36px 40px', minHeight: '100vh', animation: 'fadeIn 0.2s ease' }}>
        {view === 'dashboard'     && <Dashboard     user={user} onNavigate={setView} />}
        {view === 'movimentacoes' && <GerenciarMovimentacoes user={user} />}
        {view === 'setores'       && <GerenciarSetores       user={user} />}
        {view === 'usuarios'      && <GerenciarUsuarios      user={user} />}
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (e: string, p: string) => void }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  const submit = async () => {
    if (!email || !password) { alert('Preencha e-mail e senha'); return }
    setLoading(true)
    await onLogin(email, password)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ ...S.card, width: '100%', maxWidth: 420, padding: '44px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 54, height: 54, background: 'var(--accent)', borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Briefcase size={27} color="white" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text)' }}>RH Movimentações</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 5 }}>Sistema de Movimentações Trabalhistas</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={S.label}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com" style={S.input} onFocus={focusAccent} onBlur={blurBorder} />
          </div>
          <div>
            <label style={S.label}>Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && submit()}
              placeholder="••••••••" style={S.input} onFocus={focusAccent} onBlur={blurBorder} />
          </div>
          <button onClick={submit} disabled={loading}
            style={{ ...S.btnPrimary, justifyContent: 'center', padding: '11px 18px', marginTop: 4, opacity: loading ? 0.75 : 1 }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
function Sidebar({ user, currentView, onNavigate, onLogout }: {
  user: User; currentView: View
  onNavigate: (v: View) => void; onLogout: () => void
}) {
  const isAdmin = user.role === 'admin'

  const items = [
    { id: 'dashboard',     label: 'Dashboard',        icon: BarChart3, show: true      },
    { id: 'movimentacoes', label: 'Movimentações',     icon: Briefcase, show: true      },
    { id: 'setores',       label: 'Setores & Emails',  icon: Mail,      show: isAdmin   },
    { id: 'usuarios',      label: 'Usuários',          icon: Shield,    show: isAdmin   },
  ].filter(i => i.show)

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, width: 252, height: '100vh',
      background: 'var(--surface)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Briefcase size={17} color="white" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text)', lineHeight: 1.2 }}>RH Movimentações</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Sistema Trabalhista</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, padding: '0 10px 10px' }}>Menu</p>
        {items.map(({ id, label, icon: Icon }) => {
          const active = currentView === id
          return (
            <button key={id} onClick={() => onNavigate(id as View)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
              marginBottom: 2, textAlign: 'left', fontSize: 13,
              fontWeight: active ? 700 : 400,
              background: active ? 'var(--accent-light)' : 'transparent',
              color: active ? 'var(--accent)' : 'var(--muted)',
              transition: 'all 0.15s', fontFamily: 'var(--font-body)',
            }}>
              <Icon size={15} />
              {label}
              {active && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />}
            </button>
          )
        })}
      </nav>

      {/* User info */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '6px 12px', marginBottom: 6 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{user.name}</p>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
            {user.role === 'admin' ? 'Administrador' : user.role === 'viewer' ? 'Visualizador' : 'Usuário'}
          </p>
        </div>
        <button onClick={onLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
          background: 'transparent', color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-body)',
        }}>
          <LogOut size={14} /> Sair
        </button>
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({ user, onNavigate }: { user: User; onNavigate: (v: View) => void }) {
  const [stats, setStats] = useState({ total: 0, pendentes: 0, emAndamento: 0, concluidos: 0 })

  useEffect(() => {
    supabase.from('movimentacoes').select('status').then(({ data }) => {
      if (!data) return
      setStats({
        total:       data.length,
        pendentes:   data.filter(m => m.status === 'pendente').length,
        emAndamento: data.filter(m => m.status === 'em_andamento').length,
        concluidos:  data.filter(m => m.status === 'concluido').length,
      })
    })
  }, [])

  const cards = [
    { label: 'Total de Movimentações', value: stats.total,       icon: Briefcase,   color: '#6366f1', bg: '#eef2ff' },
    { label: 'Pendentes',              value: stats.pendentes,   icon: Clock,       color: '#d97706', bg: '#fffbeb' },
    { label: 'Em Andamento',           value: stats.emAndamento, icon: AlertCircle, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Concluídas',             value: stats.concluidos,  icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={S.pageTitle}>Olá, {user.name.split(' ')[0]} 👋</h2>
        <p style={S.pageSubtitle}>Visão geral das movimentações trabalhistas</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {cards.map(({ label, value, icon: Icon, color, bg }, i) => (
          <div key={i} style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 10 }}>{label}</p>
                <p style={{ fontSize: 34, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{value}</p>
              </div>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={19} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {stats.pendentes > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertCircle size={18} color="#d97706" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: '#92400e', fontSize: 14 }}>
              {stats.pendentes} movimentaç{stats.pendentes !== 1 ? 'ões' : 'ão'} pendente{stats.pendentes !== 1 ? 's' : ''}
            </p>
            <p style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>Requerem atenção ou atualização de status</p>
          </div>
          <button onClick={() => onNavigate('movimentacoes')}
            style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: 9, padding: '8px 18px', fontSize: 13, cursor: 'pointer', fontWeight: 700, flexShrink: 0, fontFamily: 'var(--font-body)' }}>
            Ver Todas
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// SETORES & EMAILS
// ─────────────────────────────────────────────
function GerenciarSetores({ user }: { user: User }) {
  const [setores,        setSetores]        = useState<Setor[]>([])
  const [emails,         setEmails]         = useState<EmailSetor[]>([])
  const [expandido,      setExpandido]      = useState<string | null>(null)
  const [showFormSetor,  setShowFormSetor]  = useState(false)
  const [showFormEmail,  setShowFormEmail]  = useState<string | null>(null)
  const [editando,       setEditando]       = useState<Setor | null>(null)
  const [formSetor,      setFormSetor]      = useState({ nome: '', descricao: '' })
  const [formEmail,      setFormEmail]      = useState({ nome: '', email: '' })
  const isAdmin = user.role === 'admin'

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    const [{ data: s }, { data: e }] = await Promise.all([
      supabase.from('setores').select('*').order('nome'),
      supabase.from('emails_setor').select('*').order('nome'),
    ])
    if (s) setSetores(s)
    if (e) setEmails(e)
  }

  const abrirNovoSetor = () => {
    setEditando(null)
    setFormSetor({ nome: '', descricao: '' })
    setShowFormSetor(true)
  }

  const abrirEditarSetor = (setor: Setor, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditando(setor)
    setFormSetor({ nome: setor.nome, descricao: setor.descricao || '' })
    setShowFormSetor(true)
  }

  const salvarSetor = async () => {
    if (!formSetor.nome.trim()) { alert('Informe o nome do setor'); return }
    if (editando) {
      await supabase.from('setores').update({ nome: formSetor.nome.trim(), descricao: formSetor.descricao }).eq('id', editando.id)
    } else {
      await supabase.from('setores').insert({ nome: formSetor.nome.trim(), descricao: formSetor.descricao, ativo: true })
    }
    setShowFormSetor(false); setEditando(null); loadAll()
  }

  const excluirSetor = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (emails.some(em => em.setor_id === id)) { alert('Remova todos os emails deste setor antes de excluí-lo.'); return }
    if (!confirm('Excluir este setor?')) return
    await supabase.from('setores').delete().eq('id', id); loadAll()
  }

  const salvarEmail = async (setorId: string) => {
    if (!formEmail.nome.trim() || !formEmail.email.trim()) { alert('Preencha nome e email'); return }
    if (!/\S+@\S+\.\S+/.test(formEmail.email)) { alert('E-mail inválido'); return }
    await supabase.from('emails_setor').insert({ setor_id: setorId, nome: formEmail.nome.trim(), email: formEmail.email.trim().toLowerCase(), ativo: true })
    setFormEmail({ nome: '', email: '' }); setShowFormEmail(null); loadAll()
  }

  const excluirEmail = async (id: string) => {
    if (!confirm('Remover este email?')) return
    await supabase.from('emails_setor').delete().eq('id', id); loadAll()
  }

  const toggleEmail = async (id: string, ativo: boolean) => {
    await supabase.from('emails_setor').update({ ativo: !ativo }).eq('id', id); loadAll()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h2 style={S.pageTitle}>Setores & Emails</h2>
          <p style={S.pageSubtitle}>Gerencie os setores e os e-mails que recebem notificações</p>
        </div>
        {isAdmin && <button onClick={abrirNovoSetor} style={S.btnPrimary}><Plus size={14} /> Novo Setor</button>}
      </div>

      {/* Formulário setor */}
      {showFormSetor && (
        <div style={{ ...S.card, marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 18, fontSize: 15 }}>
            {editando ? 'Editar Setor' : 'Novo Setor'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <label style={S.label}>Nome do Setor *</label>
              <input value={formSetor.nome} onChange={e => setFormSetor({ ...formSetor, nome: e.target.value })}
                placeholder="Ex: Recursos Humanos" style={S.input} onFocus={focusAccent} onBlur={blurBorder} />
            </div>
            <div>
              <label style={S.label}>Descrição</label>
              <input value={formSetor.descricao} onChange={e => setFormSetor({ ...formSetor, descricao: e.target.value })}
                placeholder="Opcional" style={S.input} onFocus={focusAccent} onBlur={blurBorder} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setShowFormSetor(false); setEditando(null) }} style={S.btnSecondary}>Cancelar</button>
            <button onClick={salvarSetor} style={S.btnPrimary}>Salvar Setor</button>
          </div>
        </div>
      )}

      {/* Lista de setores */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {setores.map(setor => {
          const emailsSetor = emails.filter(e => e.setor_id === setor.id)
          const exp = expandido === setor.id

          return (
            <div key={setor.id} style={{
              background: 'var(--surface)',
              border: `1px solid ${exp ? 'var(--accent-border)' : 'var(--border)'}`,
              borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s',
            }}>
              {/* Cabeçalho */}
              <div style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                onClick={() => setExpandido(exp ? null : setor.id)}>
                <div style={{ width: 40, height: 40, background: 'var(--accent-light)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building2 size={18} color="var(--accent)" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{setor.nome}</p>
                  {setor.descricao && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{setor.descricao}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 12, padding: '3px 11px', borderRadius: 20, fontWeight: emailsSetor.length > 0 ? 700 : 400,
                    color: emailsSetor.length > 0 ? 'var(--accent)' : 'var(--muted)',
                    background: emailsSetor.length > 0 ? 'var(--accent-light)' : 'var(--bg)',
                    border: `1px solid ${emailsSetor.length > 0 ? 'var(--accent-border)' : 'var(--border)'}`,
                  }}>
                    {emailsSetor.length} email{emailsSetor.length !== 1 ? 's' : ''}
                  </span>
                  {isAdmin && (
                    <>
                      <button onClick={e => abrirEditarSetor(setor, e)} style={S.iconBtn} title="Editar"><Edit size={13} /></button>
                      <button onClick={e => excluirSetor(setor.id, e)} style={{ ...S.iconBtn, color: '#ef4444' }} title="Excluir"><Trash2 size={13} /></button>
                    </>
                  )}
                  <ChevronRight size={15} color="var(--muted)" style={{ transform: exp ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </div>
              </div>

              {/* Painel de emails */}
              {exp && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', background: 'var(--bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>E-mails que recebem notificações</p>
                    {isAdmin && (
                      <button onClick={() => setShowFormEmail(showFormEmail === setor.id ? null : setor.id)}
                        style={{ ...S.btnPrimary, padding: '5px 12px', fontSize: 12 }}>
                        <Plus size={12} /> Adicionar E-mail
                      </button>
                    )}
                  </div>

                  {/* Formulário email */}
                  {showFormEmail === setor.id && (
                    <div style={{ ...S.card, marginBottom: 12, padding: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={S.label}>Nome *</label>
                          <input value={formEmail.nome} onChange={e => setFormEmail({ ...formEmail, nome: e.target.value })}
                            placeholder="Nome do responsável" style={S.input} onFocus={focusAccent} onBlur={blurBorder} />
                        </div>
                        <div>
                          <label style={S.label}>E-mail *</label>
                          <input type="email" value={formEmail.email} onChange={e => setFormEmail({ ...formEmail, email: e.target.value })}
                            placeholder="email@empresa.com" style={S.input} onFocus={focusAccent} onBlur={blurBorder} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setShowFormEmail(null); setFormEmail({ nome: '', email: '' }) }} style={S.btnSecondary}>Cancelar</button>
                        <button onClick={() => salvarEmail(setor.id)} style={S.btnPrimary}>Adicionar</button>
                      </div>
                    </div>
                  )}

                  {/* Lista emails */}
                  {emailsSetor.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '22px 0', color: 'var(--muted)' }}>
                      <Mail size={26} style={{ margin: '0 auto 8px', opacity: 0.25 }} />
                      <p style={{ fontSize: 13 }}>Nenhum e-mail cadastrado para este setor</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {emailsSetor.map(em => (
                        <div key={em.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
                          <div style={{ width: 33, height: 33, borderRadius: '50%', background: em.ativo ? 'var(--accent-light)' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Mail size={13} color={em.ativo ? 'var(--accent)' : '#9ca3af'} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{em.nome}</p>
                            <p style={{ fontSize: 12, color: 'var(--muted)' }}>{em.email}</p>
                          </div>
                          <span style={{
                            fontSize: 11, padding: '3px 9px', borderRadius: 20, border: '1px solid', flexShrink: 0,
                            ...(em.ativo
                              ? { color: '#16a34a', borderColor: '#86efac', background: '#f0fdf4' }
                              : { color: '#6b7280', borderColor: '#d1d5db', background: '#f9fafb' })
                          }}>
                            {em.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                          {isAdmin && (
                            <div style={{ display: 'flex', gap: 2 }}>
                              <button onClick={() => toggleEmail(em.id, em.ativo)} style={S.iconBtn} title={em.ativo ? 'Desativar' : 'Ativar'}>
                                {em.ativo ? <X size={13} /> : <CheckCircle size={13} />}
                              </button>
                              <button onClick={() => excluirEmail(em.id)} style={{ ...S.iconBtn, color: '#ef4444' }}><Trash2 size={13} /></button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {setores.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--muted)' }}>
            <Building2 size={46} style={{ margin: '0 auto 12px', opacity: 0.18 }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>Nenhum setor cadastrado</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Crie o primeiro setor para começar a enviar notificações</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// MOVIMENTAÇÕES
// ─────────────────────────────────────────────
function GerenciarMovimentacoes({ user }: { user: User }) {
  const [movs,         setMovs]         = useState<Movimentacao[]>([])
  const [setores,      setSetores]      = useState<Setor[]>([])
  const [showForm,     setShowForm]     = useState(false)
  const [detalhe,      setDetalhe]      = useState<Movimentacao | null>(null)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroTipo,   setFiltroTipo]   = useState('todos')
  const [enviando,     setEnviando]     = useState(false)
  const [form, setForm] = useState({
    funcionario_nome: '', tipo: 'demissao', prazo: '', descricao: '', setores_ids: [] as string[],
  })

  const isAdmin   = user.role === 'admin'
  const canCreate = user.role === 'admin' || user.role === 'user'

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    const [{ data: m }, { data: s }] = await Promise.all([
      supabase.from('movimentacoes')
        .select('*, movimentacoes_setores(setor_id, status, setores(nome))')
        .order('created_at', { ascending: false }),
      supabase.from('setores').select('*').eq('ativo', true).order('nome'),
    ])
    if (m) setMovs(m as Movimentacao[])
    if (s) setSetores(s)
  }

  const toggleSetor = (id: string) => {
    setForm(f => ({
      ...f,
      setores_ids: f.setores_ids.includes(id)
        ? f.setores_ids.filter(s => s !== id)
        : [...f.setores_ids, id],
    }))
  }

  const resetForm = () => {
    setForm({ funcionario_nome: '', tipo: 'demissao', prazo: '', descricao: '', setores_ids: [] })
    setShowForm(false)
  }

  const salvar = async () => {
    if (!form.funcionario_nome.trim()) { alert('Informe o nome do funcionário'); return }
    if (form.setores_ids.length === 0) { alert('Selecione pelo menos um setor'); return }

    const { data: mov, error } = await supabase
      .from('movimentacoes')
      .insert({
        funcionario_nome: form.funcionario_nome.trim(),
        tipo:             form.tipo,
        prazo:            form.prazo || null,
        descricao:        form.descricao || null,
        status:           'pendente',
        setores_ids:      form.setores_ids,
        criado_por:       user.id,
      })
      .select()
      .single()

    if (error || !mov) { alert('Erro ao salvar: ' + error?.message); return }

    // Relação N:N
    await supabase.from('movimentacoes_setores').insert(
      form.setores_ids.map(sid => ({ movimentacao_id: mov.id, setor_id: sid, status: 'pendente' }))
    )

    // Enviar notificações via Make.com
    setEnviando(true)
    try {
      const { data: emailsData } = await supabase
        .from('emails_setor')
        .select('*, setores(nome)')
        .in('setor_id', form.setores_ids)
        .eq('ativo', true)

      if (emailsData && emailsData.length > 0) {
        const setoresNomes = setores.filter(s => form.setores_ids.includes(s.id)).map(s => s.nome)
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'movement_created',
            movement: {
              id:             mov.id,
              employee_name:  mov.funcionario_nome,
              type:           mov.tipo,
              movimento_tipo: TIPO_LABELS[mov.tipo] || mov.tipo,
              deadline:       mov.prazo,
              description:    mov.descricao,
              status:         mov.status,
              setores:        setoresNomes,
              created_by:     user.name,
            },
            recipients: emailsData.map((e: any) => ({
              email:      e.email,
              name:       e.nome,
              setor_name: e.setores?.nome,
            })),
            email_type: 'criada',
          }),
        })
      }
    } catch (err) { console.error('Erro ao enviar emails:', err) }
    setEnviando(false)

    resetForm(); loadAll()
    alert('Movimentação criada e notificações enviadas!')
  }

  const atualizarStatus = async (id: string, status: string) => {
    await supabase.from('movimentacoes').update({ status }).eq('id', id)
    loadAll()
    setDetalhe(d => d ? { ...d, status } : null)
  }

  const excluir = async (id: string) => {
    if (!confirm('Excluir esta movimentação? Esta ação não pode ser desfeita.')) return
    await supabase.from('movimentacoes_setores').delete().eq('movimentacao_id', id)
    await supabase.from('movimentacoes').delete().eq('id', id)
    loadAll(); setDetalhe(null)
  }

  const diasRestantes = (prazo?: string) => {
    if (!prazo) return null
    return Math.ceil((new Date(prazo + 'T00:00:00').getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
  }

  const filtradas = movs.filter(m => {
    if (filtroStatus !== 'todos' && m.status !== filtroStatus) return false
    if (filtroTipo   !== 'todos' && m.tipo   !== filtroTipo)   return false
    return true
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h2 style={S.pageTitle}>Movimentações</h2>
          <p style={S.pageSubtitle}>Registre e acompanhe as movimentações trabalhistas</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(true)} style={S.btnPrimary}><Plus size={14} /> Nova Movimentação</button>
        )}
      </div>

      {/* ── MODAL NOVA MOVIMENTAÇÃO ── */}
      {showForm && (
        <div style={S.modalOverlay} onClick={e => e.target === e.currentTarget && resetForm()}>
          <div style={{ ...S.modalBox, maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Nova Movimentação</h3>
              <button onClick={resetForm} style={S.iconBtn}><X size={19} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={S.label}>Nome do Funcionário *</label>
                <input value={form.funcionario_nome} onChange={e => setForm({ ...form, funcionario_nome: e.target.value })}
                  placeholder="Nome completo do funcionário" style={S.input} onFocus={focusAccent} onBlur={blurBorder} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={S.label}>Tipo de Movimentação *</label>
                  <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                    style={S.input} onFocus={focusAccent} onBlur={blurBorder}>
                    {Object.entries(TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Prazo</label>
                  <input type="date" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })}
                    style={S.input} onFocus={focusAccent} onBlur={blurBorder} />
                </div>
              </div>

              <div>
                <label style={S.label}>Descrição / Observações</label>
                <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })}
                  rows={3} placeholder="Informações adicionais sobre esta movimentação..."
                  style={{ ...S.input, resize: 'vertical' as const }} onFocus={focusAccent} onBlur={blurBorder} />
              </div>

              <div>
                <label style={S.label}>
                  Setores Envolvidos *{' '}
                  <span style={{ fontWeight: 400, textTransform: 'none' as const, letterSpacing: 0, fontSize: 11 }}>
                    — os e-mails de cada setor selecionado serão notificados
                  </span>
                </label>
                {setores.length === 0 ? (
                  <div style={{ padding: 14, background: '#fef9c3', border: '1px solid #fde047', borderRadius: 9 }}>
                    <p style={{ fontSize: 13, color: '#854d0e' }}>
                      ⚠️ Nenhum setor cadastrado. Acesse <strong>Setores & Emails</strong> para criar setores antes de registrar movimentações.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                    {setores.map(s => {
                      const sel = form.setores_ids.includes(s.id)
                      return (
                        <button key={s.id} onClick={() => toggleSetor(s.id)} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                          borderRadius: 10, border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                          background: sel ? 'var(--accent-light)' : 'var(--bg)',
                          cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                          fontFamily: 'var(--font-body)',
                        }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: 5,
                            border: `2px solid ${sel ? 'var(--accent)' : '#d1d5db'}`,
                            background: sel ? 'var(--accent)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            {sel && <CheckCircle size={11} color="white" />}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: sel ? 700 : 400, color: sel ? 'var(--accent)' : 'var(--text)' }}>
                            {s.nome}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={resetForm} style={S.btnSecondary}>Cancelar</button>
              <button onClick={salvar} disabled={enviando} style={{ ...S.btnPrimary, opacity: enviando ? 0.75 : 1 }}>
                {enviando ? 'Enviando...' : <><Send size={13} /> Criar & Notificar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DETALHE ── */}
      {detalhe && (
        <div style={S.modalOverlay} onClick={e => e.target === e.currentTarget && setDetalhe(null)}>
          <div style={{ ...S.modalBox, maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Movimentação</p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', marginTop: 3 }}>
                  {detalhe.funcionario_nome}
                </h3>
              </div>
              <button onClick={() => setDetalhe(null)} style={S.iconBtn}><X size={19} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {([
                ['Tipo',       TIPO_LABELS[detalhe.tipo] || detalhe.tipo],
                ['Status',     STATUS_CONFIG[detalhe.status]?.label || detalhe.status],
                ['Prazo',      detalhe.prazo ? new Date(detalhe.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem prazo'],
                ['Registrado', new Date(detalhe.created_at).toLocaleDateString('pt-BR')],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>{k}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{v}</p>
                </div>
              ))}
            </div>

            {detalhe.descricao && (
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Descrição</p>
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{detalhe.descricao}</p>
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Setores Envolvidos</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(detalhe.movimentacoes_setores || []).map(ms => (
                  <span key={ms.setor_id} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 700, border: '1px solid var(--accent-border)' }}>
                    {ms.setores?.nome}
                  </span>
                ))}
                {!(detalhe.movimentacoes_setores || []).length && (
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Nenhum setor registrado</span>
                )}
              </div>
            </div>

            {isAdmin && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Alterar Status</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => {
                    const Icon   = v.icon
                    const active = detalhe.status === k
                    return (
                      <button key={k} onClick={() => atualizarStatus(detalhe.id, k)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9,
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                        background: active ? 'var(--accent-light)' : 'var(--surface)',
                        color: active ? 'var(--accent)' : 'var(--text)',
                        cursor: 'pointer', fontSize: 12, fontWeight: active ? 700 : 400,
                        fontFamily: 'var(--font-body)',
                      }}>
                        <Icon size={12} /> {v.label}
                      </button>
                    )
                  })}
                </div>
                <button onClick={() => excluir(detalhe.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                  border: '1px solid #fca5a5', color: '#ef4444', borderRadius: 9,
                  padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)',
                }}>
                  <Trash2 size={12} /> Excluir Movimentação
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FILTROS ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ ...S.input, width: 'auto' }}>
          <option value="todos">Todos os Status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ ...S.input, width: 'auto' }}>
          <option value="todos">Todos os Tipos</option>
          {Object.entries(TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>
          {filtradas.length} resultado{filtradas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── LISTA ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtradas.map(mov => {
          const tipo        = TIPO_BADGE[mov.tipo]         || TIPO_BADGE.outros
          const status      = STATUS_CONFIG[mov.status]    || STATUS_CONFIG.pendente
          const StatusIcon  = status.icon
          const dias        = diasRestantes(mov.prazo)
          const prazoVencido = dias !== null && dias < 0
          const prazoUrgente = dias !== null && dias >= 0 && dias <= 3

          return (
            <div key={mov.id} onClick={() => setDetalhe(mov)} style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(37,99,235,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: tipo.bg, border: `1px solid ${tipo.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={16} color={tipo.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{mov.funcionario_nome}</p>
                  <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 700, border: `1px solid ${tipo.border}`, background: tipo.bg, color: tipo.color }}>
                    {TIPO_LABELS[mov.tipo] || mov.tipo}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {(mov.movimentacoes_setores || []).map(ms => ms.setores?.nome).filter(Boolean).join(' · ')}
                  </span>
                  {mov.prazo && dias !== null && (
                    <span style={{ fontSize: 12, fontWeight: prazoUrgente || prazoVencido ? 700 : 400, color: prazoVencido ? '#ef4444' : prazoUrgente ? '#f59e0b' : 'var(--muted)' }}>
                      {prazoVencido ? `⚠️ Vencido há ${Math.abs(dias)}d` : dias === 0 ? '🔴 Vence hoje' : `📅 ${dias}d`}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 20, border: `1px solid ${status.border}`, background: status.bg, flexShrink: 0 }}>
                <StatusIcon size={11} color={status.color} />
                <span style={{ fontSize: 11, fontWeight: 700, color: status.color }}>{status.label}</span>
              </div>
              <Eye size={14} color="var(--muted)" style={{ flexShrink: 0 }} />
            </div>
          )
        })}

        {filtradas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--muted)' }}>
            <Briefcase size={46} style={{ margin: '0 auto 12px', opacity: 0.18 }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>Nenhuma movimentação encontrada</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Tente ajustar os filtros ou crie uma nova movimentação</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// USUÁRIOS
// ─────────────────────────────────────────────
function GerenciarUsuarios({ user }: { user: User }) {
  const [usuarios, setUsuarios] = useState<User[]>([])

  useEffect(() => {
    supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setUsuarios(data as User[]) })
  }, [])

  const alterarRole = async (id: string, role: string) => {
    const { error } = await supabase.from('users').update({ role }).eq('id', id)
    if (!error) setUsuarios(u => u.map(x => x.id === id ? { ...x, role } : x))
  }

  return (
    <div>
      <h2 style={{ ...S.pageTitle, marginBottom: 6 }}>Usuários</h2>
      <p style={{ ...S.pageSubtitle, marginBottom: 32 }}>Gerencie os usuários e seus níveis de acesso</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {usuarios.map(u => (
          <div key={u.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={16} color="var(--accent)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{u.name}</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{u.email}</p>
            </div>
            {u.id !== user.id ? (
              <select value={u.role} onChange={e => alterarRole(u.id, e.target.value)}
                style={{ ...S.input, width: 'auto', fontSize: 12 }}>
                <option value="admin">Admin</option>
                <option value="user">Usuário</option>
                <option value="viewer">Visualizador</option>
              </select>
            ) : (
              <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent-border)', fontWeight: 700 }}>
                {u.role === 'admin' ? 'Admin (você)' : u.role}
              </span>
            )}
          </div>
        ))}
        {usuarios.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: 14 }}>
            Nenhum usuário encontrado
          </p>
        )}
      </div>
    </div>
  )
}
