import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, UserX, AlertCircle, LogOut, Mail, Lock, Eye, EyeOff, Settings, Loader2, UserPlus, Clock } from 'lucide-react';
import { supabase } from './lib/supabase';

type UserRole = 'admin' | 'team_member';
type MovementType = 'demissao' | 'transferencia' | 'alteracao' | 'promocao';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  can_manage_demissoes: boolean;
  can_manage_transferencias: boolean;
  team_id: string;
  team_name: string;
}

interface Movement {
  id: string;
  type: MovementType;
  employee_name: string;
  selected_teams: string[];
  status: 'pending' | 'in_progress' | 'completed';
  responses: Record<string, { status: string; comment?: string; date?: string }>;
  created_at: string;
  created_by: string;
  details: Record<string, any>;
  observation?: string;
  deadline?: string;
}

const TEAMS = [
  { id: 'rh', name: 'Recursos Humanos' },
  { id: 'ponto', name: 'Ponto' },
  { id: 'transporte', name: 'Transporte' },
  { id: 'ti', name: 'T.I' },
  { id: 'desenvolvimento', name: 'Desenvolvimento' },
  { id: 'seguranca', name: 'Segurança do Trabalho' },
  { id: 'ambulatorio', name: 'Ambulatório' },
  { id: 'financeiro', name: 'Financeiro' }
];

const MOVEMENT_TYPES = {
  demissao: { label: 'Demissão', icon: UserX, color: 'red' },
  transferencia: { label: 'Transferência', icon: Users, color: 'blue' },
  alteracao: { label: 'Alteração Salarial', icon: TrendingUp, color: 'green' },
  promocao: { label: 'Promoção', icon: TrendingUp, color: 'purple' }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [view, setView] = useState('login');
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadMovements();
    }
  }, [currentUser]);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <Login setCurrentUser={setCurrentUser} setView={setView} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header currentUser={currentUser} setCurrentUser={setCurrentUser} setView={setView} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {view === 'dashboard' && (
          <DashboardView 
            currentUser={currentUser} 
            movements={movements} 
            loading={loading}
            loadMovements={loadMovements}
            setSelectedMovement={setSelectedMovement}
            setView={setView}
          />
        )}
        {view === 'detail' && selectedMovement && (
          <DetailView 
            currentUser={currentUser}
            selectedMovement={selectedMovement}
            setView={setView}
            setSelectedMovement={setSelectedMovement}
            loadMovements={loadMovements}
          />
        )}
      </main>
    </div>
  );
}

