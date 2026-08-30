// Tipos para o checklist configurável (substitui o objeto CHECKLISTS
// que hoje está hardcoded em App.tsx).
//
// O "id" de cada item é fixo e nunca muda, mesmo que o texto (label)
// seja editado depois. É esse id que é usado como chave ao salvar as
// respostas em movements.responses[team].checklist — por isso editar
// o texto de um item não quebra respostas já dadas.

export type TipoCampoChecklist = 'checkbox' | 'texto';

export interface ChecklistItemConfig {
  id: string;
  movement_type: string; // 'demissao' | 'transferencia' | 'alteracao' | 'promocao'
  team_id: string;       // 'rh' | 'ponto' | 'transporte' | 'ti' | 'seguranca' | 'ambulatorio' | 'beneficios' | 'financeiro' | 'dp' | 'treinamento' | 'comunicacao'
  label: string;
  ativo: boolean;
  obrigatorio: boolean;           // se false, não bloqueia o envio do parecer da equipe
  tipo_campo: TipoCampoChecklist; // 'checkbox' (padrão) ou 'texto' (campo livre, ex: matrícula)
  alternativas: string[] | null;  // opções alternativas ao checkbox principal (igual ao modelo de Admissão).
                                    // Se preenchido, o item é considerado atendido se o principal FOR marcado
                                    // OU se uma das alternativas for selecionada (mutuamente exclusivas).
  exige_observacao_se_pendente: boolean; // se obrigatorio=true e o item não estiver atendido, exige um texto de observação (ex: "Título de Eleitor" na Admissão)
  ordem: number;
  created_at: string;
  created_by?: string | null;
  updated_at: string;
  updated_by?: string | null;
}

export type NovoChecklistItem = Pick<
  ChecklistItemConfig,
  'movement_type' | 'team_id' | 'label'
> &
  Partial<Pick<ChecklistItemConfig, 'obrigatorio' | 'tipo_campo' | 'alternativas' | 'exige_observacao_se_pendente'>>;

// ============================================================
// Resposta de um item, salva dentro de
// movements.responses[team_id].checklist[item_id]
// ============================================================
export interface ItemRespostaChecklist {
  marcado: boolean;
  alternativa_selecionada?: string | null;
  valor_texto?: string;
  observacao?: string; // usado quando exige_observacao_se_pendente=true e o item não foi marcado
  data_marcacao?: string;
  usuario_marcacao?: string;
  email_usuario_marcacao?: string;
}

/** Verifica se um item está "atendido", considerando se é obrigatório, se tem alternativas, etc. */
export function itemAtendido(
  item: ChecklistItemConfig,
  resposta: ItemRespostaChecklist | undefined
): boolean {
  if (!item.obrigatorio) return true; // item opcional nunca bloqueia
  if (item.tipo_campo === 'texto') return !!resposta?.valor_texto?.trim();
  if (item.exige_observacao_se_pendente) return !!resposta?.marcado || !!resposta?.observacao?.trim();
  if (item.alternativas && item.alternativas.length > 0) {
    return !!resposta?.marcado || !!resposta?.alternativa_selecionada;
  }
  return !!resposta?.marcado;
}

// Gera um id legível e único a partir do tipo, equipe e texto do item.
// Ex: gerarIdItem('demissao', 'dp', 'Valores farmácia') -> 'demissao_dp_valores_farmacia_1a2b3c'
export function gerarIdItem(movementType: string, teamId: string, label: string): string {
  const slug = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);

  const sufixo = Math.random().toString(36).slice(2, 8);
  return `${movementType}_${teamId}_${slug}_${sufixo}`;
}
