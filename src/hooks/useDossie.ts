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

export function useDossie() {
  const [dossies, setDossies] = useState<AcompanhamentoDossie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega todos os dossiês do Supabase
   */
  const loadDossies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Iniciando carregamento de dossiês...');
      
      const { data, error: err } = await supabase
        .from('acompanhamento_dossie')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (err) {
        console.error('Erro do Supabase:', err);
        throw err;
      }
      
      console.log('Dossiês carregados do Supabase:', data);
      setDossies(data || []);
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao carregar dossiês';
      setError(errorMsg);
      console.error('Erro ao carregar dossiês:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carrega um dossiê específico pelo ID
   */
  const loadDossieById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('acompanhamento_dossie')
        .select('*')
        .eq('id', id)
        .single();

      if (err) throw err;
      return data as AcompanhamentoDossie;
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao carregar dossiê';
      setError(errorMsg);
      console.error('Erro ao carregar dossiê:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carrega dossiês por movimento_id
   */
  const loadDossieByMovimentoId = useCallback(async (movimentoId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('acompanhamento_dossie')
        .select('*')
        .eq('movimento_id', movimentoId)
        .single();

      if (err && err.code !== 'PGRST116') throw err; // PGRST116 = no rows
      return data as AcompanhamentoDossie | null;
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao carregar dossiê';
      setError(errorMsg);
      console.error('Erro ao carregar dossiê:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cria um novo dossiê automaticamente quando uma movimentação de desligamento é criada
   */
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
        console.log('Criando dossiê automático:', { movimentoId, tipoDesligamento, employeeName });
        
        // Obter documentos obrigatórios
        const documentosObrigatorios = getDocumentosObrigatorios(tipoDesligamento);
        console.log('Documentos obrigatórios:', documentosObrigatorios);

        // Criar checklist inicial
        const checklist: ItemChecklist[] = documentosObrigatorios.map(doc => ({
          documento: doc,
          marcado: false,
        }));

        // Criar auditoria inicial
        const auditoriaInicial: AuditoriaItem = {
          usuario: usuarioCriacao,
          email_usuario: emailUsuarioCriacao,
          acao: 'criacao',
          data_hora: new Date().toISOString(),
          detalhes: `Dossiê criado automaticamente para desligamento tipo: ${tipoDesligamento}`,
        };

        // Preparar dados para inserção
        const novoDossie = {
          movimento_id: movimentoId,
          tipo_desligamento: tipoDesligamento,
          employee_name: employeeName,
          cpf: cpf || null,
          chapa: chapa || null,
          status: StatusDossie.PENDENTE,
          checklist: checklist,
          observacao: null,
          pasta_desligado: null,
          data_criacao: new Date().toISOString(),
          usuario_criacao: usuarioCriacao,
          email_usuario_criacao: emailUsuarioCriacao,
          historico_auditoria: [auditoriaInicial],
        };

        console.log('Dados do dossiê a inserir:', novoDossie);

        const { data, error: err } = await supabase
          .from('acompanhamento_dossie')
          .insert([novoDossie])
          .select()
          .single();

        if (err) {
          console.error('Erro ao inserir dossiê:', err);
          throw err;
        }

        console.log('Dossiê criado com sucesso:', data);

        // Recarregar dossiês
        await loadDossies();

        return data as AcompanhamentoDossie;
      } catch (err: any) {
        const errorMsg = err.message || 'Erro ao criar dossiê';
        setError(errorMsg);
        console.error('Erro ao criar dossiê:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [loadDossies]
  );

  /**
   * Marca ou desmarca um documento no checklist
   */
  const toggleDocumento = useCallback(
    async (
      dossieId: string,
      documento: TipoDocumento,
      usuarioAtual: string,
      emailUsuarioAtual: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        // Buscar dossiê atual
        const dossie = await loadDossieById(dossieId);
        if (!dossie) throw new Error('Dossiê não encontrado');

        // Encontrar o item do checklist
        const itemIndex = dossie.checklist.findIndex(item => item.documento === documento);
        if (itemIndex === -1) throw new Error('Documento não encontrado no checklist');

        // Alternar status
        const novoChecklist = [...dossie.checklist];
        novoChecklist[itemIndex].marcado = !novoChecklist[itemIndex].marcado;
        novoChecklist[itemIndex].data_marcacao = new Date().toISOString();
        novoChecklist[itemIndex].usuario_marcacao = usuarioAtual;
        novoChecklist[itemIndex].email_usuario_marcacao = emailUsuarioAtual;

        // Criar entrada de auditoria
        const novaAuditoria: AuditoriaItem = {
          usuario: usuarioAtual,
          email_usuario: emailUsuarioAtual,
          acao: novoChecklist[itemIndex].marcado ? 'marcacao' : 'desmarcacao',
          documento: documento,
          data_hora: new Date().toISOString(),
        };

        const historicoAtualizado = [...(dossie.historico_auditoria || []), novaAuditoria];

        // Determinar novo status
        let novoStatus = dossie.status;
        if (todosMarcados(novoChecklist)) {
          novoStatus = StatusDossie.CONCLUIDO;
        } else if (novoChecklist.some(item => item.marcado)) {
          novoStatus = StatusDossie.EM_ANDAMENTO;
        } else {
          novoStatus = StatusDossie.PENDENTE;
        }

        // Atualizar no Supabase
        const { error: err } = await supabase
          .from('acompanhamento_dossie')
          .update({
            checklist: novoChecklist,
            status: novoStatus,
            historico_auditoria: historicoAtualizado,
            data_conclusao:
              novoStatus === StatusDossie.CONCLUIDO ? new Date().toISOString() : null,
          })
          .eq('id', dossieId);

        if (err) throw err;

        // Recarregar dossiês
        await loadDossies();
      } catch (err: any) {
        const errorMsg = err.message || 'Erro ao atualizar documento';
        setError(errorMsg);
        console.error('Erro ao atualizar documento:', err);
      } finally {
        setLoading(false);
      }
    },
    [loadDossieById, loadDossies]
  );

  /**
   * Atualiza a observação do dossiê
   */
  const atualizarObservacao = useCallback(
    async (dossieId: string, observacao: string, usuarioAtual: string, emailUsuarioAtual: string) => {
      setLoading(true);
      setError(null);
      try {
        const dossie = await loadDossieById(dossieId);
        if (!dossie) throw new Error('Dossiê não encontrado');

        const novaAuditoria: AuditoriaItem = {
          usuario: usuarioAtual,
          email_usuario: emailUsuarioAtual,
          acao: 'edicao_observacao',
          data_hora: new Date().toISOString(),
          detalhes: `Observação atualizada: ${observacao.substring(0, 50)}...`,
        };

        const historicoAtualizado = [...(dossie.historico_auditoria || []), novaAuditoria];

        const { error: err } = await supabase
          .from('acompanhamento_dossie')
          .update({
            observacao,
            historico_auditoria: historicoAtualizado,
          })
          .eq('id', dossieId);

        if (err) throw err;

        await loadDossies();
      } catch (err: any) {
        const errorMsg = err.message || 'Erro ao atualizar observação';
        setError(errorMsg);
        console.error('Erro ao atualizar observação:', err);
      } finally {
        setLoading(false);
      }
    },
    [loadDossieById, loadDossies]
  );

  /**
   * Atualiza o caminho da pasta do desligado
   */
  const atualizarPastaDesligado = useCallback(
    async (dossieId: string, pastaPath: string, usuarioAtual: string, emailUsuarioAtual: string) => {
      setLoading(true);
      setError(null);
      try {
        const dossie = await loadDossieById(dossieId);
        if (!dossie) throw new Error('Dossiê não encontrado');

        const novaAuditoria: AuditoriaItem = {
          usuario: usuarioAtual,
          email_usuario: emailUsuarioAtual,
          acao: 'edicao_observacao',
          data_hora: new Date().toISOString(),
          detalhes: `Pasta do desligado atualizada: ${pastaPath}`,
        };

        const historicoAtualizado = [...(dossie.historico_auditoria || []), novaAuditoria];

        const { error: err } = await supabase
          .from('acompanhamento_dossie')
          .update({
            pasta_desligado: pastaPath,
            historico_auditoria: historicoAtualizado,
          })
          .eq('id', dossieId);

        if (err) throw err;

        await loadDossies();
      } catch (err: any) {
        const errorMsg = err.message || 'Erro ao atualizar pasta';
        setError(errorMsg);
        console.error('Erro ao atualizar pasta:', err);
      } finally {
        setLoading(false);
      }
    },
    [loadDossieById, loadDossies]
  );

  /**
   * Verifica se o usuário tem permissão para acessar o módulo de dossiê
   */
  const verificarPermissaoDossie = useCallback(async (usuarioId: string): Promise<boolean> => {
    try {
      const { data, error: err } = await supabase
        .from('configuracao_dossie')
        .select('*')
        .eq('ativo', true)
        .single();

      if (err || !data) return false;

      const config = data as any;
      return (
        config.usuarios_autorizados?.includes(usuarioId) ||
        config.perfis_autorizados?.includes('admin') ||
        config.perfis_autorizados?.includes('responsavel')
      );
    } catch (err: any) {
      console.error('Erro ao verificar permissão:', err);
      return false;
    }
  }, []);

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
    verificarPermissaoDossie,
  };
}
