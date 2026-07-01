/**
 * Tipos e Enums para o módulo "Admissão"
 * Define estrutura de dados importados do TXT, controle de visibilidade por equipe
 * e regras de checklist de documentos (baseado em REGRAS_DE_NEGOCIO.xlsx)
 */

// ============================================
// CAMPOS DO FORMULÁRIO DE ADMISSÃO
// (chaves usadas tanto no parser do TXT quanto no mapa de acesso)
// ============================================

export enum CampoAdmissao {
  NOME = 'nome',
  CPF = 'cpf',
  DATA_NASCIMENTO = 'data_nascimento',
  CONTATO = 'contato',
  CIDADE = 'cidade',
  EMAIL = 'email',
  CODIGO_CADASTRO_RM = 'codigo_cadastro_rm',
  CHAPA = 'chapa',

  EMPRESA = 'empresa',
  DATA_INICIO = 'data_inicio',
  LIDER = 'lider',
  TIPO_CONTRATO = 'tipo_contrato',
  TEMPO_EXPERIENCIA = 'tempo_experiencia',
  FUNCAO = 'funcao',
  SECAO = 'secao',

  SALARIO_BASE = 'salario_base',
  BONIFICACAO = 'bonificacao',
  GRATIFICACAO = 'gratificacao',
  INSALUBRIDADE = 'insalubridade',
  CARGO_CONFIANCA = 'cargo_confianca',
  PERICULOSIDADE = 'periculosidade',
  ASSIDUIDADE = 'assiduidade',
  COMISSAO = 'comissao',
  AJUDA_CUSTO = 'ajuda_custo',
  AJUDA_CUSTO_LANCHE = 'ajuda_custo_lanche',
  DIARIA_VIAGEM = 'diaria_viagem',
  RECEBE_HORAS_EXTRAS = 'recebe_horas_extras',
  JORNADA_TRABALHO = 'jornada_trabalho',
  OBSERVACOES = 'observacoes',
}

export const CATEGORIA_CAMPO: Record<CampoAdmissao, 'Dados do Colaborador' | 'Dados da Contratação' | 'Remuneração'> = {
  [CampoAdmissao.NOME]: 'Dados do Colaborador',
  [CampoAdmissao.CPF]: 'Dados do Colaborador',
  [CampoAdmissao.DATA_NASCIMENTO]: 'Dados do Colaborador',
  [CampoAdmissao.CONTATO]: 'Dados do Colaborador',
  [CampoAdmissao.CIDADE]: 'Dados do Colaborador',
  [CampoAdmissao.EMAIL]: 'Dados do Colaborador',
  [CampoAdmissao.CODIGO_CADASTRO_RM]: 'Dados do Colaborador',
  [CampoAdmissao.CHAPA]: 'Dados do Colaborador',

  [CampoAdmissao.EMPRESA]: 'Dados da Contratação',
  [CampoAdmissao.DATA_INICIO]: 'Dados da Contratação',
  [CampoAdmissao.LIDER]: 'Dados da Contratação',
  [CampoAdmissao.TIPO_CONTRATO]: 'Dados da Contratação',
  [CampoAdmissao.TEMPO_EXPERIENCIA]: 'Dados da Contratação',
  [CampoAdmissao.FUNCAO]: 'Dados da Contratação',
  [CampoAdmissao.SECAO]: 'Dados da Contratação',

  [CampoAdmissao.SALARIO_BASE]: 'Remuneração',
  [CampoAdmissao.BONIFICACAO]: 'Remuneração',
  [CampoAdmissao.GRATIFICACAO]: 'Remuneração',
  [CampoAdmissao.INSALUBRIDADE]: 'Remuneração',
  [CampoAdmissao.CARGO_CONFIANCA]: 'Remuneração',
  [CampoAdmissao.PERICULOSIDADE]: 'Remuneração',
  [CampoAdmissao.ASSIDUIDADE]: 'Remuneração',
  [CampoAdmissao.COMISSAO]: 'Remuneração',
  [CampoAdmissao.AJUDA_CUSTO]: 'Remuneração',
  [CampoAdmissao.AJUDA_CUSTO_LANCHE]: 'Remuneração',
  [CampoAdmissao.DIARIA_VIAGEM]: 'Remuneração',
  [CampoAdmissao.RECEBE_HORAS_EXTRAS]: 'Remuneração',
  [CampoAdmissao.JORNADA_TRABALHO]: 'Remuneração',
  [CampoAdmissao.OBSERVACOES]: 'Remuneração',
};

