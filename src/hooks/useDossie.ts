import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  AcompanhamentoDossie,
  ItemChecklist,
  TipoDesligamento,
  TipoDocumento,
  StatusDossie,
  getDocumentosObrigatorios,
  todosMarcados,
  AuditoriaItem,
} from '../types/dossie';

function normalizarDossie(d: any): AcompanhamentoDossie {
  return {
    ...d,
    status: (d.status || '').toLowerCase(),
    tipo_desligamento: (d.tipo_desligamento || '').toLowerCase(),
    checklist: Array.isArray(d.checklist) ? d.checklist : [],
    historico_auditoria: Array.isArray(d.historico_auditoria)
      ? d.historico_auditoria
      : [],
  };
}

export function useDossie() {
  const [dossies, setDossies] = useState<AcompanhamentoDossie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDossies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('acompanhamento_dossie')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (err) throw err;

      const normalizados = (data || []).map(normalizarDossie);
      setDossies(normalizados);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dossiês');
      console.error('Erro ao carregar dossiês:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDossieById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('acompanhamento_dossie')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (err) throw err;
      return data ? normalizarDossie(data) : null;
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dossiê');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDossieByMovimentoId = useCallback(async (movimentoId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('acompanhamento_dossie')
        .select('*')
        .eq('movimento_id', movimentoId)
        .maybeSingle();

      if (err) throw err;
      return data ? normalizarDossie(data) : null;
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dossiê');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const criarDossieAutomatico = useCallback(
    async (
      movimentoId: string,
      tipoDesligamento: TipoDesligamento,
      employeeName: string,
      usuarioCriacao: string,
      emailUsuarioCriacao: string,
      cpf?: string,
      chapa?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const documentos = getDocumentosObrigatorios(tipoDesligamento);

        const checklist: ItemChecklist[] = documentos.map(doc => ({
          documento: doc,
          marcado: false,
        }));

        const auditoria: AuditoriaItem = {
          usuario: usuarioCriacao,
          email_usuario: emailUsuarioCriacao,
          acao: 'criacao',
          data_hora: new Date().toISOString(),
        };

        const { data, error: err } = await supabase
          .from('acompanhamento_dossie')
          .insert([
            {
              movimento_id: movimentoId,
              tipo_desligamento: tipoDesligamento,
              employee_name: employeeName,
              cpf: cpf || null,
              chapa: chapa || null,
              status: StatusDossie.PENDENTE,
              checklist,
              historico_auditoria: [auditoria],
              data_criacao: new Date().toISOString(),
              usuario_criacao: usuarioCriacao,
              email_usuario_criacao: emailUsuarioCriacao,
            },
          ])
          .select()
          .single();

        if (err) throw err;

        await loadDossies();
        return data ? normalizarDossie(data) : null;
      } catch (err: any) {
        setError(err.message || 'Erro ao criar dossiê');
        console.error(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [loadDossies]
  );

  const toggleDocumento = useCallback(
    async (id: string, documento: TipoDocumento, user: string, email: string) => {
      setLoading(true);
      setError(null);
      try {
        const dossie = await loadDossieById(id);
        if (!dossie) throw new Error('Dossiê não encontrado');

        const checklist = [...dossie.checklist];
        const index = checklist.findIndex(i => i.documento === documento);
        if (index === -1) throw new Error('Documento não encontrado');

        checklist[index].marcado = !checklist[index].marcado;

        const historico = [
          ...(dossie.historico_auditoria || []),
          {
            usuario: user,
            email_usuario: email,
            acao: checklist[index].marcado ? 'marcacao' : 'desmarcacao',
            documento,
            data_hora: new Date().toISOString(),
          },
        ];

        let status = StatusDossie.PENDENTE;
        if (todosMarcados(checklist)) status = StatusDossie.CONCLUIDO;
        else if (checklist.some(i => i.marcado)) status = StatusDossie.EM_ANDAMENTO;

        const { error: err } = await supabase
          .from('acompanhamento_dossie')
          .update({
            checklist,
            status,
            historico_auditoria: historico,
          })
          .eq('id', id);

        if (err) throw err;

        await loadDossies();
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [loadDossieById, loadDossies]
  );

  return {
    dossies,
    loading,
    error,
    loadDossies,
    loadDossieById,
    loadDossieByMovimentoId,
    criarDossieAutomatico,
    toggleDocumento,
  };
}
