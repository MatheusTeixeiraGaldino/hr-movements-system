import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Briefcase, LogOut, Users, Building2, Mail, Clock, CheckCircle,
  Plus, AlertCircle, X, Trash2, FileText, Send, Eye,
  BarChart3, ChevronRight, Shield, Edit, MessageSquare, Filter
} from 'lucide-react'

// ─────────────────────────────────────────────
// SUPABASE + CONSTANTES
// ─────────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase    = createClient(supabaseUrl, supabaseKey)

const WEBHOOK_URL = 'https://hook.eu2.make.com/acgp1d7grpmgeubdn2vm6fwohfs73p7w'
const SESSION_KEY = 'hr_session'

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

interface Team {
  id: string
  name: string
  email: string
  code: string
  created_at: string
}

interface Setor {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
  created_at: string
}



interface TeamResponse {
  id: string
  movement_id: string
  team_id: string
  status: string
  comment?: string
  responded_by?: string
  responded_at?: string
  created_at: string
  teams?: { name: string; email: string }
}

// Movimentação unificada — campos da tabela movements + campos novos de setores
interface Movimentacao {
  id: string
  // campos originais de movements
  employee_name: string
  type: string
  selected_teams: string[]   // array de team_ids
  status: string
  responses?: any
  details?: any
  checklist?: any
  observation?: string
  created_by?: string
  deadline?: string
  created_at: string
  // campos novos adicionados à movements
  setores_ids?: string[]
  // joins
  team_responses?: TeamResponse[]
  movimentacoes_setores?: { setor_id: string; setores: { nome: string } }[]
}

// ─────────────────────────────────────────────
// DOMÍNIO
// ─────────────────────────────────────────────
const TIPO_LABELS: Record<string, string> = {
  demissao:      'Demissão',
  transferencia: 'Transferência',
  alteracao:     'Alteração Salarial',
  promocao:      'Promoção',
  afastamento:   'Afastamento',
  outros:        'Outros',
  // compatibilidade com valores em inglês já existentes
  dismissal:     'Demissão',
  transfer:      'Transferência',
  promotion:     'Promoção',
  leave:         'Afastamento',
  salary_change: 'Alteração Salarial',
  other:         'Outros',
}

const TIPO_BADGE: Record<string, { color: string; border: string; bg: string }> = {
  demissao:      { color: '#dc2626', border: '#fca5a5', bg: '#fef2f2' },
  dismissal:     { color: '#dc2626', border: '#fca5a5', bg: '#fef2f2' },
  transferencia: { color: '#2563eb', border: '#93c5fd', bg: '#eff6ff' },
  transfer:      { color: '#2563eb', border: '#93c5fd', bg: '#eff6ff' },
  alteracao:     { color: '#ca8a04', border: '#fde047', bg: '#fefce8' },
  salary_change: { color: '#ca8a04', border: '#fde047', bg: '#fefce8' },
  promocao:      { color: '#16a34a', border: '#86efac', bg: '#f0fdf4' },
  promotion:     { color: '#16a34a', border: '#86efac', bg: '#f0fdf4' },
  afastamento:   { color: '#9333ea', border: '#d8b4fe', bg: '#faf5ff' },
  leave:         { color: '#9333ea', border: '#d8b4fe', bg: '#faf5ff' },
  outros:        { color: '#4b5563', border: '#d1d5db', bg: '#f9fafb' },
  other:         { color: '#4b5563', border: '#d1d5db', bg: '#f9fafb' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; border: string; bg: string; icon: any }> = {
  pendente:     { label: 'Pendente',     color: '#d97706', border: '#fcd34d', bg: '#fffbeb', icon: Clock       },
  pending:      { label: 'Pendente',     color: '#d97706', border: '#fcd34d', bg: '#fffbeb', icon: Clock       },
  em_andamento: { label: 'Em Andamento', color: '#2563eb', border: '#93c5fd', bg: '#eff6ff', icon: AlertCircle },
  in_progress:  { label: 'Em Andamento', color: '#2563eb', border: '#93c5fd', bg: '#eff6ff', icon: AlertCircle },
  concluido:    { label: 'Concluído',    color: '#16a34a', border: '#86efac', bg: '#f0fdf4', icon: CheckCircle },
  completed:    { label: 'Concluído',    color: '#16a34a', border: '#86efac', bg: '#f0fdf4', icon: CheckCircle },
  cancelado:    { label: 'Cancelado',    color: '#6b7280', border: '#d1d5db', bg: '#f9fafb', icon: X           },
  cancelled:    { label: 'Cancelado',    color: '#6b7280', border: '#d1d5db', bg: '#f9fafb', icon: X           },
}

type View = 'dashboard' | 'movimentacoes' | 'setores' | 'usuarios'

// ─────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────
const S = {
  input: {
    width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
    border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
    outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
    fontFamily: 'var(--font-body)',
  } as React.CSSProperties,
  label: {
    display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text)',
    marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.6,
  } as React.CSSProperties,
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 9, border: 'none',
    background: 'var(--accent)', color: 'white',
    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
  } as React.CSSProperties,
  btnSecondary: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 9, border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)',
  } as React.CSSProperties,
  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: 6,
    borderRadius: 7, color: 'var(--muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  } as React.CSSProperties,
  overlay: {
    position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  } as React.CSSProperties,
  modal: {
    background: 'var(--surface)', borderRadius: 16, padding: 30,
    width: '100%', maxHeight: '92vh', overflowY: 'auto' as const,
    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
  } as React.CSSProperties,
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24,
  } as React.CSSProperties,
  pageTitle:    { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px' } as React.CSSProperties,
  pageSubtitle: { color: 'var(--muted)', fontSize: 14, marginTop: 4 } as React.CSSProperties,
}