export const LABEL_CAMPO_ADMISSAO: Record<CampoAdmissao, string> = {
  [CampoAdmissao.NOME]: 'Nome',
  [CampoAdmissao.CPF]: 'CPF',
  [CampoAdmissao.DATA_NASCIMENTO]: 'Data de nascimento',
  [CampoAdmissao.CONTATO]: 'Contato',
  [CampoAdmissao.CIDADE]: 'Cidade',
  [CampoAdmissao.EMAIL]: 'E-mail',
  [CampoAdmissao.CODIGO_CADASTRO_RM]: 'Código de cadastro RM',
  [CampoAdmissao.CHAPA]: 'Chapa',
  [CampoAdmissao.EMPRESA]: 'Empresa',
  [CampoAdmissao.DATA_INICIO]: 'Data de Início',
  [CampoAdmissao.LIDER]: 'Líder',
  [CampoAdmissao.TIPO_CONTRATO]: 'Tipo de Contrato',
  [CampoAdmissao.TEMPO_EXPERIENCIA]: 'Tempo de experiência / contrato',
  [CampoAdmissao.FUNCAO]: 'Função',
  [CampoAdmissao.SECAO]: 'Seção',
  [CampoAdmissao.SALARIO_BASE]: 'Salário base',
  [CampoAdmissao.BONIFICACAO]: 'Bonificação',
  [CampoAdmissao.GRATIFICACAO]: 'Gratificação',
  [CampoAdmissao.INSALUBRIDADE]: 'Insalubridade',
  [CampoAdmissao.CARGO_CONFIANCA]: 'Cargo de confiança',
  [CampoAdmissao.PERICULOSIDADE]: 'Periculosidade',
  [CampoAdmissao.ASSIDUIDADE]: 'Assiduidade',
  [CampoAdmissao.COMISSAO]: 'Comissão',
  [CampoAdmissao.AJUDA_CUSTO]: 'Ajuda de custo',
  [CampoAdmissao.AJUDA_CUSTO_LANCHE]: 'Ajuda de custo lanche',
  [CampoAdmissao.DIARIA_VIAGEM]: 'Diária viagem',
  [CampoAdmissao.RECEBE_HORAS_EXTRAS]: 'Recebe horas extras',
  [CampoAdmissao.JORNADA_TRABALHO]: 'Jornada de trabalho',
  [CampoAdmissao.OBSERVACOES]: 'Observações',
};

/** Campos obrigatórios para o TXT ser considerado válido para importação */
export const CAMPOS_OBRIGATORIOS_IMPORTACAO: CampoAdmissao[] = [
  CampoAdmissao.NOME,
  CampoAdmissao.CPF,
  CampoAdmissao.EMPRESA,
  CampoAdmissao.DATA_INICIO,
  CampoAdmissao.FUNCAO,
];

// ============================================
// CONTROLE DE ACESSO POR CAMPO
// Baseado em Lista_Campos_Modelo_Admissao.xlsx (coluna "EQUIPES COM ACESSO AO CAMPO")
// 'TODAS' = todas as equipes podem ver
// ['DP'] = somente a(s) equipe(s) listada(s)
// A flag especial CRIADOR_MOVIMENTACAO libera também para quem criou o registro
// ============================================

export const CRIADOR_MOVIMENTACAO = '__CRIADOR__';

