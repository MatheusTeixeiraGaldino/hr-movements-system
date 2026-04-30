/**
 * Tipos e Enums para o módulo "Acompanhamento Dossiê"
 * Define estrutura de desligamentos, documentos obrigatórios e regras de negócio
 */

export enum TipoDesligamento {
  PEDIDO_DEMISSAO = 'pedido_demissao',
  TERMINO_CONTRATO = 'termino_contrato',
  DISPENSA_SEM_JUSTA_CAUSA = 'dispensa_sem_justa_causa',
  DISPENSA_COM_JUSTA_CAUSA = 'dispensa_com_justa_causa',
  ABANDONO_EMPREGO = 'abandono_emprego',
  COMUM_ACORDO = 'comum_acordo',
  OBITO = 'obito',
  OUTROS_MOTIVOS = 'outros_motivos',
}

export enum TipoDocumento {
  // Documentos gerais (variam por tipo de desligamento)
  MOVIMENTACAO_TRABALHISTA = 'movimentacao_trabalhista',
  AVISO_PREVIO = 'aviso_previo',
  TRCT = 'trct',
  EMAIL_SETOR = 'email_setor',
  SEGURO_DESEMPREGO = 'seguro_desemprego',
  EXTRATO_FGTS = 'extrato_fgts',
  CARTA_ABANDONO = 'carta_abandono',
  DESCRICAO_MOTIVO = 'descricao_motivo',

  // Documentos SESMT (obrigatórios para TODOS)
  ASO = 'aso',
  FICHA_EPI = 'ficha_epi',
  FICHA_MEDICA = 'ficha_medica',
  DOSSIE_SESMT = 'dossie_sesmt',
  DECLARACAO_NAO_REALIZACAO_EXAMES = 'declaracao_nao_realizacao_exames',
}

export enum StatusDossie {
  PENDENTE = 'pendente',
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDO = 'concluido',
}

/**
 * Documentos específicos por tipo de desligamento (NÃO inclui obrigatórios SESMT)
 */
export const DOCUMENTOS_ESPECIFICOS_POR_DESLIGAMENTO: Record<TipoDesligamento, TipoDocumento[]> = {
  [TipoDesligamento.PEDIDO_DEMISSAO]: [
    TipoDocumento.MOVIMENTACAO_TRABALHISTA,
    TipoDocumento.AVISO_PREVIO,
    TipoDocumento.TRCT,
    TipoDocumento.EMAIL_SETOR,
  ],
  [TipoDesligamento.TERMINO_CONTRATO]: [
    TipoDocumento.MOVIMENTACAO_TRABALHISTA,
    TipoDocumento.TRCT,
    TipoDocumento.EMAIL_SETOR,
  ],
  [TipoDesligamento.DISPENSA_SEM_JUSTA_CAUSA]: [
    TipoDocumento.MOVIMENTACAO_TRABALHISTA,
    TipoDocumento.AVISO_PREVIO,
    TipoDocumento.TRCT,
    TipoDocumento.SEGURO_DESEMPREGO,
    TipoDocumento.EMAIL_SETOR,
    TipoDocumento.EXTRATO_FGTS,
  ],
  [TipoDesligamento.DISPENSA_COM_JUSTA_CAUSA]: [
    TipoDocumento.MOVIMENTACAO_TRABALHISTA,
    TipoDocumento.AVISO_PREVIO,
    TipoDocumento.TRCT,
    TipoDocumento.EMAIL_SETOR,
  ],
  [TipoDesligamento.ABANDONO_EMPREGO]: [
    TipoDocumento.MOVIMENTACAO_TRABALHISTA,
    TipoDocumento.TRCT,
    TipoDocumento.EMAIL_SETOR,
    TipoDocumento.CARTA_ABANDONO,
  ],
  [TipoDesligamento.COMUM_ACORDO]: [
    TipoDocumento.MOVIMENTACAO_TRABALHISTA,
    TipoDocumento.AVISO_PREVIO,
    TipoDocumento.TRCT,
    TipoDocumento.EMAIL_SETOR,
    TipoDocumento.EXTRATO_FGTS,
  ],
  [TipoDesligamento.OBITO]: [
    TipoDocumento.MOVIMENTACAO_TRABALHISTA,
    TipoDocumento.TRCT,
    TipoDocumento.EMAIL_SETOR,
    TipoDocumento.EXTRATO_FGTS,
  ],
  [TipoDesligamento.OUTROS_MOTIVOS]: [
    TipoDocumento.MOVIMENTACAO_TRABALHISTA,
    TipoDocumento.TRCT,
    TipoDocumento.EMAIL_SETOR,
    TipoDocumento.EXTRATO_FGTS,
    TipoDocumento.DESCRICAO_MOTIVO,
  ],
};

