import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { sendMovementCreatedEmail } from '../lib/emailService';
import {
  AcompanhamentoAdmissao,
  ItemChecklistAdmissao,
  AuditoriaItemAdmissao,
  CampoAdmissao,
  CATEGORIA_CAMPO,
  LABEL_CAMPO_ADMISSAO,
  StatusAdmissao,
  buildChecklistInicialAdmissao,
  checklistCompletoAdmissao,
  CHECKLIST_REGRAS_ADMISSAO,
} from '../types/admissao';

// Mesmo mapa id -> nome usado em App.tsx (TEAMS), necessário aqui porque
// o checklist de Admissão guarda o NOME da equipe, mas a tabela `users`
// guarda o ID. Usado só para descobrir quem notificar por email.
const TEAM_NAME_TO_ID: Record<string, string> = {
  'Recursos Humanos': 'rh',
  'Ponto': 'ponto',
  'Transporte': 'transporte',
  'T.I': 'ti',
  'Benefícios': 'beneficios',
  'Comunicação': 'comunicacao',
  'Segurança do Trabalho': 'seguranca',
  'Ambulatório': 'ambulatorio',
  'Financeiro': 'financeiro',
  'DP': 'dp',
  'Treinamento e Desenvolvimento': 'treinamento',
};

function normalizarAdmissao(d: any): AcompanhamentoAdmissao {
  return {
    ...d,
    status: (d.status || 'pendente').toLowerCase(),
    dados: d.dados || {},
    checklist: Array.isArray(d.checklist) ? d.checklist : [],
    observacoes_equipe: d.observacoes_equipe || {},
    historico_auditoria: Array.isArray(d.historico_auditoria) ? d.historico_auditoria : [],
  };
}