export const EQUIPES_ACESSO_CAMPO: Record<CampoAdmissao, 'TODAS' | string[]> = {
  [CampoAdmissao.NOME]: 'TODAS',
  [CampoAdmissao.CPF]: 'TODAS',
  [CampoAdmissao.DATA_NASCIMENTO]: 'TODAS',
  [CampoAdmissao.CONTATO]: 'TODAS',
  [CampoAdmissao.CIDADE]: 'TODAS',
  [CampoAdmissao.EMAIL]: 'TODAS',
  [CampoAdmissao.CODIGO_CADASTRO_RM]: 'TODAS',
  [CampoAdmissao.CHAPA]: 'TODAS',

  [CampoAdmissao.EMPRESA]: 'TODAS',
  [CampoAdmissao.DATA_INICIO]: 'TODAS',
  [CampoAdmissao.LIDER]: 'TODAS',
  [CampoAdmissao.TIPO_CONTRATO]: 'TODAS',
  [CampoAdmissao.TEMPO_EXPERIENCIA]: 'TODAS',
  [CampoAdmissao.FUNCAO]: 'TODAS',
  [CampoAdmissao.SECAO]: 'TODAS',

  [CampoAdmissao.SALARIO_BASE]: ['DP'],
  [CampoAdmissao.BONIFICACAO]: ['DP'],
  [CampoAdmissao.GRATIFICACAO]: ['DP'],
  [CampoAdmissao.INSALUBRIDADE]: ['DP'],
  [CampoAdmissao.CARGO_CONFIANCA]: ['DP'],
  [CampoAdmissao.PERICULOSIDADE]: ['DP'],
  [CampoAdmissao.ASSIDUIDADE]: ['DP'],
  [CampoAdmissao.COMISSAO]: ['DP'],
  [CampoAdmissao.AJUDA_CUSTO]: ['DP'],
  [CampoAdmissao.AJUDA_CUSTO_LANCHE]: ['DP'],
  [CampoAdmissao.DIARIA_VIAGEM]: ['DP'],
  [CampoAdmissao.RECEBE_HORAS_EXTRAS]: ['DP'],
  [CampoAdmissao.JORNADA_TRABALHO]: ['DP'],
  [CampoAdmissao.OBSERVACOES]: ['DP', CRIADOR_MOVIMENTACAO],
};

/**
 * Verifica se um campo pode ser visto por um usuário, dado o nome das equipes
 * dele (currentUser.team_names) e se ele é o criador da movimentação.
 */
export function campoVisivelParaUsuario(
  campo: CampoAdmissao,
  equipesUsuario: string[],
  isCriador: boolean,
  isAdmin?: boolean
): boolean {
  if (isAdmin) return true;
  const regra = EQUIPES_ACESSO_CAMPO[campo];
  if (regra === 'TODAS') return true;
  if (regra.includes(CRIADOR_MOVIMENTACAO) && isCriador) return true;
  return regra.some(equipe => equipesUsuario.includes(equipe));
}

/** Filtra o objeto de dados de admissão, retornando apenas os campos visíveis para o usuário */
export function filtrarCamposVisiveis(
  dados: Partial<Record<CampoAdmissao, string>>,
  equipesUsuario: string[],
  isCriador: boolean,
  isAdmin?: boolean
): Partial<Record<CampoAdmissao, string>> {
  const resultado: Partial<Record<CampoAdmissao, string>> = {};
  (Object.keys(dados) as CampoAdmissao[]).forEach(campo => {
    if (campoVisivelParaUsuario(campo, equipesUsuario, isCriador, isAdmin)) {
      resultado[campo] = dados[campo];
    }
  });
  return resultado;
}

// ============================================
// CHECKLIST DE DOCUMENTOS (baseado em REGRAS_DE_NEGOCIO.xlsx)
// ============================================

export type TipoValidacao =
  | 'obrigatorio' // precisa estar marcado
  | 'obrigatorio_com_observacao' // se não marcado, exige observação
  | 'opcional' // não obrigatório
  | 'principal_ou_secundario'; // obrigatório o principal OU exatamente um secundário

export type TipoCampoChecklist = 'checkbox' | 'texto';

export interface RegraChecklistAdmissao {
  id: string; // slug único do item
  equipe: string; // equipe responsável (deve bater com Usuario.team_names)
  campo_principal: string;
  campos_secundarios?: string[]; // opções dependentes (mutuamente exclusivas)
  tipo_campo: TipoCampoChecklist; // 'texto' apenas para MATRICULA
  validacao: TipoValidacao;
  observacao_regra?: string; // texto livre explicando o comportamento (para tooltip/ajuda)
}