/**
 * Documentos SESMT obrigatórios para TODOS os casos
 */
export const DOCUMENTOS_OBRIGATORIOS_SESMT: TipoDocumento[] = [
  TipoDocumento.ASO,
  TipoDocumento.FICHA_EPI,
  TipoDocumento.FICHA_MEDICA,
  TipoDocumento.DOSSIE_SESMT,
  TipoDocumento.DECLARACAO_NAO_REALIZACAO_EXAMES,
];

/**
 * Rótulos amigáveis para os tipos de desligamento
 */
export const LABELS_DESLIGAMENTO: Record<TipoDesligamento, string> = {
  [TipoDesligamento.PEDIDO_DEMISSAO]: 'Pedido de Demissão',
  [TipoDesligamento.TERMINO_CONTRATO]: 'Término de Contrato',
  [TipoDesligamento.DISPENSA_SEM_JUSTA_CAUSA]: 'Dispensa sem Justa Causa',
  [TipoDesligamento.DISPENSA_COM_JUSTA_CAUSA]: 'Dispensa com Justa Causa',
  [TipoDesligamento.ABANDONO_EMPREGO]: 'Abandono de Emprego',
  [TipoDesligamento.COMUM_ACORDO]: 'Comum Acordo',
  [TipoDesligamento.OBITO]: 'Óbito',
  [TipoDesligamento.OUTROS_MOTIVOS]: 'Outros Motivos',
};

/**
 * Rótulos amigáveis para os tipos de documento
 */
export const LABELS_DOCUMENTO: Record<TipoDocumento, string> = {
  [TipoDocumento.MOVIMENTACAO_TRABALHISTA]: 'Movimentação Trabalhista',
  [TipoDocumento.AVISO_PREVIO]: 'Aviso Prévio',
  [TipoDocumento.TRCT]: 'TRCT',
  [TipoDocumento.EMAIL_SETOR]: 'Email do Setor',
  [TipoDocumento.SEGURO_DESEMPREGO]: 'Seguro Desemprego',
  [TipoDocumento.EXTRATO_FGTS]: 'Extrato FGTS',
  [TipoDocumento.CARTA_ABANDONO]: 'Carta de Abandono',
  [TipoDocumento.DESCRICAO_MOTIVO]: 'Descrição do Motivo',
  [TipoDocumento.ASO]: 'ASO (Atestado de Saúde Ocupacional)',
  [TipoDocumento.FICHA_EPI]: 'Ficha de EPI',
  [TipoDocumento.FICHA_MEDICA]: 'Ficha Médica',
  [TipoDocumento.DOSSIE_SESMT]: 'Dossiê SESMT',
  [TipoDocumento.DECLARACAO_NAO_REALIZACAO_EXAMES]: 'Declaração de Não Realização dos Exames Médicos',
};

/**
 * Interface para um item do checklist de dossiê
 */
export interface ItemChecklist {
  documento: TipoDocumento;
  marcado: boolean;
  data_marcacao?: string;
  usuario_marcacao?: string;
  email_usuario_marcacao?: string;
}

/**
 * Interface principal para o Acompanhamento Dossiê
 * ALTERAÇÃO: Adicionado campo data_demissao
 */
