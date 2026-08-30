import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ChecklistItemConfig, NovoChecklistItem, gerarIdItem } from '../types/checklistConfig';

export function useChecklistConfig() {
  const [itens, setItens] = useState<ChecklistItemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('checklist_itens')
        .select('*')
        .order('movement_type', { ascending: true })
        .order('team_id', { ascending: true })
        .order('ordem', { ascending: true });

      if (err) throw err;
      setItens(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar checklist_itens:', err);
      setError('Erro ao carregar configuração de fluxos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarTodos();
  }, [carregarTodos]);

  // Retorna só os itens ATIVOS de um tipo+equipe, já ordenados.
  // É isso que o formulário de resposta (App.tsx) deve usar no lugar do CHECKLISTS.
  const getItensAtivos = useCallback(
    (movementType: string, teamId: string): ChecklistItemConfig[] => {
      return itens
        .filter(i => i.movement_type === movementType && i.team_id === teamId && i.ativo)
        .sort((a, b) => a.ordem - b.ordem);
    },
    [itens]
  );

  // Todos os itens (ativos e inativos) de um tipo, agrupados por equipe — usado na tela de admin.
  const getItensPorEquipe = useCallback(
    (movementType: string): Record<string, ChecklistItemConfig[]> => {
      const doTipo = itens.filter(i => i.movement_type === movementType);
      const agrupado: Record<string, ChecklistItemConfig[]> = {};
      for (const item of doTipo) {
        if (!agrupado[item.team_id]) agrupado[item.team_id] = [];
        agrupado[item.team_id].push(item);
      }
      for (const teamId of Object.keys(agrupado)) {
        agrupado[teamId].sort((a, b) => a.ordem - b.ordem);
      }
      return agrupado;
    },
    [itens]
  );

  const criarItem = async (novo: NovoChecklistItem, userEmail?: string) => {
    const maiorOrdem = itens
      .filter(i => i.movement_type === novo.movement_type && i.team_id === novo.team_id)
      .reduce((max, i) => Math.max(max, i.ordem), -1);

    const item: Omit<ChecklistItemConfig, 'created_at' | 'updated_at'> = {
      id: gerarIdItem(novo.movement_type, novo.team_id, novo.label),
      movement_type: novo.movement_type,
      team_id: novo.team_id,
      label: novo.label,
      ativo: true,
      obrigatorio: novo.obrigatorio ?? true,
      tipo_campo: novo.tipo_campo ?? 'checkbox',
      alternativas: novo.alternativas && novo.alternativas.length > 0 ? novo.alternativas : null,
      exige_observacao_se_pendente: novo.exige_observacao_se_pendente ?? false,
      ordem: maiorOrdem + 1,
      created_by: userEmail || null,
      updated_by: userEmail || null,
    };

    const { error: err } = await supabase.from('checklist_itens').insert([item]);
    if (err) throw err;
    await carregarTodos();
    notificarSeAdmissao(novo.movement_type);
  };

  // Edição completa: texto, obrigatoriedade, tipo de campo e alternativas de uma vez.
  const editarItem = async (
    id: string,
    dados: Partial<Pick<ChecklistItemConfig, 'label' | 'obrigatorio' | 'tipo_campo' | 'alternativas' | 'exige_observacao_se_pendente'>>,
    userEmail?: string
  ) => {
    const payload: any = { ...dados, updated_by: userEmail || null };
    if ('alternativas' in payload) {
      payload.alternativas = payload.alternativas && payload.alternativas.length > 0 ? payload.alternativas : null;
    }
    const { error: err } = await supabase.from('checklist_itens').update(payload).eq('id', id);
    if (err) throw err;
    await carregarTodos();
    const item = itens.find(i => i.id === id);
    if (item) notificarSeAdmissao(item.movement_type);
  };

  // Notifica o App.tsx (que "hidrata" o checklist de Admissão em memória a partir
  // desta tabela) para recarregar, caso o item alterado seja da Admissão —
  // assim uma mudança feita em Fluxos aparece na hora, sem precisar relogar.
  const notificarSeAdmissao = (movementType: string) => {
    if (movementType === 'admissao') {
      window.dispatchEvent(new CustomEvent('checklist-admissao-atualizado'));
    }
  };

  // Nunca exclui de verdade — apenas alterna ativo/inativo.
  const alternarAtivo = async (id: string, ativo: boolean, userEmail?: string) => {
    const { error: err } = await supabase
      .from('checklist_itens')
      .update({ ativo, updated_by: userEmail || null })
      .eq('id', id);
    if (err) throw err;
    await carregarTodos();
    const item = itens.find(i => i.id === id);
    if (item) notificarSeAdmissao(item.movement_type);
  };

  const reordenar = async (id: string, novaOrdem: number) => {
    const { error: err } = await supabase
      .from('checklist_itens')
      .update({ ordem: novaOrdem })
      .eq('id', id);
    if (err) throw err;
    await carregarTodos();
  };

  // Copia todos os itens (ativos) de um tipo de movimentação para outro,
  // gerando novos ids (não reaproveita id entre tipos diferentes).
  const copiarConfiguracao = async (
    tipoOrigem: string,
    tipoDestino: string,
    userEmail?: string
  ) => {
    const origem = itens.filter(i => i.movement_type === tipoOrigem);
    if (origem.length === 0) return;

    const novosItens = origem.map(i => ({
      id: gerarIdItem(tipoDestino, i.team_id, i.label),
      movement_type: tipoDestino,
      team_id: i.team_id,
      label: i.label,
      ativo: i.ativo,
      obrigatorio: i.obrigatorio,
      tipo_campo: i.tipo_campo,
      alternativas: i.alternativas,
      exige_observacao_se_pendente: i.exige_observacao_se_pendente,
      ordem: i.ordem,
      created_by: userEmail || null,
      updated_by: userEmail || null,
    }));

    const { error: err } = await supabase.from('checklist_itens').insert(novosItens);
    if (err) throw err;
    await carregarTodos();
    notificarSeAdmissao(tipoDestino);
  };

  return {
    itens,
    loading,
    error,
    getItensAtivos,
    getItensPorEquipe,
    criarItem,
    editarItem,
    alternarAtivo,
    reordenar,
    copiarConfiguracao,
    recarregar: carregarTodos,
  };
}
