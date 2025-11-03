import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, UserX, AlertCircle, CheckCircle, Clock, LogOut, Mail, Lock, Eye, EyeOff } from 'lucide-react';

type UserRole = 'pending' | 'team_member' | 'admin';
type MovementType = 'demissao' | 'transferencia' | 'alteracao' | 'promocao';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  can_manage_demissoes: boolean;
  can_manage_transferencias: boolean;
  team_id?: string;
  team_name?: string;
}

interface Movement {
  id: number;
  type: MovementType;
  employeeName: string;
  employeeCpf?: string;
  selectedTeams?: string[];
  dismissalDate?: string;
  dismissalType?: string;
  company?: string;
  sector?: string;
  oldPosition?: string;
  newPosition?: string;
  oldSector?: string;
  newSector?: string;
  changeDate?: string;
  oldCompany?: string;
  newCompany?: string;
  examDate?: string;
  status: string;
  responses: any;
  createdAt: string;
  createdBy: string;
}

const TEAMS = [
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

const DISMISSAL_TYPES = [
  'Sem Justa Causa',
  'Com Justa Causa',
  'Pedido de Demissão',
  'Acordo',
  'Término de Contrato'
];

const AUTHORIZED_USERS = [
  {
    id: '1',
    email: 'admin@empresa.com',
    password: 'admin123',
    name: 'Admin Principal',
    role: 'admin' as const,
    can_manage_demissoes: true,
    can_manage_transferencias: true,
    team_id: 'ponto',
    team_name: 'Ponto'
  },
  {
    id: '2',
    email: 'rh@empresa.com',
    password: 'rh123',
    name: 'RH Demissões',
    role: 'admin' as const,
    can_manage_demissoes: true,
    can_manage_transferencias: false,
    team_id: 'financeiro',
    team_name: 'Financeiro'
  },
  {
    id: '3',
    email: 'rh.transferencias@empresa.com',
    password: 'rh123',
    name: 'RH Transferências',
    role: 'admin' as const,
    can_manage_demissoes: false,
    can_manage_transferencias: true,
    team_id: 'desenvolvimento',
    team_name: 'Desenvolvimento'
  },
  {
    id: '4',
    email: 'ponto@empresa.com',
    password: 'ponto123',
    name: 'Equipe Ponto',
    role: 'team_member' as const,
    can_manage_demissoes: false,
    can_manage_transferencias: false,
    team_id: 'ponto',
    team_name: 'Ponto'
  },
  {
    id: '5',
    email: 'ti@empresa.com',
    password: 'ti123',
    name: 'Equipe TI',
    role: 'team_member' as const,
    can_manage_demissoes: false,
    can_manage_transferencias: false,
    team_id: 'ti',
    team_name: 'T.I'
  },
  {
    id: '6',
    email: 'desenvolvimento@empresa.com',
    password: 'dev123',
    name: 'Equipe Desenvolvimento',
    role: 'team_member' as const,
    can_manage_demissoes: false,
    can_manage_transferencias: false,
    team_id: 'desenvolvimento',
    team_name: 'Desenvolvimento'
  },
  {
    id: '7',
    email: 'financeiro@empresa.com',
    password: 'fin123',
    name: 'Equipe Financeiro',
    role: 'team_member' as const,
    can_manage_demissoes: false,
    can_manage_transferencias: false,
    team_id: 'financeiro',
    team_name: 'Financeiro'
  }
];

export default function HRMovementsApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState('login');
  const [movements, setMovements] = useState<Movement[]>([]);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);

  useEffect(() => {
    const mockMovements: Movement[] = [
      {
        id: 1,
        type: 'demissao',
        employeeName: 'João Silva',
        employeeCpf: '123.456.789-00',
        dismissalDate: '2025-11-15',
        dismissalType: 'Sem Justa Causa',
        company: 'Empresa A - Matriz',
        sector: 'Produção',
        selectedTeams: ['ponto', 'ti', 'financeiro'],
        status: 'pending',
        responses: {
          ponto: { status: 'completed', comment: 'Folha de ponto ajustada', date: '2025-10-26' },
          ti: { status: 'completed', comment: 'Acessos revogados', date: '2025-10-27' },
          financeiro: { status: 'pending' }
        },
        createdAt: '2025-10-25',
        createdBy: 'Maria Santos - RH'
      },
      {
        id: 2,
        type: 'transferencia',
        employeeName: 'Ana Costa',
        oldPosition: 'Assistente Administrativo',
        newPosition: 'Analista Administrativo',
        oldSector: 'Administrativo',
        newSector: 'Financeiro',
        changeDate: '2025-11-01',
        examDate: '2025-10-30',
        oldCompany: 'Empresa A',
        newCompany: 'Empresa A',
        selectedTeams: ['ponto', 'desenvolvimento', 'ambulatorio'],
        status: 'in_progress',
        responses: {
          ponto: { status: 'completed', comment: 'Novo horário cadastrado', date: '2025-10-27' },
          desenvolvimento: { status: 'completed', comment: 'Treinamento agendado', date: '2025-10-27' },
          ambulatorio: { status: 'pending' }
        },
        createdAt: '2025-10-25',
        createdBy: 'Carlos Lima - RH'
      }
    ];
    setMovements(mockMovements);
  }, []);

  const getTeamProgress = (movement: Movement) => {
    const teams = movement.selectedTeams || [];
    const completed = teams.filter(t => movement.responses[t]?.status === 'completed').length;
    return { completed, total: teams.length, percentage: teams.length > 0 ? (completed / teams.length) * 100 : 0 };
  };

  const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      
      const user = AUTHORIZED_USERS.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        setCurrentUser(userWithoutPassword as User);
        setView('dashboard');
      } else {
        setError('Email ou senha incorretos');
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

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(e); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  required
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
                  className="w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Entrar
            </button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs font-semibold text-gray-700 mb-3">🚀 Acesso Rápido (clique para testar):</p>
            <div className="space-y-2">
              {AUTHORIZED_USERS.filter(u => u.role === 'admin').map(user => (
                <button
                  key={user.id}
                  onClick={() => { 
                    setEmail(user.email); 
                    setPassword(user.password); 
                    setTimeout(() => handleLogin(), 100); 
                  }}
                  className="w-full text-left px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded text-xs border border-purple-200"
                >
                  <strong>{user.name}</strong><br/>
                  <span className="text-gray-600">{user.email} / senha: {user.password}</span>
                </button>
              ))}
              <div className="border-t pt-2 mt-2"></div>
              {AUTHORIZED_USERS.filter(u => u.role === 'team_member').slice(0, 3).map(user => (
                <button
                  key={user.id}
                  onClick={() => { 
                    setEmail(user.email); 
                    setPassword(user.password); 
                    setTimeout(() => handleLogin(), 100); 
                  }}
                  className="w-full text-left px-3 py-2 bg-green-50 hover:bg-green-100 rounded text-xs border border-green-200"
                >
                  <strong>{user.name}</strong><br/>
                  <span className="text-gray-600">{user.email} / senha: {user.password}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!currentUser) {
    return <Login />;
  }

  const DashboardView = () => {
    const [showNewMovement, setShowNewMovement] = useState(false);
    const [movementType, setMovementType] = useState<MovementType | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

    const canCreateDemissao = currentUser?.role === 'admin' && currentUser?.can_manage_demissoes;
    const canCreateTransferencia = currentUser?.role === 'admin' && currentUser?.can_manage_transferencias;
    const isAdmin = currentUser?.role === 'admin';

    const toggleTeam = (teamId: string) => {
      setSelectedTeams(prev => 
        prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
      );
    };

    const handleCreateMovement = () => {
      if (selectedTeams.length === 0) {
        alert('Selecione pelo menos uma equipe!');
        return;
      }
      
      const newMovement: Movement = {
        id: movements.length + 1,
        type: movementType!,
        employeeName: formData.employeeName,
        selectedTeams: selectedTeams,
        status: 'pending',
        responses: selectedTeams.reduce((acc, teamId) => {
          acc[teamId] = { status: 'pending' };
          return acc;
        }, {} as any),
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: currentUser?.name || '',
        ...formData
      };

      setMovements([...movements, newMovement]);
      alert('Movimentação criada com sucesso!');
      setShowNewMovement(false);
      setMovementType(null);
      setFormData({});
      setSelectedTeams([]);
    };

    return (
      <div>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Dashboard</h2>
          
          {isAdmin && (
            <div className="mb-6">
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
                  <React.Fragment>
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
                  </React.Fragment>
                )}
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <h3 className="font-semibold">Movimentações</h3>
            {movements.map(movement => {
              const Icon = MOVEMENT_TYPES[movement.type].icon;
              const progress = getTeamProgress(movement);
              const myTeamResponse = currentUser?.team_id ? movement.responses[currentUser.team_id] : null;
              const isMyTeamInvolved = movement.selectedTeams?.includes(currentUser?.team_id || '');
              
              return (
                <div key={movement.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedMovement(movement); setView('detail'); }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6" />
                      <div>
                        <h3 className="font-semibold">{movement.employeeName}</h3>
                        <p className="text-sm text-gray-600">{MOVEMENT_TYPES[movement.type].label}</p>
                      </div>
                    </div>
                    {isMyTeamInvolved && (
                      <span className={`text-xs px-2 py-1 rounded ${myTeamResponse?.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {myTeamResponse?.status === 'completed' ? '✓ Respondido' : '⏳ Pendente'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Progresso: {progress.completed}/{progress.total} equipes</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showNewMovement && movementType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Nova {MOVEMENT_TYPES[movementType].label}</h2>
                  <button onClick={() => { setShowNewMovement(false); setMovementType(null); setSelectedTeams([]); }} className="text-gray-600">✕</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome do Colaborador *</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2"
                      onChange={(e) => setFormData({...formData, employeeName: e.target.value})}
                      required
                    />
                  </div>

                  {movementType === 'demissao' && (
                    <React.Fragment>
                      <div>
                        <label className="block text-sm font-medium mb-2">Data do Desligamento *</label>
                        <input type="date" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, dismissalDate: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Tipo *</label>
                        <select className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, dismissalType: e.target.value})}>
                          <option value="">Selecione</option>
                          {DISMISSAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Coligada *</label>
                        <input type="text" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, company: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Setor *</label>
                        <input type="text" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, sector: e.target.value})} />
                      </div>
                    </React.Fragment>
                  )}

                  {movementType !== 'demissao' && (
                    <React.Fragment>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Função Antiga *</label>
                          <input type="text" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, oldPosition: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Função Proposta *</label>
                          <input type="text" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, newPosition: e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Data da Mudança *</label>
                        <input type="date" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, changeDate: e.target.value})} />
                      </div>
                    </React.Fragment>
                  )}

                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium mb-3">Selecione as Equipes * ({selectedTeams.length} selecionadas)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TEAMS.map(team => (
                        <label key={team.id} className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer ${selectedTeams.includes(team.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                          <input
                            type="checkbox"
                            checked={selectedTeams.includes(team.id)}
                            onChange={() => toggleTeam(team.id)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{team.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleCreateMovement}
                    disabled={selectedTeams.length === 0}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    Criar Movimentação
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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
                <p className="text-xs text-gray-500">{currentUser.team_name}</p>
              </div>
              <button onClick={() => { setCurrentUser(null); setView('login'); }} className="text-gray-600 hover:text-gray-900">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {view === 'dashboard' && <DashboardView />}

        {view === 'detail' && selectedMovement && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">{selectedMovement.employeeName}</h2>
              <button onClick={() => { setView('dashboard'); setSelectedMovement(null); }} className="text-gray-600 hover:text-gray-900">← Voltar</button>
            </div>
            
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold">Pareceres das Equipes:</h3>
              {selectedMovement.selectedTeams?.map(teamId => {
                const team = TEAMS.find(t => t.id === teamId);
                const response = selectedMovement.responses[teamId];
                const isMyTeam = teamId === currentUser?.team_id;
                
                return (
                  <div key={teamId} className={`border rounded-lg p-4 ${isMyTeam ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{team?.name} {isMyTeam && '(Sua Equipe)'}</span>
                      <span className={`text-xs px-2 py-1 rounded ${response?.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {response?.status === 'completed' ? 'Respondido' : 'Pendente'}
                      </span>
                    </div>
                    {response?.comment && (
                      <p className="text-sm text-gray-700 bg-white p-3 rounded">{response.comment}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {currentUser?.team_id && selectedMovement.selectedTeams?.includes(currentUser.team_id) && !selectedMovement.responses[currentUser.team_id]?.comment && (
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-3">Adicionar Parecer</h3>
                <textarea
                  placeholder="Digite seu parecer aqui..."
                  className="w-full border rounded-lg p-3 h-32"
                  onKeyUp={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    const btn = document.getElementById('submit-btn');
                    if (btn) {
                      if (target.value.trim()) {
                        btn.removeAttribute('disabled');
                      } else {
                        btn.setAttribute('disabled', 'true');
                      }
                    }
                  }}
                  id="comment-input"
                />
                <button
                  id="submit-btn"
                  disabled
                  onClick={() => {
                    const input = document.getElementById('comment-input') as HTMLTextAreaElement;
                    if (input && input.value.trim() && currentUser?.team_id) {
                      const updated = movements.map(m => {
                        if (m.id === selectedMovement.id) {
                          return {
                            ...m,
                            responses: {
                              ...m.responses,
                              [currentUser.team_id!]: {
                                status: 'completed',
                                comment: input.value,
                                date: new Date().toISOString().split('T')[0]
                              }
                            }
                          };
                        }
                        return m;
                      });
                      setMovements(updated);
                      alert('Parecer enviado com sucesso!');
                      setView('dashboard');
                      setSelectedMovement(null);
                    }
                  }}
                  className="mt-3 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Enviar Parecer
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