function Login({ setCurrentUser, setView }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLogin(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('password', password)
        .single();

      if (error || !data) {
        setError('Email ou senha incorretos');
        return;
      }

      setCurrentUser(data);
      setView('dashboard');
    } catch (err) {
      setError('Erro ao fazer login');
    } finally {
      setLoadingLogin(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema de Movimentações</h1>
          <p className="text-gray-600 mt-2">Gestão de Colaboradores</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="seu@email.com"
                required
                disabled={loadingLogin}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
                disabled={loadingLogin}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loadingLogin}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
          >
            {loadingLogin ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function Header({ currentUser, setCurrentUser, setView }: any) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">Sistema de Movimentações</h1>
              <p className="text-sm text-gray-600">Gestão de Colaboradores</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{currentUser.name}</p>
              <p className="text-xs text-gray-500">
                {currentUser.team_name} • {currentUser.role === 'admin' ? 'Administrador' : 'Membro'}
              </p>
            </div>
            <button 
              onClick={() => { 
                setCurrentUser(null); 
                setView('login'); 
              }} 
              className="text-gray-600 hover:text-gray-900 transition"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function DashboardView({ currentUser, movements, loading, loadMovements, setSelectedMovement, setView }: any) {
  const [showNewMovement, setShowNewMovement] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showRegisterUser, setShowRegisterUser] = useState(false);
  const [movementType, setMovementType] = useState<MovementType | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [loadingCreate, setLoadingCreate] = useState(false);

  const canCreateDemissao = currentUser?.role === 'admin' && currentUser?.can_manage_demissoes;
  const canCreateTransferencia = currentUser?.role === 'admin' && currentUser?.can_manage_transferencias;
  const isAdmin = currentUser?.role === 'admin';

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const getTeamProgress = (movement: Movement) => {
    const teams = movement.selected_teams || [];
    const completed = teams.filter(t => movement.responses[t]?.status === 'completed').length;
    return { completed, total: teams.length, percentage: teams.length > 0 ? (completed / teams.length) * 100 : 0 };
  };

  const handleCreateMovement = async () => {
    if (!formData.employeeName?.trim()) {
      alert('Preencha o nome do colaborador');
      return;
    }
    if (selectedTeams.length === 0) {
      alert('Selecione pelo menos uma equipe');
      return;
    }

    setLoadingCreate(true);

    try {
      const responsesObj = selectedTeams.reduce((acc, teamId) => {
        acc[teamId] = { status: 'pending' };
        return acc;
      }, {} as Record<string, any>);

      const newMovement = {
        type: movementType!,
        employee_name: formData.employeeName,
        selected_teams: selectedTeams,
        status: 'pending' as const,
        responses: responsesObj,
        created_by: currentUser?.name || '',
        details: {
          ...(formData.dismissalDate && { dismissalDate: formData.dismissalDate }),
          ...(formData.company && { company: formData.company }),
          ...(formData.oldSector && { oldSector: formData.oldSector }),
          ...(formData.newSector && { newSector: formData.newSector }),
          ...(formData.oldPosition && { oldPosition: formData.oldPosition }),
          ...(formData.newPosition && { newPosition: formData.newPosition }),
          ...(formData.changeDate && { changeDate: formData.changeDate })
        },
        observation: formData.observation || '',
        deadline: formData.deadline || null
      };

      const { data, error } = await supabase
        .from('movements')
        .insert([newMovement])
        .select()
        .single();

      if (error) throw error;

      // Webhook Make
      try {
        const movementTypeKey = data.type as MovementType;
        await fetch('https://hook.eu2.make.com/ype19l4x522ymrkbmqhm9on10szsc62v', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            movimento_tipo: MOVEMENT_TYPES[movementTypeKey].label,
            criado_por: data.created_by,
            equipes_envolvidas: data.selected_teams.map((teamId: string) => 
              TEAMS.find(t => t.id === teamId)?.name || teamId
            ).join(', ')
          })
        });
      } catch (webhookError) {
        console.error('Erro webhook:', webhookError);
      }

      alert('Movimentação criada com sucesso!');
      await loadMovements();
      setShowNewMovement(false);
      setMovementType(null);
      setFormData({});
      setSelectedTeams([]);
    } catch (err: any) {
      alert(`Erro: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setLoadingCreate(false);
    }
  };

  const myMovements = movements.filter((m: Movement) => 
    m.selected_teams.includes(currentUser?.team_id || '')
  );

  const pendingMovements = myMovements.filter((m: Movement) => 
    m.responses[currentUser?.team_id || '']?.status === 'pending'
  );

  return (
    <div>
      {pendingMovements.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <p className="font-medium text-yellow-800">
              Você tem {pendingMovements.length} movimentação(ões) pendente(s)
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Dashboard</h2>
          <div className="flex gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowRegisterUser(true)}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Cadastrar Usuário
              </button>
            )}
            <button
              onClick={() => setShowChangePassword(true)}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm"
            >
              <Settings className="w-4 h-4" />
              Alterar Senha
            </button>
          </div>
        </div>

        {(canCreateDemissao || canCreateTransferencia) && (
          <div className="mb-6 pb-6 border-b">
            <h3 className="font-semibold mb-3">Nova Movimentação</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {canCreateDemissao && (
                <button
                  onClick={() => { setShowNewMovement(true); setMovementType('demissao'); }}
                  className="p-4 border-2 border-red-200 rounded-lg hover:bg-red-50"
                >
                  <UserX className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Demissão</p>
                </button>
              )}
              {canCreateTransferencia && (
                <>
                  <button
                    onClick={() => { setShowNewMovement(true); setMovementType('transferencia'); }}
                    className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50"
                  >
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Transferência</p>
                  </button>
                  <button
                    onClick={() => { setShowNewMovement(true); setMovementType('alteracao'); }}
                    className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50"
                  >
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Alteração</p>
                  </button>
                  <button
                    onClick={() => { setShowNewMovement(true); setMovementType('promocao'); }}
                    className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50"
                  >
                    <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Promoção</p>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-semibold">
            {isAdmin ? 'Todas as Movimentações' : 'Minhas Movimentações'}
          </h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {(isAdmin ? movements : myMovements).map((movement: Movement) => {
                const Icon = MOVEMENT_TYPES[movement.type].icon;
                const progress = getTeamProgress(movement);
                const myTeamResponse = movement.responses[currentUser?.team_id || ''];
                const isMyTeamInvolved = movement.selected_teams.includes(currentUser?.team_id || '');
                const overdue = isOverdue(movement.deadline);

                return (
                  <div
                    key={movement.id}
                    className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer ${overdue ? 'border-red-300 bg-red-50' : ''}`}
                    onClick={() => { setSelectedMovement(movement); setView('detail'); }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Icon className="w-6 h-6" />
                        <div>
                          <h3 className="font-semibold">{movement.employee_name}</h3>
                          <p className="text-sm text-gray-600">{MOVEMENT_TYPES[movement.type].label}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {movement.deadline && (
                          <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${overdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                            <Clock className="w-3 h-3" />
                            {new Date(movement.deadline).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {isMyTeamInvolved && (
                          <span className={`text-xs px-2 py-1 rounded ${myTeamResponse?.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {myTeamResponse?.status === 'completed' ? '✓ Respondido' : '⏳ Pendente'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Progresso: {progress.completed}/{progress.total} equipes • 
                      Criado em {new Date(movement.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
              {(isAdmin ? movements : myMovements).length === 0 && (
                <p className="text-gray-500 text-center py-8">Nenhuma movimentação encontrada</p>
              )}
            </>
          )}
        </div>
      </div>

      {showChangePassword && <ChangePasswordModal currentUser={currentUser} setCurrentUser={setCurrentUser} onClose={() => setShowChangePassword(false)} />}
      {showRegisterUser && <RegisterUserModal onClose={() => setShowRegisterUser(false)} onSuccess={loadMovements} />}
      {showNewMovement && movementType && (
        <NewMovementModal
          movementType={movementType}
          formData={formData}
          setFormData={setFormData}
          selectedTeams={selectedTeams}
          setSelectedTeams={setSelectedTeams}
          onClose={() => { setShowNewMovement(false); setMovementType(null); setFormData({}); setSelectedTeams([]); }}
          onSubmit={handleCreateMovement}
        />
      )}
    </div>
  );
}

function DetailView({ currentUser, selectedMovement, setView, setSelectedMovement, loadMovements }: any) {
  const [comment, setComment] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const isMyTeam = selectedMovement.selected_teams.includes(currentUser?.team_id || '');
  const myTeamResponse = currentUser?.team_id ? selectedMovement.responses[currentUser.team_id] : null;
  const hasResponded = myTeamResponse?.status === 'completed';

  const handleSubmitComment = async () => {
    if (!comment.trim() || !currentUser?.team_id) return;

    setLoadingSubmit(true);

    try {
      const updatedResponses = {
        ...selectedMovement.responses,
        [currentUser.team_id!]: {
          status: 'completed',
          comment: comment.trim(),
          date: new Date().toISOString().split('T')[0]
        }
      };

      const allCompleted = selectedMovement.selected_teams.every(
        (teamId: string) => updatedResponses[teamId]?.status === 'completed'
      );

      const { error } = await supabase
        .from('movements')
        .update({ 
          responses: updatedResponses,
          status: allCompleted ? 'completed' : 'in_progress'
        })
        .eq('id', selectedMovement.id);

      if (error) throw error;

      alert('Parecer enviado com sucesso!');
      await loadMovements();
      setView('dashboard');
      setSelectedMovement(null);
    } catch (err) {
      alert('Erro ao enviar parecer');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold">{selectedMovement.employee_name}</h2>
          <p className="text-gray-600">{MOVEMENT_TYPES[selectedMovement.type].label}</p>
        </div>
        <button 
          onClick={() => { setView('dashboard'); setSelectedMovement(null); }} 
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          ← Voltar
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">Informações</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Criado por:</span>
            <p className="font-medium">{selectedMovement.created_by}</p>
          </div>
          <div>
            <span className="text-gray-600">Data:</span>
            <p className="font-medium">{new Date(selectedMovement.created_at).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        {selectedMovement.observation && (
          <div className="mt-4 pt-4 border-t">
            <span className="text-gray-600 font-medium">Observações:</span>
            <p className="text-sm mt-2 bg-white p-3 rounded">{selectedMovement.observation}</p>
          </div>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <h3 className="font-semibold">Pareceres das Equipes</h3>
        {selectedMovement.selected_teams.map((teamId: string) => {
          const team = TEAMS.find(t => t.id === teamId);
          const response = selectedMovement.responses[teamId];
          const isMyTeamCard = teamId === currentUser?.team_id;

          return (
            <div 
              key={teamId} 
              className={`border rounded-lg p-4 ${isMyTeamCard ? 'border-blue-500 bg-blue-50' : ''}`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">
                  {team?.name} {isMyTeamCard && '(Sua Equipe)'}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${response?.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {response?.status === 'completed' ? '✓ Respondido' : '⏳ Pendente'}
                </span>
              </div>
              {response?.comment && (
                <p className="text-sm bg-white p-3 rounded border mt-2">{response.comment}</p>
              )}
            </div>
          );
        })}
      </div>

      {isMyTeam && !hasResponded && (
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-3">Adicionar Parecer</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Digite seu parecer..."
            className="w-full border rounded-lg p-3 h-32"
            disabled={loadingSubmit}
          />
          <button
            onClick={handleSubmitComment}
            disabled={!comment.trim() || loadingSubmit}
            className="mt-3 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2"
          >
            {loadingSubmit ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</> : 'Enviar Parecer'}
          </button>
        </div>
      )}

      {isMyTeam && hasResponded && (
        <div className="border-t pt-6 bg-green-50 p-4 rounded">
          <span className="text-green-800 font-medium">✓ Você já respondeu esta movimentação</span>
        </div>
      )}
    </div>
  );
}

function ChangePasswordModal({ currentUser, setCurrentUser, onClose }: any) {
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-xl p-6 max-w-md w-full"><p>Modal de alteração de senha (implementar)</p><button onClick={onClose} className="mt-4 bg-gray-300 px-4 py-2 rounded">Fechar</button></div></div>;
}

function RegisterUserModal({ onClose, onSuccess }: any) {
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-xl p-6 max-w-md w-full"><p>Modal de cadastro (implementar)</p><button onClick={onClose} className="mt-4 bg-gray-300 px-4 py-2 rounded">Fechar</button></div></div>;
}

function NewMovementModal({ movementType, formData, setFormData, selectedTeams, setSelectedTeams, onClose, onSubmit }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Nova {MOVEMENT_TYPES[movementType].label}</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">✕</button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium mb-2">Nome do Colaborador *</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              onChange={(e) => setFormData({...formData, employeeName: e.target.value})}
            />
          </div>

          {movementType === 'demissao' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Data do Desligamento</label>
                <input 
                  type="date" 
                  className="w-full border rounded-lg px-3 py-2" 
                  onChange={(e) => setFormData({...formData, dismissalDate: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Empresa</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg px-3 py-2" 
                  onChange={(e) => setFormData({...formData, company: e.target.value})} 
                />
              </div>
            </>
          )}

          {movementType !== 'demissao' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Setor Atual</label>
                  <input 
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2" 
                    onChange={(e) => setFormData({...formData, oldSector: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Novo Setor</label>
                  <input 
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2" 
                    onChange={(e) => setFormData({...formData, newSector: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Função Atual</label>
                  <input 
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2" 
                    onChange={(e) => setFormData({...formData, oldPosition: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nova Função</label>
                  <input 
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2" 
                    onChange={(e) => setFormData({...formData, newPosition: e.target.value})} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Data da Mudança</label>
                <input 
                  type="date" 
                  className="w-full border rounded-lg px-3 py-2" 
                  onChange={(e) => setFormData({...formData, changeDate: e.target.value})} 
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Data Limite</label>
            <input 
              type="date" 
              className="w-full border rounded-lg px-3 py-2" 
              onChange={(e) => setFormData({...formData, deadline: e.target.value})} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Observações</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 h-24"
              placeholder="Digite observações..."
              onChange={(e) => setFormData({...formData, observation: e.target.value})}
            />
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium mb-3">
              Selecione as Equipes * ({selectedTeams.length} selecionadas)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEAMS.map(team => (
                <label 
                  key={team.id} 
                  className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer ${selectedTeams.includes(team.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTeams.includes(team.id)}
                    onChange={() => {
                      setSelectedTeams((prev: string[]) => 
                        prev.includes(team.id) 
                          ? prev.filter(id => id !== team.id) 
                          : [...prev, team.id]
                      );
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{team.name}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={onSubmit}
            disabled={selectedTeams.length === 0 || !formData.employeeName}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            Criar Movimentação
          </button>
        </div>
      </div>
    </div>
  );
}
