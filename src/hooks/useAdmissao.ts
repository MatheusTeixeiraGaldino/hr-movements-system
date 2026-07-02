import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  AcompanhamentoAdmissao,
  ItemChecklistAdmissao,
  AuditoriaItemAdmissao,
  CampoAdmissao,
  StatusAdmissao,
  buildChecklistInicialAdmissao,
  checklistCompletoAdmissao,
  CHECKLIST_REGRAS_ADMISSAO,
} from '../types/admissao';

function normalizarAdmissao(d: any): AcompanhamentoAdmissao {
  return {
    ...d,
    status: (d.status || 'pendente').toLowerCase(),
    dados: d.dados || {},
    checklist: Array.isArray(d.checklist) ? d.checklist : [],
    historico_auditoria: Array.isArray(d.historico_auditoria) ? d.historico_auditoria : [],
  };
}

function calcularStatus(checklist: ItemChecklistAdmissao[]): StatusAdmissao {
  if (checklistCompletoAdmissao(checklist)) return 'concluido';
  const algumMarcado = checklist.some(i => i.marcado || i.secundario_selecionado || i.valor_texto);
  return algumMarcado ? 'em_andamento' : 'pendente';
}

export function useAdmissao() {
  const [admissoes, setAdmissoes] = useState<AcompanhamentoAdmissao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =============================
  // LOAD TODOS
  // =============================
  const loadAdmissoes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('acompanhamento_admissao')
        .select('*')
        .order('data_criacao', { ascending: false });
      if (error) throw error;
      setAdmissoes((data || []).map(normalizarAdmissao));
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================
  // LOAD POR ID / POR MOVIMENTO
  // =============================
  const loadAdmissaoById = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('acompanhamento_admissao')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizarAdmissao(data) : null;
    } catch (err: any) {
      console.error(err);
      return null;
    }
  }, []);

  const loadAdmissaoByMovimentoId = useCallback(async (movimentoId: string) => {
    try {
      const { data, error } = await supabase
        .from('acompanhamento_admissao')
        .select('*')
        .eq('movimento_id', movimentoId)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizarAdmissao(data) : null;
    } catch (err: any) {
      console.error(err);
      return null;
    }
  }, []);

  // =============================
  // CRIAR EM LOTE (importação com várias pessoas por arquivo)
  // Cria 1 movimentação (type: 'admissao') + 1 acompanhamento_admissao por pessoa.
  // =============================
  const criarAdmissoesEmLote = useCallback(
    async (
      registros: Array<{ dados: Partial<Record<CampoAdmissao, string>>; nomeMovimento: string }>,
      usuario: string,
      email: string
    ) => {
      setLoading(true);
      setError(null);
      const sucesso: string[] = [];
      const falhas: Array<{ nome: string; motivo: string }> = [];

      try {
        for (const registro of registros) {
          try {
            const { data: movimento, error: errMov } = await supabase
              .from('movements')
              .insert([
                {
                  type: 'admissao',
                  employee_name: registro.nomeMovimento,
                  status: 'pending',
                  responses: {},
                  selected_teams: [],
                  created_by: usuario,
                  details: {},
                  cancelamento: null,
                },
              ])
              .select()
              .single();

            if (errMov || !movimento) throw errMov || new Error('Falha ao criar movimentação');

            const checklist = buildChecklistInicialAdmissao();
            const auditoria: AuditoriaItemAdmissao = {
              usuario,
              email_usuario: email,
              acao: 'importacao',
              data_hora: new Date().toISOString(),
              detalhes: 'Registro criado via importação de arquivo (.txt/.csv)',
            };

            const { error: errAdm } = await supabase.from('acompanhamento_admissao').insert([
              {
                movimento_id: movimento.id,
                dados: registro.dados,
                checklist,
                status: 'pendente',
                historico_auditoria: [auditoria],
                data_criacao: new Date().toISOString(),
                usuario_criacao: usuario,
                email_usuario_criacao: email,
              },
            ]);

            if (errAdm) throw errAdm;
            sucesso.push(registro.nomeMovimento);
          } catch (err: any) {
            falhas.push({ nome: registro.nomeMovimento, motivo: err.message || 'Erro desconhecido' });
          }
        }

        await loadAdmissoes();
        return { sucesso, falhas };
      } finally {
        setLoading(false);
      }
    },
    [loadAdmissoes]
  );

  // =============================
  // ATUALIZAR ITEM DE CHECKLIST (checkbox principal / secundário / texto / observação)
  // =============================
  const atualizarItemChecklist = useCallback(
    async (
      id: string,
      regraId: string,
      alteracoes: Partial<Pick<ItemChecklistAdmissao, 'marcado' | 'secundario_selecionado' | 'valor_texto' | 'observacao'>>,
      user: string,
      email: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const admissao = await loadAdmissaoById(id);
        if (!admissao) throw new Error('Registro de admissão não encontrado');

        const regra = CHECKLIST_REGRAS_ADMISSAO.find(r => r.id === regraId);
        if (!regra) throw new Error('Regra de checklist não encontrada');

        const checklist = [...admissao.checklist];
        let index = checklist.findIndex(i => i.regra_id === regraId);
        if (index === -1) {
          checklist.push({ regra_id: regraId, marcado: false });
          index = checklist.length - 1;
        }

        checklist[index] = {
          ...checklist[index],
          ...alteracoes,
          data_marcacao: new Date().toISOString(),
          usuario_marcacao: user,
          email_usuario_marcacao: email,
        };

        const status = calcularStatus(checklist);

        const historico = [
          ...(admissao.historico_auditoria || []),
          {
            usuario: user,
            email_usuario: email,
            acao: (alteracoes.marcado ? 'marcacao_checklist' : 'desmarcacao_checklist') as AuditoriaItemAdmissao['acao'],
            campo_ou_item: regra.campo_principal,
            data_hora: new Date().toISOString(),
          },
        ];

        const { error } = await supabase
          .from('acompanhamento_admissao')
          .update({ checklist, status, historico_auditoria: historico })
          .eq('id', id);

        if (error) throw error;

        setAdmissoes(prev =>
          prev.map(a => (a.id === id ? { ...a, checklist, status, historico_auditoria: historico } : a))
        );
        return true;
      } catch (err: any) {
        setError(err.message);
        console.error(err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadAdmissaoById]
  );

  return {
    admissoes,
    loading,
    error,
    loadAdmissoes,
    loadAdmissaoById,
    loadAdmissaoByMovimentoId,
    criarAdmissoesEmLote,
    atualizarItemChecklist,
  };
}