export const CHECKLIST_REGRAS_ADMISSAO: RegraChecklistAdmissao[] = [
  // Recursos Humanos
  { id: 'rh_identidade', equipe: 'Recursos Humanos', campo_principal: 'IDENTIDADE', tipo_campo: 'checkbox', validacao: 'obrigatorio' },
  { id: 'rh_cpf', equipe: 'Recursos Humanos', campo_principal: 'CPF', tipo_campo: 'checkbox', validacao: 'obrigatorio' },
  {
    id: 'rh_cnh', equipe: 'Recursos Humanos', campo_principal: 'CNH', tipo_campo: 'checkbox',
    campos_secundarios: ['ENTREGUE NA VALIDADE', 'ENTREGUE PORÉM VENCIDA'],
    validacao: 'principal_ou_secundario',
    observacao_regra: 'Se marcada a opção de CNH, habilita os campos secundários; obrigatoriamente apenas um secundário deve ser marcado.',
  },
  { id: 'rh_comprovante_endereco', equipe: 'Recursos Humanos', campo_principal: 'COMPROVANTE DE ENDEREÇO', tipo_campo: 'checkbox', validacao: 'obrigatorio' },
  { id: 'rh_comprovante_escolaridade', equipe: 'Recursos Humanos', campo_principal: 'COMPROVANTE DE ESCOLARIDADE', tipo_campo: 'checkbox', validacao: 'obrigatorio' },
  {
    id: 'rh_titulo_eleitor', equipe: 'Recursos Humanos', campo_principal: 'TÍTULO DE ELEITOR', tipo_campo: 'checkbox',
    validacao: 'obrigatorio_com_observacao',
    observacao_regra: 'Não é obrigatório estar marcado, porém caso não esteja, obrigatoriamente deve ter uma observação do setor.',
  },
  {
    id: 'rh_reservista', equipe: 'Recursos Humanos', campo_principal: 'RESERVISTA', tipo_campo: 'checkbox',
    campos_secundarios: ['COLABORADORA DO SEXO FEMININO', 'DISPENSADO PELA IDADE'],
    validacao: 'principal_ou_secundario',
    observacao_regra: 'Obrigatório o campo principal OU pelo menos um campo secundário marcado.',
  },
  { id: 'rh_cartao_sus', equipe: 'Recursos Humanos', campo_principal: 'CARTÃO DO SUS', tipo_campo: 'checkbox', validacao: 'obrigatorio' },
  {
    id: 'rh_portabilidade', equipe: 'Recursos Humanos', campo_principal: 'PORTABILIDADE', tipo_campo: 'checkbox',
    campos_secundarios: ['CONTA POUPANÇA', 'CONTA CORRENTE'],
    validacao: 'principal_ou_secundario',
    observacao_regra: 'Ao marcar, habilita os campos secundários; apenas um deve ser marcado.',
  },
  { id: 'rh_cartao_vacina', equipe: 'Recursos Humanos', campo_principal: 'CARTÃO DE VACINA', tipo_campo: 'checkbox', validacao: 'obrigatorio' },
  { id: 'rh_primeiro_emprego', equipe: 'Recursos Humanos', campo_principal: '1º EMPREGO', tipo_campo: 'checkbox', validacao: 'opcional' },

  // Ponto
  { id: 'ponto_orientacao_clockin', equipe: 'Ponto', campo_principal: 'ORIENTAÇÃO CLOCK-IN REALIZADA', tipo_campo: 'checkbox', validacao: 'obrigatorio' },
  {
    id: 'ponto_cartao_ponto', equipe: 'Ponto', campo_principal: 'UTILIZAÇÃO DE CARTÃO DE PONTO', tipo_campo: 'checkbox',
    campos_secundarios: ['MENOR APRENDIZ', 'ESTAGIÁRIO', 'CARGO DE CONFIANÇA CADASTRADO'],
    validacao: 'principal_ou_secundario',
  },
  { id: 'ponto_sindicato', equipe: 'Ponto', campo_principal: 'SINDICATO DE PONTO CADASTRADO', tipo_campo: 'checkbox', validacao: 'obrigatorio' },
  {
    id: 'ponto_aprovacao_dispositivo', equipe: 'Ponto', campo_principal: 'APROVAÇÃO DO DISPOSITIVO', tipo_campo: 'checkbox',
    campos_secundarios: ['NÃO IRÁ UTILIZAR DISPOSITIVO PRÓPRIO', 'NÃO REALIZA REGISTRO DE PONTO'],
    validacao: 'principal_ou_secundario',
  },

  // Treinamento e Desenvolvimento
  {
    id: 'td_treinamentos', equipe: 'Treinamento e Desenvolvimento', campo_principal: 'TREINAMENTOS OBRIGATÓRIOS CONFERIDOS', tipo_campo: 'checkbox',
    campos_secundarios: ['SEM TREINAMENTOS OBRIGATÓRIOS PARA FUNÇÃO'],
    validacao: 'principal_ou_secundario',
  },

  // Comunicação
  { id: 'com_grupo_whatsapp', equipe: 'Comunicação', campo_principal: 'INCLUSÃO NO GRUPO WHATSAPP', tipo_campo: 'checkbox', validacao: 'obrigatorio' },
  { id: 'com_cadastro_caule', equipe: 'Comunicação', campo_principal: 'ORIENTADO QUANTO CADASTRO DO CAULE', tipo_campo: 'checkbox', validacao: 'obrigatorio' },

  // Benefícios
  {
    id: 'benef_plano_saude', equipe: 'Beneficios', campo_principal: 'SOLICITAÇÃO PLANO DE SAÚDE ENVIADA', tipo_campo: 'checkbox',
    campos_secundarios: ['NÃO ADERIU AO PLANO, DOCUMENTAÇÃO ARQUIVADA', 'NÃO PARTICIPANTE DO BENEFÍCIO'],
    validacao: 'principal_ou_secundario',
  },
  {
    id: 'benef_plano_odonto', equipe: 'Beneficios', campo_principal: 'SOLICITAÇÃO PLANO ODONTOLÓGICO ENVIADA', tipo_campo: 'checkbox',
    campos_secundarios: ['NÃO ADERIU AO PLANO, DOCUMENTAÇÃO ARQUIVADA', 'NÃO PARTICIPANTE DO BENEFÍCIO'],
    validacao: 'principal_ou_secundario',
  },
  {
    id: 'benef_seguro_vida', equipe: 'Beneficios', campo_principal: 'DESIGNAÇÃO DEPENDENTES SEGURO DE VIDA', tipo_campo: 'checkbox',
    campos_secundarios: ['DOCUMENTAÇÃO ARQUIVADA'],
    validacao: 'obrigatorio',
  },

  // Segurança do Trabalho
  { id: 'seg_ordem_servico', equipe: 'Segurança do Trabalho', campo_principal: 'ORDEM DE SERVIÇO', tipo_campo: 'checkbox', validacao: 'obrigatorio' },
  {
    id: 'seg_treinamentos', equipe: 'Segurança do Trabalho', campo_principal: 'TREINAMENTOS OBRIGATÓRIOS CONFERIDOS', tipo_campo: 'checkbox',
    campos_secundarios: ['SEM TREINAMENTOS OBRIGATÓRIOS PARA FUNÇÃO'],
    validacao: 'principal_ou_secundario',
  },

  // Ambulatório
  { id: 'amb_aso', equipe: 'Ambulatorio', campo_principal: 'ASO', tipo_campo: 'checkbox', validacao: 'obrigatorio' },

  // DP
  { id: 'dp_conta_bancaria', equipe: 'DP', campo_principal: 'CONTA BANCÁRIA CADASTRADA', tipo_campo: 'checkbox', validacao: 'obrigatorio' },
  { id: 'dp_dossie_pessoal', equipe: 'DP', campo_principal: 'DOSSIÊ DIGITAL (DOCUMENTAÇÃO PESSOAL)', tipo_campo: 'checkbox', validacao: 'obrigatorio' },
  { id: 'dp_dossie_trabalhista', equipe: 'DP', campo_principal: 'DOSSIÊ DIGITAL (DOCUMENTAÇÃO TRABALHISTA)', tipo_campo: 'checkbox', validacao: 'obrigatorio' },
  { id: 'dp_matricula', equipe: 'DP', campo_principal: 'MATRÍCULA', tipo_campo: 'texto', validacao: 'obrigatorio', observacao_regra: 'Campo de texto livre para digitar o número da matrícula.' },
  { id: 'dp_esocial', equipe: 'DP', campo_principal: 'ENVIO ADMISSÃO ESOCIAL', tipo_campo: 'checkbox', validacao: 'obrigatorio' },
  { id: 'dp_docusign', equipe: 'DP', campo_principal: 'DOCUMENTAÇÃO DOCUSIGN ASSINADO', tipo_campo: 'checkbox', validacao: 'obrigatorio' },
  { id: 'dp_cracha', equipe: 'DP', campo_principal: 'CRACHÁ ENTREGUE', tipo_campo: 'checkbox', validacao: 'obrigatorio' },
];