const focusAccent = (e: React.FocusEvent<any>) => { e.target.style.borderColor = 'var(--accent)' }
const blurBorder  = (e: React.FocusEvent<any>) => { e.target.style.borderColor = 'var(--border)' }
const getTipoLabel  = (t: string) => TIPO_LABELS[t]  || t
const getTipoBadge  = (t: string) => TIPO_BADGE[t]   || TIPO_BADGE.outros
const getStatusConf = (s: string) => STATUS_CONFIG[s] || STATUS_CONFIG.pendente

// ─────────────────────────────────────────────
// APP
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
      .from('users').select('*')
      .eq('email', email.trim().toLowerCase()).eq('password', password).single()
    if (error || !data) { alert('E-mail ou senha incorretos.'); return }
    localStorage.setItem(SESSION_KEY, JSON.stringify(data))
    setUser(data as User); setView('dashboard')
  }

  const handleLogout = () => { localStorage.removeItem(SESSION_KEY); setUser(null) }

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
        {view === 'dashboard'     && <Dashboard user={user} onNavigate={setView} />}
        {view === 'movimentacoes' && <GerenciarMovimentacoes user={user} />}
        {view === 'setores'       && <GerenciarSetores user={user} />}
        {view === 'usuarios'      && <GerenciarUsuarios user={user} />}
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (e: string, p: string) => void }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  const submit = async () => {
    if (!email || !password) { alert('Preencha e-mail e senha'); return }
    setLoading(true); await onLogin(email, password); setLoading(false)
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
  user: User; currentView: View; onNavigate: (v: View) => void; onLogout: () => void
}) {
  const isAdmin = user.role === 'admin'
  const items = [
    { id: 'dashboard',     label: 'Dashboard',        icon: BarChart3, show: true    },
    { id: 'movimentacoes', label: 'Movimentações',     icon: Briefcase, show: true    },
    { id: 'setores',       label: 'Setores & Emails',  icon: Mail,      show: isAdmin },
    { id: 'usuarios',      label: 'Usuários',          icon: Shield,    show: isAdmin },
  ].filter(i => i.show)

  return (
    <aside style={{ position: 'fixed', top: 0, left: 0, width: 252, height: '100vh', background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
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
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '6px 12px', marginBottom: 6 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{user.name}</p>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
            {user.role === 'admin' ? 'Administrador' : user.role === 'viewer' ? 'Visualizador' : 'Usuário'}
            {user.team_names && user.team_names.length > 0 && ` · ${user.team_names[0]}`}
          </p>
        </div>
        <button onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
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
    // Se não for admin, filtra pelas equipes do usuário
    let query = supabase.from('movements').select('status')
    if (user.role !== 'admin' && user.team_ids && user.team_ids.length > 0) {
      query = query.overlaps('selected_teams', user.team_ids)
    }
    query.then(({ data }) => {
      if (!data) return
      setStats({
        total:       data.length,
        pendentes:   data.filter(m => ['pendente','pending'].includes(m.status)).length,
        emAndamento: data.filter(m => ['em_andamento','in_progress'].includes(m.status)).length,
        concluidos:  data.filter(m => ['concluido','completed'].includes(m.status)).length,
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
        <p style={S.pageSubtitle}>
          {user.role === 'admin' ? 'Visão geral de todas as movimentações' : `Movimentações das suas equipes`}
        </p>
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
// MOVIMENTAÇÕES — usa tabela movements (existente)
// ─────────────────────────────────────────────
function GerenciarMovimentacoes({ user }: { user: User }) {
  const [movs,         setMovs]         = useState<Movimentacao[]>([])
  const [teams,        setTeams]        = useState<Team[]>([])
  const [setores,      setSetores]      = useState<Setor[]>([])
  const [showForm,     setShowForm]     = useState(false)
  const [detalhe,      setDetalhe]      = useState<Movimentacao | null>(null)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroTipo,   setFiltroTipo]   = useState('todos')
  const [enviando,     setEnviando]     = useState(false)
  const [form, setForm] = useState({
    employee_name: '', type: 'demissao', deadline: '',
    observation: '', selected_teams: [] as string[],
    setores_ids: [] as string[],
    details: {} as any, checklist: [] as any[],
  })

  const isAdmin   = user.role === 'admin'
  const canCreate = user.role === 'admin' || user.role === 'user'

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    // 1. Carrega teams e setores
    const [{ data: t }, { data: s }] = await Promise.all([
      supabase.from('teams').select('*').order('name'),
      supabase.from('setores').select('*').eq('ativo', true).order('nome'),
    ])
    if (t) setTeams(t)
    if (s) setSetores(s)

    // 2. Busca movimentações — select simples, sem joins para máxima compatibilidade
    const { data: m, error: mErr } = await supabase
      .from('movements')
      .select('*')
      .order('created_at', { ascending: false })

    if (mErr) {
      console.error('Erro movements:', mErr)
      alert('Erro ao carregar movimentações: ' + mErr.message)
      return
    }
    if (!m || m.length === 0) {
      setMovs([])
      return
    }

    const ids = m.map((x: any) => x.id)

    // 3. Carrega team_responses separadamente
    let responsesMap: Record<string, any[]> = {}
    try {
      const { data: tr } = await supabase
        .from('team_responses')
        .select('*, teams(name, email)')
        .in('movement_id', ids)
      if (tr) {
        tr.forEach((r: any) => {
          if (!responsesMap[r.movement_id]) responsesMap[r.movement_id] = []
          responsesMap[r.movement_id].push(r)
        })
      }
    } catch (_) {}

    // 4. Carrega movimentacoes_setores separadamente
    let setoresMap: Record<string, any[]> = {}
    try {
      const { data: ms } = await supabase
        .from('movimentacoes_setores')
        .select('movimentacao_id, setor_id, setores(nome)')
        .in('movimentacao_id', ids)
      if (ms) {
        ms.forEach((row: any) => {
          if (!setoresMap[row.movimentacao_id]) setoresMap[row.movimentacao_id] = []
          setoresMap[row.movimentacao_id].push(row)
        })
      }
    } catch (_) {}

    // 5. Monta resultado final
    const movsFinal = m.map((mov: any) => ({
      ...mov,
      team_responses:       responsesMap[mov.id] || [],
      movimentacoes_setores: setoresMap[mov.id]  || [],
    }))

    // 6. Filtra por equipe no cliente se não for admin
    if (user.role !== 'admin' && user.team_ids && user.team_ids.length > 0) {
      setMovs(movsFinal.filter((mov: any) =>
        (mov.selected_teams || []).some((tid: string) => (user.team_ids as string[]).includes(tid))
      ) as Movimentacao[])
    } else {
      setMovs(movsFinal as Movimentacao[])
    }
  }

  const toggleItem = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]

  const resetForm = () => {
    setForm({ employee_name: '', type: 'demissao', deadline: '', observation: '', selected_teams: [], setores_ids: [], details: {}, checklist: [] })
    setShowForm(false)
  }

  const salvar = async () => {
    if (!form.employee_name.trim()) { alert('Informe o nome do colaborador'); return }
    if (form.selected_teams.length === 0) { alert('Selecione pelo menos uma equipe'); return }

    const { data: mov, error } = await supabase.from('movements').insert({
      employee_name:  form.employee_name.trim(),
      type:           form.type,
      deadline:       form.deadline || null,
      observation:    form.observation || null,
      selected_teams: form.selected_teams,
      setores_ids:    form.setores_ids,
      status:         'pendente',
      created_by:     user.id,
      details:        form.details || {},
      checklist:      form.checklist || [],
      responses:      {},
    }).select().single()

    if (error || !mov) { alert('Erro ao salvar: ' + error?.message); return }

    // Relação movement_teams
    if (form.selected_teams.length > 0) {
      await supabase.from('movement_teams').insert(
        form.selected_teams.map(tid => ({ movement_id: mov.id, team_id: tid }))
      )
    }

    // Relação movimentacoes_setores (para emails)
    if (form.setores_ids.length > 0) {
      await supabase.from('movimentacoes_setores').insert(
        form.setores_ids.map(sid => ({ movimentacao_id: mov.id, setor_id: sid }))
      )
    }

    // Enviar notificações via Make.com
    setEnviando(true)
    try {
      const { data: emailsData } = await supabase
        .from('emails_setor').select('*, setores(nome)')
        .in('setor_id', form.setores_ids).eq('ativo', true)

      if (emailsData && emailsData.length > 0) {
        const teamsNomes  = teams.filter(t => form.selected_teams.includes(t.id)).map(t => t.name)
        const setoresNomes = setores.filter(s => form.setores_ids.includes(s.id)).map(s => s.nome)
        const tipoLabel   = getTipoLabel(form.type)
        const prazoFmt    = form.deadline ? new Date(form.deadline + 'T00:00:00').toLocaleDateString('pt-BR') : null

        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'movement_created',
            movement: {
              id:             mov.id,
              employee_name:  mov.employee_name,
              type:           mov.type,
              tipo_label:     tipoLabel,
              // Título do email: "Demissão do colaborador João Silva"
              email_subject:  `${tipoLabel} do colaborador ${mov.employee_name}`,
              deadline:       mov.deadline,
              deadline_fmt:   prazoFmt,
              observation:    mov.observation,
              status:         mov.status,
              teams:          teamsNomes,
              setores:        setoresNomes,
              created_by:     user.name,
              // Link para resposta — ajuste a URL conforme seu domínio
              response_link:  `${window.location.origin}/responder/${mov.id}`,
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
    } catch (err) { console.error('Erro webhook:', err) }
    setEnviando(false)

    resetForm(); loadAll()
    alert('Movimentação criada e notificações enviadas!')
  }

  const atualizarStatus = async (id: string, status: string) => {
    await supabase.from('movements').update({ status }).eq('id', id)
    loadAll(); setDetalhe(d => d ? { ...d, status } : null)
  }

  const excluir = async (id: string) => {
    if (!confirm('Excluir esta movimentação?')) return
    await supabase.from('movement_teams').delete().eq('movement_id', id)
    await supabase.from('team_responses').delete().eq('movement_id', id)
    await supabase.from('movimentacoes_setores').delete().eq('movimentacao_id', id)
    await supabase.from('movements').delete().eq('id', id)
    loadAll(); setDetalhe(null)
  }

  const diasRestantes = (d?: string) => {
    if (!d) return null
    return Math.ceil((new Date(d + 'T00:00:00').getTime() - new Date().setHours(0,0,0,0)) / 86400000)
  }

  const filtradas = movs.filter(m => {
    if (filtroStatus !== 'todos') {
      if (filtroStatus === 'pendente'     && !['pendente','pending'].includes(m.status))       return false
      if (filtroStatus === 'em_andamento' && !['em_andamento','in_progress'].includes(m.status)) return false
      if (filtroStatus === 'concluido'    && !['concluido','completed'].includes(m.status))    return false
      if (filtroStatus === 'cancelado'    && !['cancelado','cancelled'].includes(m.status))    return false
    }
    if (filtroTipo !== 'todos' && m.type !== filtroTipo) return false
    return true
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h2 style={S.pageTitle}>Movimentações</h2>
          <p style={S.pageSubtitle}>
            {isAdmin ? 'Todas as movimentações trabalhistas' : 'Movimentações das suas equipes'}
          </p>
        </div>
        {canCreate && <button onClick={() => setShowForm(true)} style={S.btnPrimary}><Plus size={14} /> Nova Movimentação</button>}
      </div>

      {/* ── MODAL NOVA MOVIMENTAÇÃO ── */}
      {showForm && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && resetForm()}>
          <div style={{ ...S.modal, maxWidth: 640 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Nova Movimentação</h3>
              <button onClick={resetForm} style={S.iconBtn}><X size={19} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Nome do colaborador */}
              <div>
                <label style={S.label}>Nome do Colaborador *</label>
                <input value={form.employee_name} onChange={e => setForm({ ...form, employee_name: e.target.value })}
                  placeholder="Nome completo do colaborador" style={S.input} onFocus={focusAccent} onBlur={blurBorder} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Tipo */}
                <div>
                  <label style={S.label}>Tipo de Movimentação *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    style={S.input} onFocus={focusAccent} onBlur={blurBorder}>
                    <option value="demissao">Demissão</option>
                    <option value="transferencia">Transferência</option>
                    <option value="alteracao">Alteração Salarial</option>
                    <option value="promocao">Promoção</option>
                    <option value="afastamento">Afastamento</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                {/* Prazo */}
                <div>
                  <label style={S.label}>Prazo de Resposta</label>
                  <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
                    style={S.input} onFocus={focusAccent} onBlur={blurBorder} />
                </div>
              </div>

              {/* Observação */}
              <div>
                <label style={S.label}>Observações / Detalhes</label>
                <textarea value={form.observation} onChange={e => setForm({ ...form, observation: e.target.value })}
                  rows={3} placeholder="Informações adicionais sobre esta movimentação..."
                  style={{ ...S.input, resize: 'vertical' }} onFocus={focusAccent} onBlur={blurBorder} />
              </div>

              {/* Equipes */}
              <div>
                <label style={S.label}>
                  Equipes Envolvidas *{' '}
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>
                    — as equipes que devem responder a esta movimentação
                  </span>
                </label>
                {teams.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)', padding: 12, background: 'var(--bg)', borderRadius: 9, border: '1px solid var(--border)' }}>Nenhuma equipe cadastrada.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                    {teams.map(t => {
                      const sel = form.selected_teams.includes(t.id)
                      return (
                        <button key={t.id} onClick={() => setForm(f => ({ ...f, selected_teams: toggleItem(f.selected_teams, t.id) }))}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`, background: sel ? 'var(--accent-light)' : 'var(--bg)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'var(--font-body)' }}>
                          <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${sel ? 'var(--accent)' : '#d1d5db'}`, background: sel ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {sel && <CheckCircle size={11} color="white" />}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: sel ? 700 : 400, color: sel ? 'var(--accent)' : 'var(--text)', lineHeight: 1.2 }}>{t.name}</p>
                            {t.code && <p style={{ fontSize: 11, color: 'var(--muted)' }}>{t.code}</p>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Setores para email */}
              <div>
                <label style={S.label}>
                  Setores para Notificação por E-mail{' '}
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>
                    — os e-mails de cada setor selecionado serão notificados via Make.com
                  </span>
                </label>
                {setores.length === 0 ? (
                  <div style={{ padding: 12, background: '#fef9c3', border: '1px solid #fde047', borderRadius: 9 }}>
                    <p style={{ fontSize: 13, color: '#854d0e' }}>
                      ⚠️ Nenhum setor cadastrado. Acesse <strong>Setores & Emails</strong> para criar setores.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                    {setores.map(s => {
                      const sel = form.setores_ids.includes(s.id)
                      return (
                        <button key={s.id} onClick={() => setForm(f => ({ ...f, setores_ids: toggleItem(f.setores_ids, s.id) }))}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: `2px solid ${sel ? '#16a34a' : 'var(--border)'}`, background: sel ? '#f0fdf4' : 'var(--bg)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'var(--font-body)' }}>
                          <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${sel ? '#16a34a' : '#d1d5db'}`, background: sel ? '#16a34a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {sel && <Mail size={10} color="white" />}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: sel ? 700 : 400, color: sel ? '#16a34a' : 'var(--text)' }}>{s.nome}</span>
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
        <DetalheModal
          mov={detalhe} teams={teams} isAdmin={isAdmin}
          onClose={() => setDetalhe(null)}
          onStatusChange={atualizarStatus}
          onDelete={excluir}
        />
      )}

      {/* ── FILTROS ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={13} color="var(--muted)" />
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Filtros:</span>
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ ...S.input, width: 'auto' }}>
          <option value="todos">Todos os Status</option>
          <option value="pendente">Pendente</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="concluido">Concluído</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ ...S.input, width: 'auto' }}>
          <option value="todos">Todos os Tipos</option>
          <option value="demissao">Demissão</option>
          <option value="transferencia">Transferência</option>
          <option value="alteracao">Alteração Salarial</option>
          <option value="promocao">Promoção</option>
          <option value="afastamento">Afastamento</option>
          <option value="outros">Outros</option>
        </select>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>
          {filtradas.length} resultado{filtradas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── LISTA ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtradas.map(mov => {
          const badge  = getTipoBadge(mov.type)
          const sc     = getStatusConf(mov.status)
          const Icon   = sc.icon
          const dias   = diasRestantes(mov.deadline)
          const vencido  = dias !== null && dias < 0
          const urgente  = dias !== null && dias >= 0 && dias <= 3

          // Equipes desta movimentação
          const movTeams = teams.filter(t => (mov.selected_teams || []).includes(t.id))

          return (
            <div key={mov.id} onClick={() => setDetalhe(mov)} style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(37,99,235,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: badge.bg, border: `1px solid ${badge.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={16} color={badge.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{mov.employee_name}</p>
                  <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 700, border: `1px solid ${badge.border}`, background: badge.bg, color: badge.color }}>
                    {getTipoLabel(mov.type)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {movTeams.map(t => t.name).join(' · ')}
                  </span>
                  {mov.deadline && dias !== null && (
                    <span style={{ fontSize: 12, fontWeight: vencido || urgente ? 700 : 400, color: vencido ? '#ef4444' : urgente ? '#f59e0b' : 'var(--muted)' }}>
                      {vencido ? `⚠️ Vencido há ${Math.abs(dias)}d` : dias === 0 ? '🔴 Vence hoje' : `📅 ${dias}d`}
                    </span>
                  )}
                  {/* Contador de respostas */}
                  {(mov.team_responses || []).length > 0 && (
                    <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 3, color: 'var(--muted)' }}>
                      <MessageSquare size={11} /> {mov.team_responses?.length} resposta{mov.team_responses?.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 20, border: `1px solid ${sc.border}`, background: sc.bg, flexShrink: 0 }}>
                <Icon size={11} color={sc.color} />
                <span style={{ fontSize: 11, fontWeight: 700, color: sc.color }}>{sc.label}</span>
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
// MODAL DE DETALHE
// ─────────────────────────────────────────────
function DetalheModal({ mov, teams, isAdmin, onClose, onStatusChange, onDelete }: {
  mov: Movimentacao; teams: Team[]; isAdmin: boolean
  onClose: () => void
  onStatusChange: (id: string, s: string) => void
  onDelete: (id: string) => void
}) {
  const badge      = getTipoBadge(mov.type)
  const sc         = getStatusConf(mov.status)
  const movTeams   = teams.filter(t => (mov.selected_teams || []).includes(t.id))
  const prazoFmt   = mov.deadline ? new Date(mov.deadline + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem prazo'
  const criadoFmt  = new Date(mov.created_at).toLocaleDateString('pt-BR')

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...S.modal, maxWidth: 560 }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, border: `1px solid ${badge.border}`, background: badge.bg, color: badge.color }}>
              {getTipoLabel(mov.type)}
            </span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', marginTop: 8 }}>
              {mov.employee_name}
            </h3>
          </div>
          <button onClick={onClose} style={S.iconBtn}><X size={19} /></button>
        </div>

        {/* Grid de info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {([
            ['Status',     sc.label],
            ['Prazo',      prazoFmt],
            ['Registrado', criadoFmt],
            ['Criado por', mov.created_by || '—'],
          ] as [string,string][]).map(([k, v]) => (
            <div key={k} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>{k}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{v}</p>
            </div>
          ))}
        </div>

        {/* Observação */}
        {mov.observation && (
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Observações</p>
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{mov.observation}</p>
          </div>
        )}

        {/* Details (jsonb) */}
        {mov.details && Object.keys(mov.details).length > 0 && (
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Detalhes</p>
            {Object.entries(mov.details).map(([k, v]) => (
              <p key={k} style={{ fontSize: 12, color: 'var(--text)', marginBottom: 3 }}>
                <span style={{ fontWeight: 700 }}>{k}:</span> {String(v)}
              </p>
            ))}
          </div>
        )}

        {/* Equipes envolvidas */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Equipes Envolvidas</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {movTeams.map(t => (
              <span key={t.id} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 700, border: '1px solid var(--accent-border)' }}>
                {t.name}
              </span>
            ))}
          </div>
        </div>

        {/* Respostas das equipes */}
        {(mov.team_responses || []).length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Respostas das Equipes</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(mov.team_responses || []).map(r => {
                const rsc = getStatusConf(r.status)
                const RIcon = rsc.icon
                return (
                  <div key={r.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: r.comment ? 6 : 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{r.teams?.name || '—'}</p>
                      <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, border: `1px solid ${rsc.border}`, background: rsc.bg, color: rsc.color, fontWeight: 700 }}>
                        <RIcon size={10} /> {rsc.label}
                      </span>
                    </div>
                    {r.comment && <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{r.comment}</p>}
                    {r.responded_at && (
                      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                        {new Date(r.responded_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Setores notificados */}
        {(mov.movimentacoes_setores || []).length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Setores Notificados por E-mail</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(mov.movimentacoes_setores || []).map(ms => (
                <span key={ms.setor_id} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', fontWeight: 700, border: '1px solid #86efac' }}>
                  <Mail size={10} style={{ marginRight: 4, display: 'inline' }} />{ms.setores?.nome}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Alterar status */}
        {isAdmin && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Alterar Status</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {[
                { key: 'pendente', label: 'Pendente' },
                { key: 'em_andamento', label: 'Em Andamento' },
                { key: 'concluido', label: 'Concluído' },
                { key: 'cancelado', label: 'Cancelado' },
              ].map(({ key, label }) => {
                const cfg    = getStatusConf(key)
                const Icon   = cfg.icon
                const active = mov.status === key || (key === 'pendente' && mov.status === 'pending') || (key === 'em_andamento' && mov.status === 'in_progress') || (key === 'concluido' && mov.status === 'completed') || (key === 'cancelado' && mov.status === 'cancelled')
                return (
                  <button key={key} onClick={() => onStatusChange(mov.id, key)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9,
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    background: active ? 'var(--accent-light)' : 'var(--surface)',
                    color: active ? 'var(--accent)' : 'var(--text)',
                    cursor: 'pointer', fontSize: 12, fontWeight: active ? 700 : 400, fontFamily: 'var(--font-body)',
                  }}>
                    <Icon size={12} /> {label}
                  </button>
                )
              })}
            </div>
            <button onClick={() => onDelete(mov.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: 9, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)' }}>
              <Trash2 size={12} /> Excluir Movimentação
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// SETORES & EMAILS
// ─────────────────────────────────────────────
function GerenciarSetores({ user }: { user: User }) {
  const [setores,       setSetores]       = useState<Setor[]>([])
  const [emails,        setEmails]        = useState<any[]>([])
  const [expandido,     setExpandido]     = useState<string | null>(null)
  const [showFormSetor, setShowFormSetor] = useState(false)
  const [showFormEmail, setShowFormEmail] = useState<string | null>(null)
  const [editando,      setEditando]      = useState<Setor | null>(null)
  const [formSetor,     setFormSetor]     = useState({ nome: '', descricao: '' })
  const [formEmail,     setFormEmail]     = useState({ nome: '', email: '' })
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
    if (emails.some(em => em.setor_id === id)) { alert('Remova todos os emails antes de excluir.'); return }
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
          <p style={S.pageSubtitle}>Gerencie setores e os e-mails que recebem notificações de movimentações</p>
        </div>
        {isAdmin && <button onClick={() => { setEditando(null); setFormSetor({ nome: '', descricao: '' }); setShowFormSetor(true) }} style={S.btnPrimary}><Plus size={14} /> Novo Setor</button>}
      </div>

      {showFormSetor && (
        <div style={{ ...S.card, marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 18, fontSize: 15 }}>{editando ? 'Editar Setor' : 'Novo Setor'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <label style={S.label}>Nome *</label>
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
            <button onClick={salvarSetor} style={S.btnPrimary}>Salvar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {setores.map(setor => {
          const emailsSetor = emails.filter(e => e.setor_id === setor.id)
          const exp = expandido === setor.id
          return (
            <div key={setor.id} style={{ background: 'var(--surface)', border: `1px solid ${exp ? 'var(--accent-border)' : 'var(--border)'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}>
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
                  <span style={{ fontSize: 12, padding: '3px 11px', borderRadius: 20, fontWeight: emailsSetor.length > 0 ? 700 : 400, color: emailsSetor.length > 0 ? 'var(--accent)' : 'var(--muted)', background: emailsSetor.length > 0 ? 'var(--accent-light)' : 'var(--bg)', border: `1px solid ${emailsSetor.length > 0 ? 'var(--accent-border)' : 'var(--border)'}` }}>
                    {emailsSetor.length} email{emailsSetor.length !== 1 ? 's' : ''}
                  </span>
                  {isAdmin && (
                    <>
                      <button onClick={e => { e.stopPropagation(); setEditando(setor); setFormSetor({ nome: setor.nome, descricao: setor.descricao || '' }); setShowFormSetor(true) }} style={S.iconBtn}><Edit size={13} /></button>
                      <button onClick={e => excluirSetor(setor.id, e)} style={{ ...S.iconBtn, color: '#ef4444' }}><Trash2 size={13} /></button>
                    </>
                  )}
                  <ChevronRight size={15} color="var(--muted)" style={{ transform: exp ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </div>
              </div>

              {exp && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', background: 'var(--bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>E-mails para notificação</p>
                    {isAdmin && (
                      <button onClick={() => setShowFormEmail(showFormEmail === setor.id ? null : setor.id)}
                        style={{ ...S.btnPrimary, padding: '5px 12px', fontSize: 12 }}>
                        <Plus size={12} /> Adicionar
                      </button>
                    )}
                  </div>
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
                  {emailsSetor.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)' }}>
                      <Mail size={24} style={{ margin: '0 auto 8px', opacity: 0.25 }} />
                      <p style={{ fontSize: 13 }}>Nenhum e-mail cadastrado</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {emailsSetor.map((em: any) => (
                        <div key={em.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
                          <div style={{ width: 33, height: 33, borderRadius: '50%', background: em.ativo ? 'var(--accent-light)' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Mail size={13} color={em.ativo ? 'var(--accent)' : '#9ca3af'} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{em.nome}</p>
                            <p style={{ fontSize: 12, color: 'var(--muted)' }}>{em.email}</p>
                          </div>
                          <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, border: '1px solid', flexShrink: 0, ...(em.ativo ? { color: '#16a34a', borderColor: '#86efac', background: '#f0fdf4' } : { color: '#6b7280', borderColor: '#d1d5db', background: '#f9fafb' }) }}>
                            {em.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                          {isAdmin && (
                            <div style={{ display: 'flex', gap: 2 }}>
                              <button onClick={() => toggleEmail(em.id, em.ativo)} style={S.iconBtn}>{em.ativo ? <X size={13} /> : <CheckCircle size={13} />}</button>
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
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// USUÁRIOS — com seleção de equipes
// ─────────────────────────────────────────────
function GerenciarUsuarios({ user }: { user: User }) {
  const [usuarios, setUsuarios]     = useState<User[]>([])
  const [teams,    setTeams]        = useState<Team[]>([])
  const [editando, setEditando]     = useState<User | null>(null)
  const [formUser, setFormUser]     = useState({ role: 'user', team_ids: [] as string[], team_names: [] as string[] })

  useEffect(() => {
    Promise.all([
      supabase.from('users').select('id,email,name,role,team_id,team_name,team_ids,team_names,created_at').order('created_at', { ascending: false }),
      supabase.from('teams').select('*').order('name'),
    ]).then(([{ data: u }, { data: t }]) => {
      if (u) setUsuarios(u as User[])
      if (t) setTeams(t)
    })
  }, [])

  const abrirEditar = (u: User) => {
    setEditando(u)
    setFormUser({
      role:       u.role,
      team_ids:   u.team_ids || [],
      team_names: u.team_names || [],
    })
  }

  const toggleTeam = (teamId: string, teamName: string) => {
    setFormUser(f => {
      const sel = f.team_ids.includes(teamId)
      return {
        ...f,
        team_ids:   sel ? f.team_ids.filter(id => id !== teamId)     : [...f.team_ids, teamId],
        team_names: sel ? f.team_names.filter(n => n !== teamName)   : [...f.team_names, teamName],
      }
    })
  }

  const salvarUsuario = async () => {
    if (!editando) return
    const { error } = await supabase.from('users').update({
      role:       formUser.role,
      team_ids:   formUser.team_ids,
      team_names: formUser.team_names,
      // compatibilidade com campos legados
      team_id:    formUser.team_ids[0]   || null,
      team_name:  formUser.team_names[0] || null,
    }).eq('id', editando.id)

    if (error) { alert('Erro ao salvar: ' + error.message); return }
    setUsuarios(prev => prev.map(u => u.id === editando.id ? { ...u, ...formUser } : u))
    setEditando(null)
  }

  return (
    <div>
      <h2 style={{ ...S.pageTitle, marginBottom: 6 }}>Usuários</h2>
      <p style={{ ...S.pageSubtitle, marginBottom: 32 }}>Gerencie usuários, funções e equipes</p>

      {/* Modal edição */}
      {editando && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setEditando(null)}>
          <div style={{ ...S.modal, maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Editar Usuário</p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text)', marginTop: 2 }}>{editando.name}</h3>
              </div>
              <button onClick={() => setEditando(null)} style={S.iconBtn}><X size={18} /></button>
            </div>

            {/* Role */}
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Nível de Acesso</label>
              <select value={formUser.role} onChange={e => setFormUser({ ...formUser, role: e.target.value })}
                style={S.input} onFocus={focusAccent} onBlur={blurBorder}>
                <option value="admin">Admin — acesso total</option>
                <option value="user">Usuário — cria e vê movimentações</option>
                <option value="viewer">Visualizador — apenas visualiza</option>
              </select>
            </div>

            {/* Equipes */}
            <div>
              <label style={S.label}>
                Equipes do Usuário{' '}
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>
                  — o usuário verá as movimentações dessas equipes
                </span>
              </label>
              {teams.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>Nenhuma equipe cadastrada no banco.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                  {teams.map(t => {
                    const sel = formUser.team_ids.includes(t.id)
                    return (
                      <button key={t.id} onClick={() => toggleTeam(t.id, t.name)} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                        borderRadius: 10, border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                        background: sel ? 'var(--accent-light)' : 'var(--bg)',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                      }}>
                        <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${sel ? 'var(--accent)' : '#d1d5db'}`, background: sel ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {sel && <CheckCircle size={11} color="white" />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: sel ? 700 : 400, color: sel ? 'var(--accent)' : 'var(--text)', lineHeight: 1.2 }}>{t.name}</p>
                          {t.code && <p style={{ fontSize: 11, color: 'var(--muted)' }}>{t.code}</p>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditando(null)} style={S.btnSecondary}>Cancelar</button>
              <button onClick={salvarUsuario} style={S.btnPrimary}>Salvar Alterações</button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {usuarios.map(u => (
          <div key={u.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={16} color="var(--accent)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{u.name}</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{u.email}</p>
              {/* Equipes do usuário */}
              {u.team_names && u.team_names.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                  {u.team_names.map((tn, i) => (
                    <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent-border)', fontWeight: 600 }}>
                      {tn}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span style={{
              fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 700,
              ...(u.role === 'admin'
                ? { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }
                : u.role === 'viewer'
                  ? { background: '#f9fafb', color: '#6b7280', border: '1px solid #d1d5db' }
                  : { background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent-border)' })
            }}>
              {u.role === 'admin' ? 'Admin' : u.role === 'viewer' ? 'Visualizador' : 'Usuário'}
            </span>
            {u.id !== user.id && (
              <button onClick={() => abrirEditar(u)} style={{ ...S.iconBtn, color: 'var(--accent)' }}><Edit size={15} /></button>
            )}
          </div>
        ))}
        {usuarios.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: 14 }}>Nenhum usuário encontrado</p>
        )}
      </div>
    </div>
  )
}