function calcularStatus(checklist: ItemChecklistAdmissao[], observacoesEquipe: Record<string, string>): StatusAdmissao {
  if (checklistCompletoAdmissao(checklist, observacoesEquipe)) return 'concluido';
  const algumMarcado =
    checklist.some(i => i.marcado || i.secundario_selecionado || i.valor_texto) ||
    Object.values(observacoesEquipe).some(v => v?.trim());
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
                observacoes_equipe: {},
                status: 'pendente',
                historico_auditoria: [auditoria],
                data_criacao: new Date().toISOString(),
                usuario_criacao: usuario,
                email_usuario_criacao: email,
              },
            ]);

            if (errAdm) throw errAdm;

            // Notifica por email todas as equipes que participam do checklist de Admissão
            try {
              const equipesAdmissaoIds = Array.from(new Set(
                CHECKLIST_REGRAS_ADMISSAO.map(r => TEAM_NAME_TO_ID[r.equipe]).filter((id): id is string => !!id)
              ));

              if (equipesAdmissaoIds.length > 0) {
                const { data: usersData } = await supabase
                  .from('users')
                  .select('email, name, team_ids, team_names')
                  .overlaps('team_ids', equipesAdmissaoIds);

                if (usersData && usersData.length > 0) {
                  const dadosContratacao = (Object.keys(CATEGORIA_CAMPO) as CampoAdmissao[])
                    .filter(campo => CATEGORIA_CAMPO[campo] === 'Dados da Contratação')
                    .map(campo => ({ label: LABEL_CAMPO_ADMISSAO[campo], valor: registro.dados[campo] || '—' }));

                  const expandedRecipients = usersData.flatMap((user: any) =>
                    user.team_ids
                      .map((teamId: string, index: number) =>
                        equipesAdmissaoIds.includes(teamId)
                          ? { email: user.email, name: user.name, team_name: user.team_names[index] }
                          : null
                      )
                      .filter((item: any) => item !== null)
                  );

                  sendMovementCreatedEmail(expandedRecipients, {
                    employee_name: registro.nomeMovimento,
                    type: 'admissao',
                    created_by: usuario,
                    dadosContratacao,
                  }).catch(e => console.error('Erro ao enviar email de admissão:', e));
                }
              }
            } catch (emailErr) {
              console.error('Erro ao notificar equipes da admissão:', emailErr);
            }

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
  // SALVAR CHECKLIST DE UMA EQUIPE INTEIRO (em lote, com botão "Salvar")
  // Substitui os itens da equipe de uma vez só (não salva a cada clique).
  // =============================
  const atualizarChecklistEquipe = useCallback(
    async (
      id: string,
      equipe: string,
      itensEquipe: ItemChecklistAdmissao[],
      observacaoEquipe: string,
      user: string,
      email: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const admissao = await loadAdmissaoById(id);
        if (!admissao) throw new Error('Registro de admissão não encontrado');

        const regraIdsEquipe = CHECKLIST_REGRAS_ADMISSAO.filter(r => r.equipe === equipe).map(r => r.id);
        const agora = new Date().toISOString();

        const checklist = [
          ...admissao.checklist.filter(i => !regraIdsEquipe.includes(i.regra_id)),
          ...itensEquipe.map(i => ({
            ...i,
            data_marcacao: agora,
            usuario_marcacao: user,
            email_usuario_marcacao: email,
          })),
        ];

        const observacoesEquipe = { ...admissao.observacoes_equipe, [equipe]: observacaoEquipe };
        const status = calcularStatus(checklist, observacoesEquipe);

        const historico = [
          ...(admissao.historico_auditoria || []),
          {
            usuario: user,
            email_usuario: email,
            acao: 'marcacao_checklist' as AuditoriaItemAdmissao['acao'],
            campo_ou_item: `Checklist ${equipe}`,
            data_hora: agora,
            detalhes: 'Salvo em lote',
          },
        ];

        const { error } = await supabase
          .from('acompanhamento_admissao')
          .update({ checklist, observacoes_equipe: observacoesEquipe, status, historico_auditoria: historico })
          .eq('id', id);

        if (error) throw error;

        setAdmissoes(prev =>
          prev.map(a => (a.id === id ? { ...a, checklist, observacoes_equipe: observacoesEquipe, status, historico_auditoria: historico } : a))
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

  // =============================
  // ATUALIZAR ITEM DE CHECKLIST (checkbox principal / secundário / texto / observação do item)
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

        const status = calcularStatus(checklist, admissao.observacoes_equipe);

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

  // =============================
  // ATUALIZAR OBSERVAÇÃO OBRIGATÓRIA DE UMA EQUIPE
  // =============================
  const atualizarObservacaoEquipe = useCallback(
    async (id: string, equipe: string, texto: string, user: string, email: string) => {
      setLoading(true);
      setError(null);
      try {
        const admissao = await loadAdmissaoById(id);
        if (!admissao) throw new Error('Registro de admissão não encontrado');

        const observacoesEquipe = { ...admissao.observacoes_equipe, [equipe]: texto };
        const status = calcularStatus(admissao.checklist, observacoesEquipe);

        const historico = [
          ...(admissao.historico_auditoria || []),
          {
            usuario: user,
            email_usuario: email,
            acao: 'edicao_observacao' as AuditoriaItemAdmissao['acao'],
            campo_ou_item: `Observação - ${equipe}`,
            data_hora: new Date().toISOString(),
          },
        ];

        const { error } = await supabase
          .from('acompanhamento_admissao')
          .update({ observacoes_equipe: observacoesEquipe, status, historico_auditoria: historico })
          .eq('id', id);

        if (error) throw error;

        setAdmissoes(prev =>
          prev.map(a => (a.id === id ? { ...a, observacoes_equipe: observacoesEquipe, status, historico_auditoria: historico } : a))
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

  // =============================
  // ATUALIZAR UM CAMPO DOS DADOS DA ADMISSÃO (ex: Data de Início, campos de Remuneração)
  // Para campos de Remuneração, o "motivo" é obrigatório e fica registrado na auditoria.
  // =============================
  const atualizarCampoDados = useCallback(
    async (id: string, campo: CampoAdmissao, valor: string, user: string, email: string, motivo?: string) => {
      setLoading(true);
      setError(null);
      try {
        const admissao = await loadAdmissaoById(id);
        if (!admissao) throw new Error('Registro de admissão não encontrado');

        const valorAnterior = admissao.dados[campo] || '(vazio)';
        const dados = { ...admissao.dados, [campo]: valor };

        const detalhes = motivo
          ? `De "${valorAnterior}" para "${valor}". Motivo: ${motivo}`
          : `De "${valorAnterior}" para "${valor}"`;

        const historico = [
          ...(admissao.historico_auditoria || []),
          {
            usuario: user,
            email_usuario: email,
            acao: 'edicao_campo' as AuditoriaItemAdmissao['acao'],
            campo_ou_item: LABEL_CAMPO_ADMISSAO[campo],
            data_hora: new Date().toISOString(),
            detalhes,
          },
        ];

        const { error } = await supabase
          .from('acompanhamento_admissao')
          .update({ dados, historico_auditoria: historico })
          .eq('id', id);

        if (error) throw error;

        setAdmissoes(prev => prev.map(a => (a.id === id ? { ...a, dados, historico_auditoria: historico } : a)));
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
    atualizarChecklistEquipe,
    atualizarItemChecklist,
    atualizarObservacaoEquipe,
    atualizarCampoDados,
  };
}