/** Lista de nomes de equipes distintas que participam do checklist de admissão */
export const EQUIPES_CHECKLIST_ADMISSAO: string[] = Array.from(
  new Set(CHECKLIST_REGRAS_ADMISSAO.map(r => r.equipe))
);

// ============================================
// ITEM DE CHECKLIST PREENCHIDO (persistido no registro)
// ============================================

export interface ItemChecklistAdmissao {
  regra_id: string; // referencia RegraChecklistAdmissao.id
  marcado: boolean; // estado do campo principal
  secundario_selecionado?: string; // qual campo secundário foi escolhido (quando aplicável)
  valor_texto?: string; // usado quando tipo_campo === 'texto' (ex: matrícula)
  observacao?: string; // observação obrigatória em certos casos (ex: título de eleitor)
  data_marcacao?: string;
  usuario_marcacao?: string;
  email_usuario_marcacao?: string;
}

export function buildChecklistInicialAdmissao(): ItemChecklistAdmissao[] {
  return CHECKLIST_REGRAS_ADMISSAO.map(r => ({ regra_id: r.id, marcado: false }));
}

/** Verifica se um item individual do checklist está "atendido" segundo sua regra de validação */
export function itemChecklistAtendido(item: ItemChecklistAdmissao, regra: RegraChecklistAdmissao): boolean {
  switch (regra.validacao) {
    case 'obrigatorio':
      return regra.tipo_campo === 'texto' ? !!item.valor_texto?.trim() : item.marcado;
    case 'opcional':
      return true;
    case 'obrigatorio_com_observacao':
      return item.marcado || !!item.observacao?.trim();
    case 'principal_ou_secundario':
      return item.marcado || !!item.secundario_selecionado;
    default:
      return false;
  }
}

