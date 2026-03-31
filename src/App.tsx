import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, UserX, AlertCircle, Mail, Settings, Loader2, UserPlus, Clock, CheckSquare, Square, Upload, File, X, Download, Building2, Plus, Trash2, ChevronRight } from 'lucide-react';
import { supabase } from './lib/supabase';
import RelatorioView from './components/RelatorioView';

type UserRole = 'admin' | 'responsavel' | 'team_member';
type MovementType = 'demissao' | 'transferencia' | 'alteracao' | 'promocao';

interface Attachment {
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}



interface Movement {
  id: string;
  type: MovementType;
  employee_name: string;
  selected_teams: string[];
  status: 'pending' | 'in_progress' | 'completed';
  responses: Record<string, { 
    status: string; 
    comment?: string; 
    date?: string; 
    checklist?: Record<string, boolean>;
    attachments?: Attachment[];
    history?: Array<{
      user_name: string;
      user_email: string;
      action: 'created' | 'updated';
      date: string;
      timestamp: string;
    }>;
  }>;
  created_at: string;
  created_by: string;
  details: Record<string, any>;
  observation?: string | null;
  deadline?: string | null;
}

const TEAMS = [
  { id: 'rh', name: 'Recursos Humanos' },
  { id: 'ponto', name: 'Ponto' },
  { id: 'transporte', name: 'Transporte' },
  { id: 'ti', name: 'T.I' },
  { id: 'comunicacao', name: 'Comunicação' },
  { id: 'seguranca', name: 'Segurança do Trabalho' },
  { id: 'ambulatorio', name: 'Ambulatório' },
  { id: 'financeiro', name: 'Financeiro' },
  { id: 'dp', name: 'DP' },
  { id: 'treinamento', name: 'Treinamento e Desenvolvimento' }
];

const MOVEMENT_TYPES = {
  demissao: { label: 'Demissão', icon: UserX },
  transferencia: { label: 'Transferência', icon: Users },
  alteracao: { label: 'Alteração Salarial', icon: TrendingUp },
  promocao: { label: 'Promoção', icon: TrendingUp }
};

const CHECKLISTS: Record<MovementType, Record<string, string[]>> = {
  demissao: {
    rh: ['Requisição de desligamento', 'Entrevista de desligamento'],
    ponto: ['Entrega espelho de ponto'],
    transporte: ['Valores de multas', 'Baixa de carro responsável'],
    ti: ['Baixa de usuário'],
    seguranca: ['Entrega de EPIs', 'Sem acidente de trabalho', 'Não é membro da CIPA'],
    ambulatorio: ['Valores farmácia', 'Baixa plano de saúde', 'Baixa plano odonto', 'Exame demissional', 'Valores plano de saúde'],
    financeiro: ['Existe multas', 'Existe adiantamento', 'Valores a descontar'],
    dp: ['Comissões recebidas', 'Aviso prévio assinado', 'Valores marmita'],
    treinamento: ['Valores a devolver bolsa de estudos', 'Valores a devolver adiantamento treinamentos'],
    comunicacao:['Retirar dos grupos de Whatsapp e comunicação']
  },
  transferencia: {
    rh: ['Transferência temporária', 'Colaborador apto para a função'],
    ponto: ['Análise alteração no ponto do colaborador'],
    transporte: ['Colaborador apto a dirigir veículo da empresa'],
    ti: ['Alteração de acessos colaborador'],
    seguranca: ['Ordem de serviço assinada', 'Colaborador habilitado em NR'],
    treinamento: ['Treinamentos obrigatórios'],
    ambulatorio: ['ASO'],
    dp: ['Transferência programada', 'Necessário criação de função ou seção']
  },
  alteracao: {
    rh: ['Alteração temporária', 'Colaborador apto para a função'],
    ponto: ['Análise alteração no ponto do colaborador'],
    transporte: ['Colaborador apto a dirigir veículo da empresa'],
    ti: ['Alteração de acessos colaborador'],
    seguranca: ['Ordem de serviço assinada', 'Colaborador habilitado em NR'],
    treinamento: ['Treinamentos obrigatórios'],
    ambulatorio: ['ASO'],
    dp: ['Alteração programada', 'Necessário criação de função ou seção']
  },
  promocao: {
    rh: ['Colaborador apto para a função', 'Testes necessários para função', 'Promoção para liderança de equipe, fez treinamento de líderes'],
    ponto: ['Análise alteração no ponto do colaborador'],
    transporte: ['Colaborador apto a dirigir veículo da empresa'],
    ti: ['Alteração de acessos colaborador'],
    seguranca: ['Ordem de serviço assinada', 'Colaborador habilitado em NR'],
    treinamento: ['Treinamentos obrigatórios'],
    ambulatorio: ['ASO', 'Alteração plano de saúde'],
    dp: ['Promoção programada', 'Necessário criação de função ou seção', 'Alteração seguro de vida'],
    comunicacao:['Programado post de promoção']
  }
};

async function uploadFile(file: File, movementId: string, teamId: string): Promise<Attachment | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${movementId}/${teamId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('movement-attachments')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('movement-attachments')
      .getPublicUrl(fileName);

    return {
      name: file.name,
      url: publicUrl,
      size: file.size,
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return null;
  }
}

async function deleteFile(url: string): Promise<boolean> {
  try {
    const path = url.split('/movement-attachments/')[1];
    if (!path) return false;

    const { error } = await supabase.storage
      .from('movement-attachments')
      .remove([path]);

    return !error;
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return false;
  }
}

