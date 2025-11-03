// Lista de usuários autorizados
export const AUTHORIZED_USERS = [
  {
    id: '1',
    email: 'admin@empresa.com',
    password: 'admin123', // MUDE ESTA SENHA!
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
    password: 'rh123', // MUDE ESTA SENHA!
    name: 'RH Demissões',
    role: 'admin' as const,
    can_manage_demissoes: true,
    can_manage_transferencias: false,
    team_id: 'financeiro',
    team_name: 'Financeiro'
  },
  {
    id: '3',
    email: 'ponto@empresa.com',
    password: 'ponto123', // MUDE ESTA SENHA!
    name: 'Equipe Ponto',
    role: 'team_member' as const,
    can_manage_demissoes: false,
    can_manage_transferencias: false,
    team_id: 'ponto',
    team_name: 'Ponto'
  },
  {
    id: '4',
    email: 'ti@empresa.com',
    password: 'ti123', // MUDE ESTA SENHA!
    name: 'Equipe TI',
    role: 'team_member' as const,
    can_manage_demissoes: false,
    can_manage_transferencias: false,
    team_id: 'ti',
    team_name: 'T.I'
  },
  {
    id: '5',
    email: 'desenvolvimento@empresa.com',
    password: 'dev123', // MUDE ESTA SENHA!
    name: 'Equipe Desenvolvimento',
    role: 'team_member' as const,
    can_manage_demissoes: false,
    can_manage_transferencias: false,
    team_id: 'desenvolvimento',
    team_name: 'Desenvolvimento'
  }
];