/** Retorna os itens de checklist pendentes (não atendidos) para uma equipe específica */
export function getPendenciasChecklistEquipe(
  checklist: ItemChecklistAdmissao[],
  equipe: string
): RegraChecklistAdmissao[] {
  const regrasEquipe = CHECKLIST_REGRAS_ADMISSAO.filter(r => r.equipe === equipe);
  return regrasEquipe.filter(regra => {
    const item = checklist.find(i => i.regra_id === regra.id);
    if (!item) return true;
    return !itemChecklistAtendido(item, regra);
  });
}

/** Percentual de conclusão do checklist inteiro (todas as equipes) */
export function calcularPercentualConclusaoAdmissao(checklist: ItemChecklistAdmissao[]): number {
  if (CHECKLIST_REGRAS_ADMISSAO.length === 0) return 0;
  const atendidos = CHECKLIST_REGRAS_ADMISSAO.filter(regra => {
    const item = checklist.find(i => i.regra_id === regra.id);
    return item ? itemChecklistAtendido(item, regra) : false;
  }).length;
  return Math.round((atendidos / CHECKLIST_REGRAS_ADMISSAO.length) * 100);
}

export function checklistCompletoAdmissao(checklist: ItemChecklistAdmissao[]): boolean {
  return CHECKLIST_REGRAS_ADMISSAO.every(regra => {
    const item = checklist.find(i => i.regra_id === regra.id);
    return item ? itemChecklistAtendido(item, regra) : false;
  });
}

// ============================================
// REGISTRO PRINCIPAL DE ADMISSÃO
// ============================================

export type StatusAdmissao = 'pendente' | 'em_andamento' | 'concluido';

export interface AuditoriaItemAdmissao {
  usuario: string;
  email_usuario: string;
  acao: 'importacao' | 'marcacao_checklist' | 'desmarcacao_checklist' | 'edicao_observacao' | 'edicao_campo';
  campo_ou_item?: string;
  data_hora: string;
  detalhes?: string;
}

export interface AcompanhamentoAdmissao {
  id: string;
  movimento_id: string;
  dados: Partial<Record<CampoAdmissao, string>>; // dados vindos do TXT importado
  checklist: ItemChecklistAdmissao[];
  status: StatusAdmissao;
  data_criacao: string;
  data_conclusao?: string;
  usuario_criacao: string;
  email_usuario_criacao: string;
  historico_auditoria: AuditoriaItemAdmissao[];
}