function AttachmentManager({ attachments, onAdd, onRemove, disabled }: { 
  attachments: Attachment[]; 
  onAdd: (file: File) => void; 
  onRemove: (attachment: Attachment) => void;
  disabled?: boolean;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('O arquivo deve ter no máximo 10MB');
        return;
      }
      onAdd(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Anexos</label>
        {!disabled && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm"
          >
            <Upload className="w-4 h-4" />
            Adicionar Arquivo
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
        disabled={disabled}
      />

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(attachment.size)} • {new Date(attachment.uploadedAt).toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Baixar arquivo"><Download className="w-4 h-4" /></a>
                {!disabled && <button type="button" onClick={() => onRemove(attachment)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Remover arquivo"><X className="w-4 h-4" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {attachments.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed">Nenhum anexo adicionado</p>
      )}
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [view, setView] = useState('login');
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTeamId, setActiveTeamId] = useState<string>('');

  useEffect(() => {
    if (currentUser) {
      if (!activeTeamId && currentUser.team_ids.length > 0) {
        setActiveTeamId(currentUser.team_ids[0]);
      }
      loadMovements();
    }
  }, [currentUser]);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('movements').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <LoginComponent setCurrentUser={setCurrentUser} setView={setView} setActiveTeamId={setActiveTeamId} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', fontFamily: 'var(--font-body)' }}>
      {/* ── SIDEBAR ── */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, width: 240, height: '100vh',
        background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)',
        display: 'flex', flexDirection: 'column', zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>RH Movimentações</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Sistema Trabalhista</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, padding: '0 8px 8px' }}>Menu</p>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '▦' },
            ...(((['admin', 'responsavel'] as string[]).includes(currentUser.role)) ? [
              { id: 'relatorio', label: 'Relatório', icon: '📊' },
            ] : []),
            ...(currentUser.role === 'admin' ? [
              { id: 'setores', label: 'Setores & Emails', icon: '✉' },
              { id: 'usuarios', label: 'Usuários', icon: '👤' },
            ] : []),
          ].map(item => {
            const active = view === item.id;
            return (
              <button key={item.id} onClick={() => setView(item.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                marginBottom: 2, textAlign: 'left', fontSize: 13,
                fontWeight: active ? 700 : 400,
                background: active ? 'var(--accent-light)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--muted)',
                transition: 'all 0.15s', fontFamily: 'var(--font-body)',
              }}>
                <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                {item.label}
                {active && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
              </button>
            );
          })}
        </nav>

        {/* Equipe ativa */}
        {currentUser.team_ids.length > 0 && (
          <div style={{ padding: '10px 10px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, padding: '0 2px' }}>
              {currentUser.team_ids.length > 1 ? 'Equipe ativa' : 'Equipe'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {currentUser.team_ids.map((teamId: string, index: number) => {
                const active = teamId === activeTeamId;
                return (
                  <button key={teamId} onClick={() => setActiveTeamId(teamId)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                    borderRadius: 8, border: `1px solid ${active ? 'var(--accent-border)' : 'transparent'}`,
                    background: active ? 'var(--accent-light)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--muted)',
                    cursor: 'pointer', fontSize: 12, fontWeight: active ? 700 : 400,
                    fontFamily: 'var(--font-body)', textAlign: 'left',
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? 'var(--accent)' : 'var(--muted-light)', flexShrink: 0 }} />
                    {currentUser.team_names[index]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Usuário + logout */}
        <div style={{ padding: '12px 10px' }}>
          <div style={{ padding: '6px 10px', marginBottom: 4 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{currentUser.name}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
              {currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'responsavel' ? 'Responsável' : 'Membro de equipe'}
            </p>
          </div>
          <button onClick={() => { setCurrentUser(null); setView('login'); }} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--muted)', fontSize: 13,
            fontFamily: 'var(--font-body)', transition: 'all 0.15s',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sair
          </button>
        </div>
      </aside>

      {/* ── CONTEÚDO ── */}
      <main style={{ flex: 1, marginLeft: 240, padding: '32px 36px', minHeight: '100vh', animation: 'fadeIn 0.2s ease' }}>
        {view === 'dashboard' && (
          <DashboardView currentUser={currentUser} movements={movements} loading={loading} loadMovements={loadMovements} setSelectedMovement={setSelectedMovement} setView={setView} activeTeamId={activeTeamId} />
        )}
        {view === 'detail' && selectedMovement && (
          <DetailView currentUser={currentUser} selectedMovement={selectedMovement} setView={setView} setSelectedMovement={setSelectedMovement} loadMovements={loadMovements} activeTeamId={activeTeamId} />
        )}
        {view === 'setores' && currentUser.role === 'admin' && (
          <SetoresView />
        )}
        {view === 'usuarios' && currentUser.role === 'admin' && (
          <UsuariosView />
        )}
        {view === 'relatorio' && ((['admin', 'responsavel'] as string[]).includes(currentUser.role)) && (
          <RelatorioView
            currentUser={currentUser}
            movements={movements}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
}

function LoginComponent({ setCurrentUser, setView, setActiveTeamId }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoadingLogin(true);
    try {
      const { data, error } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).eq('password', password).single();
      if (error || !data) { setError('E-mail ou senha incorretos.'); return; }
      setCurrentUser(data);
      if (data.team_ids?.length > 0) setActiveTeamId(data.team_ids[0]);
      setView('dashboard');
    } catch { setError('Erro ao fazer login.'); }
    finally { setLoadingLogin(false); }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
    border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
    outline: 'none', fontFamily: 'var(--font-body)',
  };
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text)',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 18, padding: '44px 40px', width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 52, height: 52, background: 'var(--accent)', borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text)' }}>RH Movimentações</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>Sistema de Movimentações Trabalhistas</p>
        </div>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com" style={inp}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>
          <div>
            <label style={lbl}>Senha</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" style={{ ...inp, paddingRight: 44 }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              <button type="button" onClick={() => setShowPassword(s => !s)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0,
              }}>
                {showPassword
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>
          {error && <p style={{ fontSize: 13, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>{error}</p>}
          <button type="submit" disabled={loadingLogin} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px 18px', borderRadius: 10, border: 'none',
            background: 'var(--accent)', color: 'white', fontSize: 14, fontWeight: 700,
            cursor: loadingLogin ? 'not-allowed' : 'pointer', opacity: loadingLogin ? 0.75 : 1,
            fontFamily: 'var(--font-body)', marginTop: 4,
          }}>
            {loadingLogin ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Entrando...</> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}


function ChangePasswordModal({ onClose, currentUser }: { onClose: () => void; currentUser: any }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const { data: userCheck, error: checkErr } = await supabase
        .from('users')
        .select('id')
        .eq('email', currentUser.email)
        .eq('password', currentPassword)
        .single();

      if (checkErr || !userCheck) {
        setError('Senha atual incorreta.');
        setLoading(false);
        return;
      }

      const { error: updateErr } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', userCheck.id);

      if (updateErr) {
        setError('Erro ao salvar nova senha: ' + updateErr.message);
        setLoading(false);
        return;
      }

      alert('Senha alterada com sucesso!');
      onClose();
    } catch (err) {
      setError('Erro inesperado ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Alterar Senha</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">✕</button>
        </div>
        <form onSubmit={handleChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha Atual</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2" required disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2" required minLength={6} disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2" required disabled={loading} />
          </div>
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300">
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RegisterUserModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'team_member' as UserRole,
    can_manage_demissoes: false,
    can_manage_transferencias: false
  });
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || selectedTeamIds.length === 0) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const selectedTeamNames = selectedTeamIds.map(id => 
        TEAMS.find(t => t.id === id)?.name || ''
      );

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          name: formData.name,
          email: formData.email.toLowerCase(),
          password: formData.password,
          role: formData.role,
          can_manage_demissoes: formData.can_manage_demissoes,
          can_manage_transferencias: formData.can_manage_transferencias,
          team_ids: selectedTeamIds,
          team_names: selectedTeamNames
        })
        .select();

      if (insertError) {
        console.error('Erro ao inserir:', insertError);
        if (insertError.code === '23505') {
          setError('Este email já está cadastrado');
        } else if (insertError.message) {
          setError(`Erro: ${insertError.message}`);
        } else {
          setError('Erro ao cadastrar usuário');
        }
        return;
      }

      alert('Usuário cadastrado com sucesso!');
      onClose();
    } catch (err: any) {
      console.error('Erro geral:', err);
      setError(`Erro ao cadastrar usuário: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-3 border-b">
          <h3 className="text-lg font-bold">Cadastrar Novo Usuário</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900 text-xl">✕</button>
        </div>
        <form onSubmit={handleRegister} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" required disabled={loading} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" required disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
              <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" required minLength={6} placeholder="Mínimo 6 caracteres" disabled={loading} />
            </div>
          </div>
          <div className="border-t pt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipes * ({selectedTeamIds.length} selecionada{selectedTeamIds.length !== 1 ? 's' : ''})
            </label>
            {selectedTeamIds.length === 0 && (
              <p className="text-xs text-red-600 mb-2">⚠️ Selecione pelo menos uma equipe</p>
            )}
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50">
              {TEAMS.map(t => (
                <label key={t.id} className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition text-xs ${selectedTeamIds.includes(t.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <input type="checkbox" checked={selectedTeamIds.includes(t.id)} onChange={() => { setSelectedTeamIds(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]); }} className="w-3 h-3" disabled={loading} />
                  <span className="text-xs">{t.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="border-t pt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Usuário *</label>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex items-start gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="role" value="team_member" checked={formData.role === 'team_member'} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole, can_manage_demissoes: false, can_manage_transferencias: false })} className="w-4 h-4 mt-0.5" disabled={loading} />
                <div><p className="font-medium text-sm">Membro da Equipe</p><p className="text-xs text-gray-600">Responde pareceres</p></div>
              </label>
              <label className="flex items-start gap-2 p-2 border-2 border-blue-200 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100">
                <input type="radio" name="role" value="responsavel" checked={formData.role === 'responsavel'} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })} className="w-4 h-4 mt-0.5" disabled={loading} />
                <div><p className="font-medium text-sm">Responsável</p><p className="text-xs text-gray-600">Cria movimentações</p></div>
              </label>
              <label className="flex items-start gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="role" value="admin" checked={formData.role === 'admin'} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})} className="w-4 h-4 mt-0.5" disabled={loading} />
                <div><p className="font-medium text-sm">Administrador</p><p className="text-xs text-gray-600">Acesso total</p></div>
              </label>
            </div>
          </div>
          {(formData.role === 'admin' || formData.role === 'responsavel') && (
            <div className="border-t pt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissões</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={formData.can_manage_demissoes} onChange={(e) => setFormData({...formData, can_manage_demissoes: e.target.checked})} className="w-4 h-4" disabled={loading} />
                  <span className="text-sm">Demissões</span>
                </label>
                <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={formData.can_manage_transferencias} onChange={(e) => setFormData({...formData, can_manage_transferencias: e.target.checked})} className="w-4 h-4" disabled={loading} />
                  <span className="text-sm">Transferências/Alterações</span>
                </label>
              </div>
            </div>
          )}
          {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm">{error}</div>}
          <div className="flex gap-2 pt-2 sticky bottom-0 bg-white border-t mt-3">
            <button type="submit" disabled={loading || selectedTeamIds.length === 0} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2 text-sm">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Cadastrando...</> : 'Cadastrar Usuário'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 text-sm" disabled={loading}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DashboardView({ currentUser, movements, loading, loadMovements, setSelectedMovement, setView, activeTeamId }: any) {
  const [showNewMovement, setShowNewMovement] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [movementType, setMovementType] = useState<MovementType | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [filterType, setFilterType] = useState<MovementType | 'all'>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedSetorIds, setSelectedSetorIds] = useState<string[]>([]);

  const isAdmin = currentUser?.role === 'admin';
  const isResponsavel = currentUser?.role === 'responsavel';
  const canCreateDemissao = (isAdmin || isResponsavel) && currentUser?.can_manage_demissoes;
  const canCreateTransferencia = (isAdmin || isResponsavel) && currentUser?.can_manage_transferencias;

  const isOverdue = (deadline?: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const getProgress = (m: Movement) => {
    const completed = m.selected_teams.filter(t => m.responses[t]?.status === 'completed').length;
    return { completed, total: m.selected_teams.length, percentage: m.selected_teams.length > 0 ? (completed / m.selected_teams.length) * 100 : 0 };
  };

  const handleCreate = async () => {
    if (!formData.employeeName?.trim() || selectedTeams.length === 0) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    setLoadingCreate(true);
    try {
      const responsesObj = selectedTeams.reduce((acc, teamId) => ({ ...acc, [teamId]: { status: 'pending', checklist: {}, attachments: [] } }), {});
      const detailsWithObservation = { ...formData, observation: formData.observation || '' };
      const newMovement: any = {
        type: movementType!,
        employee_name: formData.employeeName,
        selected_teams: selectedTeams,
        status: 'pending' as const,
        responses: responsesObj,
        created_by: currentUser?.name || '',
        details: detailsWithObservation
      };

      if (formData.deadline) newMovement.deadline = formData.deadline;

      const { error } = await supabase.from('movements').insert([newMovement]);
      if (error) throw error;

      const { data: usersData } = await supabase.from('users').select('email, name, team_ids, team_names').overlaps('team_ids', selectedTeams);

      if (usersData && usersData.length > 0) {
        const expandedRecipients = usersData.flatMap((user: any) =>
          user.team_ids.map((teamId: string, index: number) => {
            if (selectedTeams.includes(teamId)) return { email: user.email, name: user.name, team_id: teamId, team_name: user.team_names[index] };
            return null;
          }).filter((item: any) => item !== null)
        );
        fetch('https://hook.eu2.make.com/acgp1d7grpmgeubdn2vm6fwohfs73p7w', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'movement_created', movement: { employee_name: formData.employeeName, type: movementType!, movimento_tipo: MOVEMENT_TYPES[movementType as MovementType].label, created_by: currentUser?.name || '', deadline: formData.deadline, selected_teams: selectedTeams }, recipients: expandedRecipients, email_type: 'created' })
        }).catch(e => console.error('Webhook erro:', e));
      }

      if (selectedSetorIds.length > 0) {
        try {
          const { data: emailsData } = await supabase.from('emails_setor').select('*, setores(nome)').in('setor_id', selectedSetorIds).eq('ativo', true);
          if (emailsData && emailsData.length > 0) {
            const tipoLabel = MOVEMENT_TYPES[movementType as MovementType].label;
            const prazoFmt = formData.deadline ? new Date(formData.deadline + 'T00:00:00').toLocaleDateString('pt-BR') : null;
            fetch('https://hook.eu2.make.com/acgp1d7grpmgeubdn2vm6fwohfs73p7w', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'movement_created', movement: { employee_name: formData.employeeName, type: movementType!, tipo_label: tipoLabel, email_subject: `${tipoLabel} do colaborador ${formData.employeeName}`, created_by: currentUser?.name || '', deadline: formData.deadline, deadline_fmt: prazoFmt, observation: formData.observation || '', response_link: `${window.location.origin}/responder/`, selected_teams: selectedTeams }, recipients: emailsData.map((e: any) => ({ email: e.email, name: e.nome, setor_name: e.setores?.nome })), email_type: 'setor_notification' })
            }).catch(e => console.error('Webhook setores erro:', e));
          }
        } catch (err) { console.error('Erro ao buscar emails dos setores:', err); }
      }

      alert('Movimentação criada!');
      await loadMovements();
      setShowNewMovement(false); setMovementType(null); setFormData({}); setSelectedTeams([]);
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoadingCreate(false);
    }
  };

  const myMovs = movements.filter((m: Movement) => {
    if (isAdmin) return m.created_by === currentUser?.name || m.selected_teams.some((t: string) => currentUser?.team_ids.includes(t));
    return m.selected_teams.includes(activeTeamId);
  });

  const pending = myMovs.filter((m: Movement) => {
    if (m.created_by === currentUser?.name && !m.selected_teams.includes(activeTeamId)) return m.status !== 'completed';
    return m.responses[activeTeamId]?.status === 'pending';
  });

  const completed = myMovs.filter((m: Movement) => {
    if (m.created_by === currentUser?.name && !m.selected_teams.includes(activeTeamId)) return m.status === 'completed';
    return m.responses[activeTeamId]?.status === 'completed';
  });

  const getFilteredMovements = () => {
    let filtered = showCompleted ? completed : pending;
    if (filterType !== 'all') filtered = filtered.filter((m: Movement) => m.type === filterType);
    return filtered;
  };

  const filteredMovements = getFilteredMovements();

  const isDashboardReminderActive = () => {
    const today = new Date();
    const day = today.getDate();
    return day >= 15 && day <= 20;
  };

  const getCountByType = (type: MovementType, includeCompleted: boolean = false) => {
    const movs = includeCompleted ? myMovs : pending;
    return movs.filter((m: Movement) => m.type === type).length;
  };

  const isPost20th = () => {
    const today = new Date();
    return today.getDate() > 20;
  };

  return (
    <div>
      {isDashboardReminderActive() && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
          <AlertCircle className="w-5 h-5 text-blue-600 inline mr-2" />
          <span className="font-medium text-blue-800">Lembrete: Para garantir o processamento no mesmo mês, faça o cadastro das movimentações até o dia 20. Cadastros após essa data podem seguir para o mês seguinte.</span>
        </div>
      )}
      {pending.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
          <Clock className="w-5 h-5 text-yellow-600 inline mr-2" />
          <span className="font-medium text-yellow-800">Você tem {pending.length} movimentação(ões) pendente(s) de parecer</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Dashboard - {showCompleted ? 'Respondidas' : 'Pendentes'}</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowChangePassword(true)} className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm"><Settings className="w-4 h-4" />Senha</button>
          </div>
        </div>

        {(canCreateDemissao || canCreateTransferencia) && (
          <div className="mb-6 pb-6 border-b">
            <h3 className="font-semibold mb-3">Nova Movimentação</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {canCreateDemissao && (
                <button onClick={() => { setShowNewMovement(true); setMovementType('demissao'); }} className="p-4 border-2 border-red-200 rounded-lg hover:bg-red-50">
                  <UserX className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Demissão</p>
                </button>
              )}
              {canCreateTransferencia && (
                <>
                  <button onClick={() => { setShowNewMovement(true); setMovementType('transferencia'); }} className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Transferência</p>
                  </button>
                  <button onClick={() => { setShowNewMovement(true); setMovementType('alteracao'); }} className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50">
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Alteração</p>
                  </button>
                  <button onClick={() => { setShowNewMovement(true); setMovementType('promocao'); }} className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50">
                    <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Promoção</p>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button onClick={() => setShowCompleted(false)} className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${!showCompleted ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>⏳ Pendentes ({pending.length})</button>
          <button onClick={() => setShowCompleted(true)} className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${showCompleted ? 'bg-green-100 text-green-800 border-2 border-green-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>✓ Respondidas ({completed.length})</button>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-3">Filtrar por Tipo</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <button onClick={() => setFilterType('all')} className={`p-3 border-2 rounded-lg transition ${filterType === 'all' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
              <div className="text-center"><p className="text-2xl font-bold">{showCompleted ? completed.length : pending.length}</p><p className="text-xs font-medium mt-1">Todas</p></div>
            </button>
            <button onClick={() => setFilterType('demissao')} className={`p-3 border-2 rounded-lg transition ${filterType === 'demissao' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
              <div className="text-center"><UserX className="w-6 h-6 mx-auto mb-1 text-red-600" /><p className="text-xl font-bold">{getCountByType('demissao', showCompleted)}</p><p className="text-xs font-medium">Demissões</p></div>
            </button>
            <button onClick={() => setFilterType('transferencia')} className={`p-3 border-2 rounded-lg transition ${filterType === 'transferencia' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
              <div className="text-center"><Users className="w-6 h-6 mx-auto mb-1 text-blue-600" /><p className="text-xl font-bold">{getCountByType('transferencia', showCompleted)}</p><p className="text-xs font-medium">Transferências</p></div>
            </button>
            <button onClick={() => setFilterType('alteracao')} className={`p-3 border-2 rounded-lg transition ${filterType === 'alteracao' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
              <div className="text-center"><TrendingUp className="w-6 h-6 mx-auto mb-1 text-green-600" /><p className="text-xl font-bold">{getCountByType('alteracao', showCompleted)}</p><p className="text-xs font-medium">Alterações</p></div>
            </button>
            <button onClick={() => setFilterType('promocao')} className={`p-3 border-2 rounded-lg transition ${filterType === 'promocao' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
              <div className="text-center"><TrendingUp className="w-6 h-6 mx-auto mb-1 text-purple-600" /><p className="text-xl font-bold">{getCountByType('promocao', showCompleted)}</p><p className="text-xs font-medium">Promoções</p></div>
            </button>
          </div>
        </div>

        <h3 className="font-semibold mb-3">
          {filterType === 'all' ? `Todas as Movimentações ${showCompleted ? 'Respondidas' : 'Pendentes'}` : `${MOVEMENT_TYPES[filterType as MovementType].label} ${showCompleted ? 'Respondidas' : 'Pendentes'}`} ({filteredMovements.length})
        </h3>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="space-y-3">
            {filteredMovements.map((m: Movement) => {
              const Icon = MOVEMENT_TYPES[m.type as MovementType].icon;
              const prog = getProgress(m);
              const myResp = m.responses[activeTeamId];
              const overdue = isOverdue(m.deadline);
              return (
                <div key={m.id} className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer ${overdue && !showCompleted ? 'border-red-300 bg-red-50' : ''}`} onClick={() => { setSelectedMovement(m); setView('detail'); }}>
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6" />
                      <div>
                        <h3 className="font-semibold">{m.employee_name}</h3>
                        <p className="text-sm text-gray-600">{MOVEMENT_TYPES[m.type as MovementType].label}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {m.deadline && <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${overdue && !showCompleted ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}><Clock className="w-3 h-3" />{new Date(m.deadline).toLocaleDateString('pt-BR')}</span>}
                      <span className={`text-xs px-2 py-1 rounded ${myResp?.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{myResp?.status === 'completed' ? '✓' : '⏳'}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Progresso geral: {prog.completed}/{prog.total} equipes</div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${prog.percentage}%` }}></div></div>
                </div>
              );
            })}
            {filteredMovements.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-lg">{showCompleted ? '🎉 Nenhuma movimentação respondida ainda' : '✅ Nenhuma movimentação pendente'}</p>
                <p className="text-gray-400 text-sm mt-2">{showCompleted ? 'Quando você responder movimentações, elas aparecerão aqui' : 'Você está em dia com todas as suas tarefas!'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} currentUser={currentUser} />}
      {showNewMovement && movementType && (
        <NewMovementModal
          movementType={movementType} formData={formData} setFormData={setFormData}
          selectedTeams={selectedTeams} setSelectedTeams={setSelectedTeams}
          selectedSetorIds={selectedSetorIds} setSelectedSetorIds={setSelectedSetorIds}
          loading={loadingCreate}
          onClose={() => { setShowNewMovement(false); setMovementType(null); setFormData({}); setSelectedTeams([]); setSelectedSetorIds([]); }}
          onSubmit={handleCreate} isPost20th={isPost20th}
        />
      )}
    </div>
  );
}

function NewMovementModal({ movementType, formData, setFormData, selectedTeams, setSelectedTeams, selectedSetorIds, setSelectedSetorIds, loading, onClose, onSubmit, isPost20th }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full my-8 p-6">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-bold">Nova {MOVEMENT_TYPES[movementType as MovementType].label}</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">✕</button>
        </div>
        {isPost20th() && ['transferencia', 'alteracao', 'promocao'].includes(movementType) && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
            <AlertCircle className="w-5 h-5 text-red-600 inline mr-2" />
            <span className="font-medium text-red-800">Lembrete: Movimentações cadastradas após o dia 20 podem ser processadas no mês seguinte.</span>
          </div>
        )}
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Colaborador *</label>
            <input type="text" placeholder="Digite o nome completo" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, employeeName: e.target.value})} />
          </div>
          {movementType === 'demissao' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data do Desligamento</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, dismissalDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Empresa/Coligada</label>
                <input type="text" placeholder="Nome da empresa" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, company: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Setor</label>
                <input type="text" placeholder="Setor do colaborador" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, sector: e.target.value})} />
              </div>
            </>
          )}
          {movementType !== 'demissao' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Setor Atual</label>
                  <input type="text" placeholder="Setor atual" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, oldSector: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Setor Destino</label>
                  <input type="text" placeholder="Novo setor" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, newSector: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Função Atual</label>
                  <input type="text" placeholder="Função atual" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, oldPosition: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Função Destino</label>
                  <input type="text" placeholder="Nova função" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, newPosition: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data da Mudança</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, changeDate: e.target.value})} />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Limite para Respostas</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, deadline: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observações Gerais</label>
            <textarea placeholder="Digite observações adicionais..." className="w-full border rounded-lg px-3 py-2 h-24" onChange={(e) => setFormData({...formData, observation: e.target.value})} />
          </div>
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">Selecione as Equipes * ({selectedTeams.length} selecionadas)</label>
            <div className="grid grid-cols-2 gap-2">
              {TEAMS.map(t => (
                <label key={t.id} className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer ${selectedTeams.includes(t.id) ? 'border-blue-500 bg-blue-50' : ''}`}>
                  <input type="checkbox" checked={selectedTeams.includes(t.id)} onChange={() => setSelectedTeams((prev: string[]) => prev.includes(t.id) ? prev.filter((id: string) => id !== t.id) : [...prev, t.id])} className="w-4 h-4" />
                  <span className="text-sm">{t.name}</span>
                </label>
              ))}
            </div>
          </div>
          <SetorEmailSelector selectedSetorIds={selectedSetorIds} setSelectedSetorIds={setSelectedSetorIds} />
          <button onClick={onSubmit} disabled={!formData.employeeName || selectedTeams.length === 0 || loading} className="w-full bg-blue-600 text-white py-2.5 rounded-lg disabled:bg-gray-300 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Criando...</> : 'Criar Movimentação'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailView({ currentUser, selectedMovement, setView, setSelectedMovement, loadMovements, activeTeamId }: any) {
  const [comment, setComment] = useState('');
  const [loadingSub, setLoadingSub] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(selectedMovement.details);
  const [checklist, setChecklist] = useState<Record<string, boolean>>(selectedMovement.responses[activeTeamId]?.checklist || {});
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>(selectedMovement.responses[activeTeamId]?.attachments || []);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [editSelectedTeams, setEditSelectedTeams] = useState<string[]>(selectedMovement.selected_teams);

  const isMyTeam = selectedMovement.selected_teams.includes(activeTeamId);
  const myResp = activeTeamId ? selectedMovement.responses[activeTeamId] : null;
  const hasResponded = myResp?.status === 'completed';
  const isAdmin = currentUser?.role === 'admin';

  const userTeamChecklist: string[] = CHECKLISTS[selectedMovement.type as MovementType]?.[activeTeamId || ''] || [];

  const handleStartEdit = () => {
    if (myResp) {
      setComment(myResp.comment || '');
      setChecklist(myResp.checklist || {});
      setAttachments(myResp.attachments || []);
      setIsEditingResponse(true);
    }
  };

  const handleChecklistToggle = (item: string) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const handleAddAttachment = async (file: File) => {
    setUploadingFile(true);
    try {
      const attachment = await uploadFile(file, selectedMovement.id, activeTeamId);
      if (attachment) { setAttachments(prev => [...prev, attachment]); }
      else { alert('Erro ao fazer upload do arquivo'); }
    } catch (error) {
      alert('Erro ao fazer upload do arquivo');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveAttachment = async (attachment: Attachment) => {
    if (!confirm('Deseja remover este arquivo?')) return;
    const success = await deleteFile(attachment.url);
    if (success) { setAttachments(prev => prev.filter(a => a.url !== attachment.url)); }
    else { alert('Erro ao remover arquivo'); }
  };

  const allChecklistCompleted = userTeamChecklist.length > 0 && userTeamChecklist.every(checkItem => checklist[checkItem]);

  const handleSubmit = async () => {
    if (!comment.trim()) { alert('Por favor, adicione um comentário'); return; }
    if (userTeamChecklist.length > 0 && !allChecklistCompleted) { alert('Por favor, complete todos os itens do checklist antes de enviar'); return; }
    setLoadingSub(true);
    try {
      const now = new Date();
      const action = hasResponded ? 'updated' : 'created';
      const existingHistory = myResp?.history || [];
      const newHistoryEntry = { user_name: currentUser.name, user_email: currentUser.email, action: action, date: now.toISOString().split('T')[0], timestamp: now.toISOString() };
      const updated = { ...selectedMovement.responses, [activeTeamId!]: { status: 'completed', comment: comment.trim(), date: now.toISOString().split('T')[0], checklist: checklist, attachments: attachments, history: [...existingHistory, newHistoryEntry] } };
      const allDone = selectedMovement.selected_teams.every((id: string) => updated[id]?.status === 'completed');
      const { error } = await supabase.from('movements').update({ responses: updated, status: allDone ? 'completed' : 'in_progress' }).eq('id', selectedMovement.id);
      if (error) throw error;
      alert(hasResponded ? 'Parecer atualizado com sucesso!' : 'Parecer enviado com sucesso!');
      await loadMovements();
      setView('dashboard');
      setSelectedMovement(null);
    } catch (err) {
      alert('Erro ao enviar parecer');
    } finally {
      setLoadingSub(false);
    }
  };

  const handleUpdate = async () => {
    setLoadingSub(true);
    try {
      const updatedResponses = { ...selectedMovement.responses };
      editSelectedTeams.forEach(teamId => { if (!updatedResponses[teamId]) { updatedResponses[teamId] = { status: 'pending', checklist: {}, attachments: [] }; } });
      Object.keys(updatedResponses).forEach(teamId => { if (!editSelectedTeams.includes(teamId)) { delete updatedResponses[teamId]; } });
      const allDone = editSelectedTeams.every(id => updatedResponses[id]?.status === 'completed');
      const { error } = await supabase.from('movements').update({
        details: editData, employee_name: editData.employeeName || selectedMovement.employee_name,
        selected_teams: editSelectedTeams, responses: updatedResponses,
        status: allDone ? 'completed' : (Object.values(updatedResponses).some((r: any) => r.status === 'completed') ? 'in_progress' : 'pending')
      }).eq('id', selectedMovement.id);
      if (error) throw error;

      const newTeams = editSelectedTeams.filter(id => !selectedMovement.selected_teams.includes(id));
      if (newTeams.length > 0) {
        const { data: newUsersData } = await supabase.from('users').select('email, name, team_ids, team_names').overlaps('team_ids', newTeams);
        if (newUsersData && newUsersData.length > 0) {
          const expandedRecipients = newUsersData.flatMap((user: any) => user.team_ids.map((teamId: string, index: number) => { if (newTeams.includes(teamId)) return { email: user.email, name: user.name, team_id: teamId, team_name: user.team_names[index] }; return null; }).filter((item: any) => item !== null));
          fetch('https://hook.eu2.make.com/acgp1d7grpmgeubdn2vm6fwohfs73p7w', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'movement_created', movement: { employee_name: editData.employeeName || selectedMovement.employee_name, type: selectedMovement.type, movimento_tipo: MOVEMENT_TYPES[selectedMovement.type as MovementType].label, created_by: selectedMovement.created_by, deadline: selectedMovement.deadline, selected_teams: newTeams }, recipients: expandedRecipients, email_type: 'created' }) }).catch(e => console.error('Webhook erro:', e));
        }
      }

      const { data: usersData } = await supabase.from('users').select('email, name, team_ids, team_names').overlaps('team_ids', editSelectedTeams);
      if (usersData && usersData.length > 0) {
        const expandedRecipients = usersData.flatMap((user: any) => user.team_ids.map((teamId: string, index: number) => { if (editSelectedTeams.includes(teamId)) return { email: user.email, name: user.name, team_id: teamId, team_name: user.team_names[index] }; return null; }).filter((item: any) => item !== null));
        fetch('https://hook.eu2.make.com/ype19l4x522ymrkbmqhm9on10szsc62v', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'movement_updated', movement: { employee_name: editData.employeeName || selectedMovement.employee_name, type: selectedMovement.type, movimento_tipo: MOVEMENT_TYPES[selectedMovement.type as MovementType].label, created_by: selectedMovement.created_by, deadline: selectedMovement.deadline, selected_teams: editSelectedTeams }, recipients: expandedRecipients, updated_by: currentUser?.name || '', email_type: 'updated' }) }).catch(e => console.error('Webhook erro:', e));
      }

      alert('Movimentação atualizada!');
      await loadMovements();
      setIsEditing(false);
    } catch (err) {
      alert('Erro ao atualizar');
    } finally {
      setLoadingSub(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta movimentação?')) return;
    setLoadingSub(true);
    try {
      const { error } = await supabase.from('movements').delete().eq('id', selectedMovement.id);
      if (error) throw error;
      alert('Movimentação excluída!');
      await loadMovements();
      setView('dashboard');
      setSelectedMovement(null);
    } catch (err) {
      alert('Erro ao excluir');
    } finally {
      setLoadingSub(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{selectedMovement.employee_name}</h2>
          <p className="text-gray-600">{MOVEMENT_TYPES[selectedMovement.type as MovementType].label}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && !isEditing && (
            <>
              <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Editar</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Excluir</button>
            </>
          )}
          <button onClick={() => { setView('dashboard'); setSelectedMovement(null); }} className="text-gray-600 hover:text-gray-900">← Voltar</button>
        </div>
      </div>

      {isEditing ? (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
          <h3 className="font-semibold mb-3">Editar Informações</h3>
          <div>
            <label className="block text-sm font-medium mb-2">Nome do Colaborador</label>
            <input type="text" value={editData.employeeName || selectedMovement.employee_name} onChange={(e) => setEditData({...editData, employeeName: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
          </div>
          {selectedMovement.type === 'demissao' && (
            <>
              <div><label className="block text-sm font-medium mb-2">Data do Desligamento</label><input type="date" value={editData.dismissalDate || ''} onChange={(e) => setEditData({...editData, dismissalDate: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-sm font-medium mb-2">Empresa</label><input type="text" value={editData.company || ''} onChange={(e) => setEditData({...editData, company: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-sm font-medium mb-2">Setor</label><input type="text" value={editData.sector || ''} onChange={(e) => setEditData({...editData, sector: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
            </>
          )}
          {selectedMovement.type !== 'demissao' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2">Setor Atual</label><input type="text" value={editData.oldSector || ''} onChange={(e) => setEditData({...editData, oldSector: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                <div><label className="block text-sm font-medium mb-2">Setor Destino</label><input type="text" value={editData.newSector || ''} onChange={(e) => setEditData({...editData, newSector: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2">Função Atual</label><input type="text" value={editData.oldPosition || ''} onChange={(e) => setEditData({...editData, oldPosition: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                <div><label className="block text-sm font-medium mb-2">Função Destino</label><input type="text" value={editData.newPosition || ''} onChange={(e) => setEditData({...editData, newPosition: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-2">Data da Mudança</label><input type="date" value={editData.changeDate || ''} onChange={(e) => setEditData({...editData, changeDate: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
            </>
          )}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">Equipes Selecionadas ({editSelectedTeams.length} selecionadas)</label>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-3">
              <p className="text-xs text-blue-800 mb-2">ℹ️ <strong>Importante:</strong> Ao adicionar novas equipes, elas receberão notificação por email. Ao remover equipes, suas respostas serão perdidas.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {TEAMS.map(t => {
                const wasOriginallySelected = selectedMovement.selected_teams.includes(t.id);
                const hasResponse = selectedMovement.responses[t.id]?.status === 'completed';
                const isSelected = editSelectedTeams.includes(t.id);
                return (
                  <label key={t.id} className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'} ${hasResponse && !isSelected ? 'opacity-50' : ''}`}>
                    <input type="checkbox" checked={isSelected} onChange={() => {
                      if (hasResponse && isSelected) { if (!confirm(`A equipe "${t.name}" já respondeu esta movimentação. Tem certeza que deseja removê-la? A resposta será perdida.`)) return; }
                      setEditSelectedTeams((prev: string[]) => prev.includes(t.id) ? prev.filter((id: string) => id !== t.id) : [...prev, t.id]);
                    }} className="w-4 h-4" />
                    <div className="flex-1">
                      <span className="text-sm">{t.name}</span>
                      {hasResponse && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">✓ Respondida</span>}
                      {!wasOriginallySelected && isSelected && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Nova</span>}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <button onClick={handleUpdate} disabled={loadingSub || editSelectedTeams.length === 0} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300">{loadingSub ? 'Salvando...' : 'Salvar'}</button>
            <button onClick={() => { setIsEditing(false); setEditSelectedTeams(selectedMovement.selected_teams); }} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">Informações da Movimentação</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-600 font-medium">Criado por:</span><p className="text-gray-900">{selectedMovement.created_by}</p></div>
            <div><span className="text-gray-600 font-medium">Data de criação:</span><p className="text-gray-900">{new Date(selectedMovement.created_at).toLocaleDateString('pt-BR')}</p></div>
            {selectedMovement.deadline && <div><span className="text-gray-600 font-medium">Prazo limite:</span><p className="text-gray-900">{new Date(selectedMovement.deadline).toLocaleDateString('pt-BR')}</p></div>}
            {Object.entries(selectedMovement.details).map(([key, value]) => {
              const labels: any = { dismissalDate: 'Data do Desligamento', company: 'Empresa', sector: 'Setor', oldSector: 'Setor Atual', newSector: 'Setor Destino', oldPosition: 'Função Atual', newPosition: 'Função Destino', changeDate: 'Data da Mudança' };
              if (key === 'observation') return null;
              return (<div key={key}><span className="text-gray-600 font-medium">{labels[key] || key}:</span><p className="text-gray-900">{typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/) ? new Date(value).toLocaleDateString('pt-BR') : String(value)}</p></div>);
            })}
          </div>
          {(selectedMovement.details?.observation || selectedMovement.observation) && (
            <div className="mt-4 pt-4 border-t">
              <span className="text-gray-600 font-medium">Observações:</span>
              <p className="text-sm text-gray-700 mt-2 bg-white p-3 rounded border">{selectedMovement.details?.observation || selectedMovement.observation}</p>
            </div>
          )}
        </div>
      )}

      <h3 className="font-semibold mb-3">Pareceres das Equipes</h3>
      <div className="space-y-3 mb-6">
        {selectedMovement.selected_teams.map((id: string) => {
          const team = TEAMS.find(t => t.id === id);
          const resp = selectedMovement.responses[id];
          const isMine = id === activeTeamId;
          if (!isAdmin && !isMine) return null;
          return (
            <div key={id} className={`border rounded-lg p-4 ${isMine ? 'border-blue-500 bg-blue-50' : ''}`}>
              <div className="flex justify-between mb-2">
                <span className="font-medium">{team?.name} {isMine && '(Sua Equipe)'}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${resp?.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{resp?.status === 'completed' ? '✓ Respondido' : '⏳ Pendente'}</span>
                  {resp?.history && resp.history.length > 0 && (
                    <button onClick={() => setShowHistory(showHistory === id ? null : id)} className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" />Histórico
                    </button>
                  )}
                </div>
              </div>
              {showHistory === id && resp?.history && (
                <div className="mb-3 bg-gray-50 border rounded p-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Histórico de Alterações:</p>
                  <div className="space-y-2">
                    {resp.history.map((entry: any, idx: number) => (
                      <div key={idx} className="text-xs bg-white p-2 rounded border">
                        <div className="flex justify-between"><span className="font-medium text-gray-900">{entry.user_name}</span><span className="text-gray-500">{new Date(entry.timestamp).toLocaleString('pt-BR')}</span></div>
                        <div className="text-gray-600 mt-1"><span className={`inline-block px-2 py-0.5 rounded ${entry.action === 'created' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{entry.action === 'created' ? 'Criou o parecer' : 'Atualizou o parecer'}</span><span className="ml-2">({entry.user_email})</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {resp?.checklist && Object.keys(resp.checklist).length > 0 && (
                <div className="mt-3 bg-white p-3 rounded border">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Checklist:</p>
                  <div className="space-y-1">
                    {Object.entries(resp.checklist).map(([item, checked]: [string, any]) => (
                      <div key={item} className="flex items-center gap-2 text-sm">
                        {checked ? <CheckSquare className="w-4 h-4 text-green-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                        <span className={checked ? 'text-gray-900' : 'text-gray-500'}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {resp?.attachments && resp.attachments.length > 0 && (
                <div className="mt-3 bg-white p-3 rounded border">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Anexos ({resp.attachments.length}):</p>
                  <AttachmentManager attachments={resp.attachments} onAdd={() => {}} onRemove={() => {}} disabled={true} />
                </div>
              )}
              {resp?.comment && (
                <div className="mt-2">
                  <p className="text-sm bg-white p-3 rounded border">{resp.comment}</p>
                  <p className="text-xs text-gray-500 mt-1">Respondido em {new Date(resp.date!).toLocaleDateString('pt-BR')}{resp.history && resp.history.length > 1 && ' (editado)'}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isMyTeam && !hasResponded && (
        <div className="border-t pt-6">
          {userTeamChecklist.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><CheckSquare className="w-5 h-5" />Checklist de Verificação</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                {userTeamChecklist.map((checkItem: string) => (
                  <label key={checkItem} className="flex items-start gap-3 cursor-pointer hover:bg-blue-100 p-2 rounded transition">
                    <input type="checkbox" checked={checklist[checkItem] || false} onChange={() => handleChecklistToggle(checkItem)} className="mt-1 w-5 h-5 rounded border-gray-300" />
                    <span className="text-sm flex-1">{checkItem}</span>
                  </label>
                ))}
                <div className="mt-4 pt-3 border-t border-blue-200"><p className="text-xs text-gray-600">{userTeamChecklist.filter((itm: string) => checklist[itm]).length} de {userTeamChecklist.length} itens concluídos</p></div>
              </div>
            </div>
          )}
          <div className="mb-6">
            <AttachmentManager attachments={attachments} onAdd={handleAddAttachment} onRemove={handleRemoveAttachment} disabled={uploadingFile} />
            {uploadingFile && <div className="flex items-center gap-2 text-sm text-blue-600 mt-2"><Loader2 className="w-4 h-4 animate-spin" />Fazendo upload do arquivo...</div>}
          </div>
          <h3 className="font-semibold mb-3">Adicionar Parecer</h3>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Digite seu parecer sobre esta movimentação..." className="w-full border rounded-lg p-3 h-32" disabled={loadingSub} />
          <button onClick={handleSubmit} disabled={!comment.trim() || loadingSub || uploadingFile || (userTeamChecklist.length > 0 && !allChecklistCompleted)} className="mt-3 bg-blue-600 text-white px-6 py-2.5 rounded-lg disabled:bg-gray-300 flex items-center gap-2">
            {loadingSub ? <><Loader2 className="w-5 h-5 animate-spin" />Enviando...</> : 'Enviar Parecer'}
          </button>
          {userTeamChecklist.length > 0 && !allChecklistCompleted && <p className="text-sm text-red-600 mt-2">Complete todos os itens do checklist antes de enviar</p>}
        </div>
      )}

      {isMyTeam && hasResponded && !isEditingResponse && (
        <div className="border-t pt-6 space-y-3">
          <div className="bg-green-50 p-4 rounded flex items-center justify-between">
            <span className="text-green-800 font-medium">✓ Você já respondeu esta movimentação</span>
            <button onClick={handleStartEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Editar Parecer</button>
          </div>
        </div>
      )}

      {isMyTeam && hasResponded && isEditingResponse && (
        <div className="border-t pt-6">
          {userTeamChecklist.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><CheckSquare className="w-5 h-5" />Checklist de Verificação</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                {userTeamChecklist.map((checkItem: string) => (
                  <label key={checkItem} className="flex items-start gap-3 cursor-pointer hover:bg-blue-100 p-2 rounded transition">
                    <input type="checkbox" checked={checklist[checkItem] || false} onChange={() => handleChecklistToggle(checkItem)} className="mt-1 w-5 h-5 rounded border-gray-300" />
                    <span className="text-sm flex-1">{checkItem}</span>
                  </label>
                ))}
                <div className="mt-4 pt-3 border-t border-blue-200"><p className="text-xs text-gray-600">{userTeamChecklist.filter((itm: string) => checklist[itm]).length} de {userTeamChecklist.length} itens concluídos</p></div>
              </div>
            </div>
          )}
          <div className="mb-6">
            <AttachmentManager attachments={attachments} onAdd={handleAddAttachment} onRemove={handleRemoveAttachment} disabled={uploadingFile} />
            {uploadingFile && <div className="flex items-center gap-2 text-sm text-blue-600 mt-2"><Loader2 className="w-4 h-4 animate-spin" />Fazendo upload do arquivo...</div>}
          </div>
          <h3 className="font-semibold mb-3">Editar Parecer</h3>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Digite seu parecer sobre esta movimentação..." className="w-full border rounded-lg p-3 h-32" disabled={loadingSub} />
          <div className="flex gap-2 mt-3">
            <button onClick={handleSubmit} disabled={!comment.trim() || loadingSub || uploadingFile || (userTeamChecklist.length > 0 && !allChecklistCompleted)} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg disabled:bg-gray-300 flex items-center gap-2">
              {loadingSub ? <><Loader2 className="w-5 h-5 animate-spin" />Salvando...</> : 'Salvar Alterações'}
            </button>
            <button onClick={() => { setIsEditingResponse(false); setComment(''); setChecklist(myResp?.checklist || {}); setAttachments(myResp?.attachments || []); }} className="px-6 py-2.5 bg-gray-300 rounded-lg hover:bg-gray-400" disabled={loadingSub}>Cancelar</button>
          </div>
          {userTeamChecklist.length > 0 && !allChecklistCompleted && <p className="text-sm text-red-600 mt-2">Complete todos os itens do checklist antes de salvar</p>}
        </div>
      )}
    </div>
  );
}

function SetorEmailSelector({ selectedSetorIds, setSelectedSetorIds }: { selectedSetorIds: string[]; setSelectedSetorIds: (ids: string[]) => void; }) {
  const [setores, setSetores] = useState<Setor[]>([]);

  useEffect(() => {
    supabase.from('setores').select('*').eq('ativo', true).order('nome').then(({ data }) => { if (data) setSetores(data); });
  }, []);

  if (setores.length === 0) return null;

  const toggle = (id: string) => setSelectedSetorIds(selectedSetorIds.includes(id) ? selectedSetorIds.filter(s => s !== id) : [...selectedSetorIds, id]);

  return (
    <div className="border-t pt-4 mt-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">Setor do Funcionário para Notificação por E-mail<span className="text-gray-400 font-normal ml-1">(opcional)</span></label>
      <p className="text-xs text-gray-500 mb-3">Os e-mails cadastrados nos setores selecionados receberão notificação desta movimentação.</p>
      <div className="grid grid-cols-2 gap-2">
        {setores.map(s => {
          const sel = selectedSetorIds.includes(s.id);
          return (
            <label key={s.id} className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition ${sel ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="checkbox" checked={sel} onChange={() => toggle(s.id)} className="w-4 h-4" />
              <span className="text-sm">{s.nome}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

interface Setor {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
}

interface EmailSetor {
  id: string;
  setor_id: string;
  nome: string;
  email: string;
  ativo: boolean;
  created_at: string;
}

function SetoresView() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [emails, setEmails] = useState<EmailSetor[]>([]);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [showFormSetor, setShowFormSetor] = useState(false);
  const [editando, setEditando] = useState<Setor | null>(null);
  const [showFormEmail, setShowFormEmail] = useState<string | null>(null);
  const [formSetor, setFormSetor] = useState({ nome: '', descricao: '' });
  const [formEmail, setFormEmail] = useState({ nome: '', email: '' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [{ data: s }, { data: e }] = await Promise.all([supabase.from('setores').select('*').order('nome'), supabase.from('emails_setor').select('*').order('nome')]);
    if (s) setSetores(s);
    if (e) setEmails(e);
  };

  const salvarSetor = async () => {
    if (!formSetor.nome.trim()) { alert('Informe o nome do setor'); return; }
    if (editando) { await supabase.from('setores').update({ nome: formSetor.nome.trim(), descricao: formSetor.descricao }).eq('id', editando.id); }
    else { await supabase.from('setores').insert({ nome: formSetor.nome.trim(), descricao: formSetor.descricao, ativo: true }); }
    setShowFormSetor(false); setEditando(null); setFormSetor({ nome: '', descricao: '' }); loadAll();
  };

  const excluirSetor = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (emails.some(em => em.setor_id === id)) { alert('Remova todos os emails antes de excluir.'); return; }
    if (!confirm('Excluir este setor?')) return;
    await supabase.from('setores').delete().eq('id', id); loadAll();
  };

  const salvarEmail = async (setorId: string) => {
    if (!formEmail.nome.trim() || !formEmail.email.trim()) { alert('Preencha nome e email'); return; }
    if (!/\S+@\S+\.\S+/.test(formEmail.email)) { alert('E-mail inválido'); return; }
    await supabase.from('emails_setor').insert({ setor_id: setorId, nome: formEmail.nome.trim(), email: formEmail.email.trim().toLowerCase(), ativo: true });
    setFormEmail({ nome: '', email: '' }); setShowFormEmail(null); loadAll();
  };

  const excluirEmail = async (id: string) => {
    if (!confirm('Remover este email?')) return;
    await supabase.from('emails_setor').delete().eq('id', id); loadAll();
  };

  const toggleEmailAtivo = async (id: string, ativo: boolean) => {
    await supabase.from('emails_setor').update({ ativo: !ativo }).eq('id', id); loadAll();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Setores & Emails</h2>
          <p className="text-sm text-gray-600 mt-1">Gerencie os setores e emails para notificações de movimentações</p>
        </div>
        <button onClick={() => { setEditando(null); setFormSetor({ nome: '', descricao: '' }); setShowFormSetor(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Novo Setor
        </button>
      </div>

      {showFormSetor && (
        <div className="bg-gray-50 border rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-4">{editando ? 'Editar Setor' : 'Novo Setor'}</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label><input value={formSetor.nome} onChange={e => setFormSetor({ ...formSetor, nome: e.target.value })} placeholder="Ex: Recursos Humanos" className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label><input value={formSetor.descricao} onChange={e => setFormSetor({ ...formSetor, descricao: e.target.value })} placeholder="Opcional" className="w-full border rounded-lg px-3 py-2" /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowFormSetor(false); setEditando(null); }} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Cancelar</button>
            <button onClick={salvarSetor} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {setores.map(setor => {
          const emailsSetor = emails.filter(e => e.setor_id === setor.id);
          const exp = expandido === setor.id;
          return (
            <div key={setor.id} className={`border rounded-lg overflow-hidden transition-all ${exp ? 'border-blue-300' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpandido(exp ? null : setor.id)}>
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><Building2 className="w-5 h-5 text-blue-600" /></div>
                <div className="flex-1"><p className="font-semibold text-gray-900">{setor.nome}</p>{setor.descricao && <p className="text-xs text-gray-500">{setor.descricao}</p>}</div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${emailsSetor.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{emailsSetor.length} email{emailsSetor.length !== 1 ? 's' : ''}</span>
                  <button onClick={e => { e.stopPropagation(); setEditando(setor); setFormSetor({ nome: setor.nome, descricao: setor.descricao || '' }); setShowFormSetor(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Settings className="w-4 h-4" /></button>
                  <button onClick={e => excluirSetor(setor.id, e)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${exp ? 'rotate-90' : ''}`} />
                </div>
              </div>
              {exp && (
                <div className="border-t bg-gray-50 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-semibold text-gray-700">E-mails para notificação</p>
                    <button onClick={() => setShowFormEmail(showFormEmail === setor.id ? null : setor.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-3 h-3" /> Adicionar</button>
                  </div>
                  {showFormEmail === setor.id && (
                    <div className="bg-white border rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div><label className="block text-xs font-medium text-gray-700 mb-1">Nome *</label><input value={formEmail.nome} onChange={e => setFormEmail({ ...formEmail, nome: e.target.value })} placeholder="Nome do responsável" className="w-full border rounded px-2 py-1.5 text-sm" /></div>
                        <div><label className="block text-xs font-medium text-gray-700 mb-1">E-mail *</label><input type="email" value={formEmail.email} onChange={e => setFormEmail({ ...formEmail, email: e.target.value })} placeholder="email@empresa.com" className="w-full border rounded px-2 py-1.5 text-sm" /></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setShowFormEmail(null); setFormEmail({ nome: '', email: '' }); }} className="text-xs px-3 py-1.5 border rounded hover:bg-gray-100">Cancelar</button>
                        <button onClick={() => salvarEmail(setor.id)} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">Adicionar</button>
                      </div>
                    </div>
                  )}
                  {emailsSetor.length === 0 ? (
                    <div className="text-center py-6 text-gray-400"><Mail className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Nenhum e-mail cadastrado</p></div>
                  ) : (
                    <div className="space-y-2">
                      {emailsSetor.map(em => (
                        <div key={em.id} className="flex items-center gap-3 bg-white border rounded-lg px-3 py-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${em.ativo ? 'bg-blue-100' : 'bg-gray-100'}`}><Mail className={`w-3.5 h-3.5 ${em.ativo ? 'text-blue-600' : 'text-gray-400'}`} /></div>
                          <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900">{em.nome}</p><p className="text-xs text-gray-500">{em.email}</p></div>
                          <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${em.ativo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{em.ativo ? 'Ativo' : 'Inativo'}</span>
                          <button onClick={() => toggleEmailAtivo(em.id, em.ativo)} className="p-1 text-gray-400 hover:text-blue-600 rounded" title={em.ativo ? 'Desativar' : 'Ativar'}>{em.ativo ? <X className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}</button>
                          <button onClick={() => excluirEmail(em.id)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {setores.length === 0 && (
          <div className="text-center py-12 text-gray-400"><Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="font-medium">Nenhum setor cadastrado</p><p className="text-sm mt-1">Clique em "Novo Setor" para começar</p></div>
        )}
      </div>
    </div>
  );
}

interface UsuarioEdit {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  can_manage_demissoes: boolean;
  can_manage_transferencias: boolean;
  team_ids: string[];
  team_names: string[];
}

function UsuariosView() {
  const [usuarios, setUsuarios] = useState<UsuarioEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<UsuarioEdit | null>(null);
  const [saving, setSaving] = useState(false);
  const [formEdit, setFormEdit] = useState<Partial<UsuarioEdit>>({});
  const [showCadastrar, setShowCadastrar] = useState(false);
  const [resetando, setResetando] = useState<UsuarioEdit | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [savingReset, setSavingReset] = useState(false);

  useEffect(() => { loadUsuarios(); }, []);

  const loadUsuarios = async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('id, name, email, role, can_manage_demissoes, can_manage_transferencias, team_ids, team_names').order('name');
    if (data) setUsuarios(data as UsuarioEdit[]);
    setLoading(false);
  };

  const abrirEditar = (u: UsuarioEdit) => {
    setEditando(u);
    setFormEdit({ role: u.role, can_manage_demissoes: u.can_manage_demissoes, can_manage_transferencias: u.can_manage_transferencias, team_ids: u.team_ids || [], team_names: u.team_names || [] });
  };

  const toggleTeam = (teamId: string, teamName: string) => {
    setFormEdit(f => {
      const ids = f.team_ids || [];
      const names = f.team_names || [];
      const sel = ids.includes(teamId);
      return { ...f, team_ids: sel ? ids.filter(id => id !== teamId) : [...ids, teamId], team_names: sel ? names.filter(n => n !== teamName) : [...names, teamName] };
    });
  };

  const salvar = async () => {
    if (!editando) return;
    setSaving(true);
    const { error } = await supabase.from('users').update({ role: formEdit.role, can_manage_demissoes: formEdit.can_manage_demissoes, can_manage_transferencias: formEdit.can_manage_transferencias, team_ids: formEdit.team_ids, team_names: formEdit.team_names }).eq('id', editando.id);
    if (error) { alert('Erro: ' + error.message); setSaving(false); return; }
    setUsuarios(prev => prev.map(u => u.id === editando.id ? { ...u, ...formEdit } as UsuarioEdit : u));
    setEditando(null); setSaving(false);
  };

  const resetarSenha = async () => {
    if (!resetando || !novaSenha.trim()) return;
    if (novaSenha.length < 4) { alert('A senha deve ter pelo menos 4 caracteres'); return; }
    setSavingReset(true);
    const { error } = await supabase.from('users').update({ password: novaSenha.trim() }).eq('id', resetando.id);
    if (error) { alert('Erro ao resetar senha: ' + error.message); setSavingReset(false); return; }
    alert(`Senha de ${resetando.name} atualizada com sucesso!`);
    setResetando(null); setNovaSenha(''); setSavingReset(false);
  };

  const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; desc: string }> = {
    admin: { label: 'Administrador', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', desc: 'Acesso total ao sistema' },
    responsavel: { label: 'Responsável', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', desc: 'Cria movimentações' },
    team_member: { label: 'Membro', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', desc: 'Responde pareceres' },
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold">Usuários</h2>
          <p className="text-sm text-gray-500 mt-1">Gerencie acessos, funções e equipes de cada usuário</p>
        </div>
        <button onClick={() => setShowCadastrar(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: 'none', background: '#4f46e5', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <UserPlus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>

      {showCadastrar && <RegisterUserModal onClose={() => { setShowCadastrar(false); loadUsuarios(); }} />}

      {resetando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={e => e.target === e.currentTarget && setResetando(null)}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Resetar Senha</p>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginTop: 3 }}>{resetando.name}</h3>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{resetando.email}</p>
              </div>
              <button onClick={() => { setResetando(null); setNovaSenha(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X className="w-5 h-5" /></button>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 9, padding: '10px 14px', marginBottom: 18 }}>
              <p style={{ fontSize: 12, color: '#92400e' }}>⚠️ A senha atual será substituída pela senha temporária definida abaixo. Informe o usuário para alterá-la após o login.</p>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Nova Senha Temporária</label>
              <input type="text" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Digite a senha temporária..." style={{ width: '100%', padding: '10px 14px', borderRadius: 9, fontSize: 14, border: '1.5px solid #e2e8f0', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} onFocus={e => (e.target.style.borderColor = '#4f46e5')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setResetando(null); setNovaSenha(''); }} style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', color: '#334155', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={resetarSenha} disabled={savingReset || !novaSenha.trim()} style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: '#dc2626', color: 'white', cursor: (savingReset || !novaSenha.trim()) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, opacity: (savingReset || !novaSenha.trim()) ? 0.65 : 1, fontFamily: 'inherit' }}>
                {savingReset ? 'Salvando...' : 'Confirmar Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={e => e.target === e.currentTarget && setEditando(null)}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
              <div>
                <p style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Editar Usuário</p>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{editando.name}</h3>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 1 }}>{editando.email}</p>
              </div>
              <button onClick={() => setEditando(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}><X className="w-5 h-5" /></button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Tipo de Acesso</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {(['team_member', 'responsavel', 'admin'] as UserRole[]).map(role => {
                  const cfg = ROLE_CONFIG[role];
                  const sel = formEdit.role === role;
                  return (
                    <button key={role} onClick={() => setFormEdit(f => ({ ...f, role, can_manage_demissoes: role === 'team_member' ? false : f.can_manage_demissoes, can_manage_transferencias: role === 'team_member' ? false : f.can_manage_transferencias }))} style={{ padding: '10px 8px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', border: `2px solid ${sel ? cfg.color : '#e2e8f0'}`, background: sel ? cfg.bg : 'white', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: sel ? cfg.color : '#334155' }}>{cfg.label}</p>
                      <p style={{ fontSize: 10, color: sel ? cfg.color : '#94a3b8', marginTop: 2 }}>{cfg.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            {(formEdit.role === 'admin' || formEdit.role === 'responsavel') && (
              <div style={{ marginBottom: 20, padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Pode Cadastrar</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[{ key: 'can_manage_demissoes', label: 'Demissões', desc: 'Pode criar movimentações de demissão' }, { key: 'can_manage_transferencias', label: 'Transferências / Alterações / Promoções', desc: 'Pode criar os demais tipos' }].map(({ key, label, desc }) => {
                    const checked = formEdit[key as keyof typeof formEdit] as boolean;
                    return (
                      <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '10px 12px', borderRadius: 8, background: checked ? '#eff6ff' : 'white', border: `1px solid ${checked ? '#bfdbfe' : '#e2e8f0'}`, transition: 'all 0.15s' }}>
                        <input type="checkbox" checked={checked} onChange={e => setFormEdit(f => ({ ...f, [key]: e.target.checked }))} style={{ width: 16, height: 16, marginTop: 2, cursor: 'pointer', accentColor: '#4f46e5', flexShrink: 0 }} />
                        <div><p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{label}</p><p style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{desc}</p></div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ marginBottom: 22 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Equipes Vinculadas</p>
              <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>O usuário verá e responderá movimentações dessas equipes.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
                {TEAMS.map(t => {
                  const sel = (formEdit.team_ids || []).includes(t.id);
                  return (
                    <button key={t.id} onClick={() => toggleTeam(t.id, t.name)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: `2px solid ${sel ? '#4f46e5' : '#e2e8f0'}`, background: sel ? '#eef2ff' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `2px solid ${sel ? '#4f46e5' : '#cbd5e1'}`, background: sel ? '#4f46e5' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {sel && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: sel ? 700 : 400, color: sel ? '#4f46e5' : '#334155' }}>{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditando(null)} style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', color: '#334155', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={salvar} disabled={saving} style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: '#4f46e5', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, opacity: saving ? 0.75 : 1, fontFamily: 'inherit' }}>
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {usuarios.map(u => {
            const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.team_member;
            return (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, transition: 'box-shadow 0.15s' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: cfg.color }}>{u.name.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{u.name}</p>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{u.email}</p>
                  {u.team_names && u.team_names.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                      {u.team_names.map((tn, i) => (<span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>{tn}</span>))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                  {(u.can_manage_demissoes || u.can_manage_transferencias) && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      {u.can_manage_demissoes && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 600 }}>Demissões</span>}
                      {u.can_manage_transferencias && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontWeight: 600 }}>Transferências</span>}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => { setResetando(u); setNovaSenha(''); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Senha
                  </button>
                  <button onClick={() => abrirEditar(u)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#334155', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    <Settings className="w-3.5 h-3.5" /> Editar
                  </button>
                </div>
              </div>
            );
          })}
          {usuarios.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}><Users className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>Nenhum usuário encontrado</p></div>
          )}
        </div>
      )}
    </div>
  );
}
