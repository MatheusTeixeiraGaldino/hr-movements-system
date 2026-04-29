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

  // =============================
  // LOAD TODOS
  // =============================
  const loadDossies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('acompanhamento_dossie')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (error) throw error;

      const normalizados = (data || []).map(normalizarDossie);
      setDossies(normalizados);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================
  // LOAD POR ID
  // =============================
  const loadDossieById = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('acompanhamento_dossie')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      return data ? normalizarDossie(data) : null;
    } catch (err: any) {
      console.error(err);
      return null;
    }
  }, []);

  // =============================
  // LOAD POR MOVIMENTO
  // =============================
  const loadDossieByMovimentoId = useCallback(async (movimentoId: string) => {
    try {
      const { data, error } = await supabase
        .from('acompanhamento_dossie')
        .select('*')
        .eq('movimento_id', movimentoId)
        .maybeSingle();

      if (error) throw error;

      return data ? normalizarDossie(data) : null;
    } catch (err: any) {
      console.error(err);
      return null;
    }
  }, []);

  // =============================
  // CRIAR AUTOMATICO
  // =============================
  const criarDossieAutomatico = useCallback(
    async (
      movimentoId: string,
      tipoDesligamento: TipoDesligamento,
      employeeName: string,
      usuario: string,
      email: string,
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
          usuario,
          email_usuario: email,
          acao: 'criacao',
          data_hora: new Date().toISOString(),
        };

        const { data, error } = await supabase
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
              usuario_criacao: usuario,
              email_usuario_criacao: email,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        await loadDossies();
        return data ? normalizarDossie(data) : null;
      } catch (err: any) {
        setError(err.message);
        console.error(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [loadDossies]
  );

  // =============================
  // TOGGLE DOCUMENTO
  // =============================
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
        checklist[index].data_marcacao = new Date().toISOString();
        checklist[index].usuario_marcacao = user;
        checklist[index].email_usuario_marcacao = email;

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
        else if (checklist.some(i => i.marcado))
          status = StatusDossie.EM_ANDAMENTO;

        const { error } = await supabase
          .from('acompanhamento_dossie')
          .update({
            checklist,
            status,
            historico_auditoria: historico,
          })
          .eq('id', id);

        if (error) throw error;

        setDossies(prev => 
          prev.map(d => d.id === id ? { ...d, checklist, status, historico_auditoria: historico } : d)
        );
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [loadDossieById]
  );

  // =============================
  // OBSERVAÇÃO
  // =============================
  const atualizarObservacao = useCallback(
    async (id: string, observacao: string, user: string, email: string) => {
      setLoading(true);
      setError(null);

      try {
        const dossie = await loadDossieById(id);
        if (!dossie) throw new Error('Dossiê não encontrado');

        const historico = [
          ...(dossie.historico_auditoria || []),
          {
            usuario: user,
            email_usuario: email,
            acao: 'edicao_observacao',
            data_hora: new Date().toISOString(),
            detalhes: observacao,
          },
        ];

        const { error } = await supabase
          .from('acompanhamento_dossie')
          .update({
            observacao,
            historico_auditoria: historico,
          })
          .eq('id', id);

        if (error) throw error;

        setDossies(prev =>
          prev.map(d => d.id === id ? { ...d, observacao, historico_auditoria: historico } : d)
        );
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [loadDossieById]
  );

  // =============================
  // PASTA
  // =============================
  const atualizarPastaDesligado = useCallback(
    async (id: string, pasta: string, user: string, email: string) => {
      setLoading(true);
      setError(null);

      try {
        const dossie = await loadDossieById(id);
        if (!dossie) throw new Error('Dossiê não encontrado');

        const historico = [
          ...(dossie.historico_auditoria || []),
          {
            usuario: user,
            email_usuario: email,
            acao: 'edicao_observacao',
            data_hora: new Date().toISOString(),
            detalhes: pasta,
          },
        ];

        const { error } = await supabase
          .from('acompanhamento_dossie')
          .update({
            pasta_desligado: pasta,
            historico_auditoria: historico,
          })
          .eq('id', id);

        if (error) throw error;

        setDossies(prev =>
          prev.map(d => d.id === id ? { ...d, pasta_desligado: pasta, historico_auditoria: historico } : d)
        );
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [loadDossieById]
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
    atualizarObservacao,
    atualizarPastaDesligado,
  };
}
