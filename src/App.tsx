import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, UserX, AlertCircle, LogOut, Mail, Lock, Eye, EyeOff, Settings, Loader2, UserPlus } from 'lucide-react';
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

  const Login = () => {
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
  };

  const ChangePasswordModal = ({ onClose }: { onClose: () => void }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loadingChange, setLoadingChange] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (currentPassword !== currentUser?.password) {
        setError('Senha atual incorreta');
        return;
      }

      if (newPassword.length < 6) {
        setError('A nova senha deve ter pelo menos 6 caracteres');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }

      setLoadingChange(true);

      try {
        const { error } = await supabase
          .from('users')
          .update({ password: newPassword })
          .eq('id', currentUser?.id);

        if (error) throw error;

        setCurrentUser({ ...currentUser!, password: newPassword });
        setSuccess(true);
        
        setTimeout(() => {
          onClose();
        }, 2000);
      } catch (err) {
        setError('Erro ao alterar senha');
      } finally {
        setLoadingChange(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Alterar Senha</h2>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-900">✕</button>
          </div>

          {success ? (
            <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Senha alterada com sucesso!
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Senha Atual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                  disabled={loadingChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                  minLength={6}
                  disabled={loadingChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                  disabled={loadingChange}
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loadingChange}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
              >
                {loadingChange ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  'Alterar Senha'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  };

  const RegisterUserModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      role: 'team_member' as UserRole,
      can_manage_demissoes: false,
      can_manage_transferencias: false,
      team_id: '',
      team_name: ''
    });
    const [error, setError] = useState('');
    const [loadingRegister, setLoadingRegister] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!formData.name || !formData.email || !formData.password || !formData.team_id) {
        setError('Preencha todos os campos obrigatórios');
        return;
      }

      if (formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return;
      }

      setLoadingRegister(true);

      try {
        const selectedTeam = TEAMS.find(t => t.id === formData.team_id);
        
        const { error } = await supabase
          .from('users')
          .insert([{
            ...formData,
            team_name: selectedTeam?.name || '',
            email: formData.email.toLowerCase()
          }]);

        if (error) {
          if (error.code === '23505') {
            setError('Este email já está cadastrado');
          } else {
            throw error;
          }
          return;
        }

        alert('Usuário cadastrado com sucesso!');
        onSuccess();
        onClose();
      } catch (err) {
        setError('Erro ao cadastrar usuário');
      } finally {
        setLoadingRegister(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Cadastrar Novo Usuário</h2>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-900">✕</button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Equipe *</label>
              <select
                value={formData.team_id}
                onChange={(e) => setFormData({...formData, team_id: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione uma equipe</option>
                {TEAMS.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Usuário *</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="role"
                    value="team_member"
                    checked={formData.role === 'team_member'}
                    onChange={(e) => setFormData({
                      ...formData, 
                      role: e.target.value as UserRole,
                      can_manage_demissoes: false,
                      can_manage_transferencias: false
                    })}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium">Membro da Equipe</p>
                    <p className="text-xs text-gray-600">Pode responder movimentações da sua equipe</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === 'admin'}
                    onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium">Administrador</p>
                    <p className="text-xs text-gray-600">Pode criar e gerenciar movimentações</p>
                  </div>
                </label>
              </div>
            </div>

            {formData.role === 'admin' && (
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Permissões do Administrador</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.can_manage_demissoes}
                      onChange={(e) => setFormData({...formData, can_manage_demissoes: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Pode gerenciar Demissões</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.can_manage_transferencias}
                      onChange={(e) => setFormData({...formData, can_manage_transferencias: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Pode gerenciar Transferências, Alterações e Promoções</span>
                  </label>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loadingRegister}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
            >
              {loadingRegister ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar Usuário'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const DashboardView = () => {
    const [showNewMovement, setShowNewMovement] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showRegisterUser, setShowRegisterUser] = useState(false);
    const [movementType, setMovementType] = useState<MovementType | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

    const canCreateDemissao = currentUser?.role === 'admin' && currentUser?.can_manage_demissoes;
    const canCreateTransferencia = currentUser?.role === 'admin' && currentUser?.can_manage_transferencias;
    const isAdmin = currentUser?.role === 'admin';

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

      setLoading(true);
      
      try {
        const newMovement = {
          type: movementType!,
          employee_name: formData.employeeName,
          selected_teams: selectedTeams,
          status: 'pending',
          responses: selectedTeams.reduce((acc, teamId) => {
            acc[teamId] = { status: 'pending' };
            return acc;
          }, {} as any),
          created_by: currentUser?.name || '',
          details: formData
        };

        const { error } = await supabase
          .from('movements')
          .insert([newMovement]);

        if (error) throw error;

        alert('Movimentação criada com sucesso!');
        await loadMovements();
        setShowNewMovement(false);
        setMovementType(null);
        setFormData({});
        setSelectedTeams([]);
      } catch (err) {
        alert('Erro ao criar movimentação');
      } finally {
        setLoading(false);
      }
    };

    const myMovements = movements.filter(m => 
      m.selected_teams.includes(currentUser?.team_id || '')
    );

    return (
      <div>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Dashboard</h2>
            <div className="flex items-center gap-2">
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
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 border rounded-lg text-sm"
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
                    className="p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 transition"
                  >
                    <UserX className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Demissão</p>
                  </button>
                )}
                {canCreateTransferencia && (
                  <>
                    <button
                      onClick={() => { setShowNewMovement(true); setMovementType('transferencia'); }}
                      className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition"
                    >
                      <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Transferência</p>
                    </button>
                    <button
                      onClick={() => { setShowNewMovement(true); setMovementType('alteracao'); }}
                      className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition"
                    >
                      <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Alteração</p>
                    </button>
                    <button
                      onClick={() => { setShowNewMovement(true); setMovementType('promocao'); }}
                      className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition"
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
              {currentUser?.role === 'admin' ? 'Todas as Movimentações' : 'Minhas Movimentações'}
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                {(currentUser?.role === 'admin' ? movements : myMovements).map(movement => {
                  const Icon = MOVEMENT_TYPES[movement.type].icon;
                  const progress = getTeamProgress(movement);
                  const myTeamResponse = movement.responses[currentUser?.team_id || ''];
                  const isMyTeamInvolved = movement.selected_teams.includes(currentUser?.team_id || '');
                  
                  return (
                    <div 
                      key={movement.id} 
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition" 
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
                        {isMyTeamInvolved && (
                          <span className={`text-xs px-2 py-1 rounded ${myTeamResponse?.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {myTeamResponse?.status === 'completed' ? '✓ Respondido' : '⏳ Pendente'}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Progresso: {progress.completed}/{progress.total} equipes • 
                        Criado em {new Date(movement.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all" 
                          style={{ width: `${progress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {(currentUser?.role === 'admin' ? movements : myMovements).length === 0 && (
                  <p className="text-gray-500 text-center py-8">Nenhuma movimentação encontrada</p>
                )}
              </>
            )}
          </div>
        </div>

        {showChangePassword && (
          <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
        )}

        {showRegisterUser && (
          <RegisterUserModal 
            onClose={() => setShowRegisterUser(false)} 
            onSuccess={() => loadMovements()} 
          />
        )}

        {showNewMovement && movementType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Nova {MOVEMENT_TYPES[movementType].label}</h2>
                <button 
                  onClick={() => { 
                    setShowNewMovement(false); 
                    setMovementType(null); 
                    setSelectedTeams([]); 
                    setFormData({});
                  }} 
                  className="text-gray-600 hover:text-gray-900"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome do Colaborador *</label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
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
                    <div>
                      <label className="block text-sm font-medium mb-2">Setor</label>
                      <input 
                        type="text" 
                        className="w-full border rounded-lg px-3 py-2" 
                        onChange={(e) => setFormData({...formData, sector: e.target.value})} 
                      />
                    </div>
                  </>
                )}

                {movementType !== 'demissao' && (
                  <>
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

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium mb-3">
                    Selecione as Equipes * ({selectedTeams.length} selecionadas)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TEAMS.map(team => (
                      <label 
                        key={team.id} 
                        className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition ${selectedTeams.includes(team.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(team.id)}
                          onChange={() => {
                            setSelectedTeams(prev => 
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
                  onClick={handleCreateMovement}
                  disabled={selectedTeams.length === 0 || !formData.employeeName || loading}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Movimentação'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const DetailView = () => {
    if (!selectedMovement) return null;

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
          teamId => updatedResponses[teamId]?.status === 'completed'
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
          <h3 className="font-semibold mb-3">Informações da Movimentação</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Criado por:</span>
              <p className="font-medium">{selectedMovement.created_by}</p>
            </div>
            <div>
              <span className="text-gray-600">Data de criação:</span>
              <p className="font-medium">{new Date(selectedMovement.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            {Object.entries(selectedMovement.details).map(([key, value]) => (
              <div key={key}>
                <span className="text-gray-600 capitalize">{key}:</span>
                <p className="font-medium">{typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/) 
                  ? new Date(value).toLocaleDateString('pt-BR') 
                  : value}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold">Pareceres das Equipes</h3>
          {selectedMovement.selected_teams.map(teamId => {
            const team = TEAMS.find(t => t.id === teamId);
            const response = selectedMovement.responses[teamId];
            const isMyTeamCard = teamId === currentUser?.team_id;
            
            return (
              <div 
                key={teamId} 
                className={`border rounded-lg p-4 ${isMyTeamCard ? 'border-blue-500 bg-blue-50' : 'bg-white'}`}
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
                  <div className="mt-2">
                    <p className="text-sm text-gray-700 bg-white p-3 rounded border">{response.comment}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Respondido em {new Date(response.date!).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
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
              placeholder="Digite seu parecer aqui..."
              className="w-full border rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500"
              disabled={loadingSubmit}
            />
            <button
              onClick={handleSubmitComment}
              disabled={!comment.trim() || loadingSubmit}
              className="mt-3 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {loadingSubmit ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Parecer'
              )}
            </button>
          </div>
        )}

        {isMyTeam && hasResponded && (
          <div className="border-t pt-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">Você já respondeu esta movimentação</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
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

      <main className="max-w-7xl mx-auto px-4 py-6">
        {view === 'dashboard' && <DashboardView />}
        {view === 'detail' && <DetailView />}
      </main>
    </div>
  );
}