export interface AcompanhamentoDossie {
  id: string;
  movimento_id: string;
  tipo_desligamento: TipoDesligamento;
  employee_name: string;
  cpf?: string;
  chapa?: string;
  data_demissao?: string; // NOVO: Data de demissão (YYYY-MM-DD)
  status: StatusDossie;
  checklist: ItemChecklist[];
  observacao?: string;
  pasta_desligado?: string;
  data_criacao: string;
  data_conclusao?: string;
  usuario_criacao: string;
  email_usuario_criacao: string;
  historico_auditoria: AuditoriaItem[];
}

/**
 * Interface para registro de auditoria
 */
export interface AuditoriaItem {
  usuario: string;
  email_usuario: string;
  acao: 'criacao' | 'marcacao' | 'desmarcacao' | 'conclusao' | 'edicao_observacao' | 'alteracao_tipo';
  documento?: TipoDocumento;
  data_hora: string;
  detalhes?: string;
}

/**
 * Interface para configuração de acesso ao módulo
 */
export interface ConfiguracaoDossie {
  id: string;
  usuarios_autorizados: string[];
  emails_autorizados: string[];
  perfis_autorizados: string[];
  ativo: boolean;
  data_criacao: string;
  data_atualizacao: string;
}

/**
 * Função auxiliar: obter documentos específicos de um tipo de desligamento
 */
export function getDocumentosEspecificos(tipoDesligamento: TipoDesligamento): TipoDocumento[] {
  return DOCUMENTOS_ESPECIFICOS_POR_DESLIGAMENTO[tipoDesligamento] || [];
}

/**
 * Função auxiliar: obter TODOS os documentos (específicos + SESMT)
 */
export function getDocumentosObrigatorios(tipoDesligamento: TipoDesligamento): TipoDocumento[] {
  const especificos = getDocumentosEspecificos(tipoDesligamento);
  return [...especificos, ...DOCUMENTOS_OBRIGATORIOS_SESMT];
}

/**
 * Função auxiliar: verificar se ASO e Declaração são mutuamente exclusivos
 */
export function verificarExclusividadeASODeclaracao(checklist: ItemChecklist[]): boolean {
  const temASO = checklist.some(item => item.documento === TipoDocumento.ASO && item.marcado);
  const temDeclaracao = checklist.some(
    item => item.documento === TipoDocumento.DECLARACAO_NAO_REALIZACAO_EXAMES && item.marcado
  );
  return !(temASO && temDeclaracao);
}

/**
 * Função auxiliar: calcular percentual de conclusão
 */
export function calcularPercentualConclusao(checklist: ItemChecklist[]): number {
  if (checklist.length === 0) return 0;
  const marcados = checklist.filter(item => item.marcado).length;
  return Math.round((marcados / checklist.length) * 100);
}

/**
 * Função auxiliar: verificar se todos os documentos obrigatórios foram marcados
 */
export function todosMarcados(checklist: ItemChecklist[]): boolean {
  return checklist.every(item => item.marcado);
}

/**
 * Função auxiliar: verificar se todos os documentos necessários para o tipo estão marcados
 */
export function todosDocumentosNecessariosMarados(
  checklist: ItemChecklist[],
  tipoDesligamento: TipoDesligamento
): boolean {
  const documentosNecessarios = getDocumentosObrigatorios(tipoDesligamento);
  return documentosNecessarios.every(doc =>
    checklist.some(item => item.documento === doc && item.marcado)
  );
}

/**
 * Função auxiliar: obter documentos não marcados para um tipo específico
 */
export function getDocumentosAindaNaoMarcados(
  checklist: ItemChecklist[],
  tipoDesligamento: TipoDesligamento
): TipoDocumento[] {
  const documentosNecessarios = getDocumentosObrigatorios(tipoDesligamento);
  return documentosNecessarios.filter(
    doc => !checklist.some(item => item.documento === doc && item.marcado)
  );
}
