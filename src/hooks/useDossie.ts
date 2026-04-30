// ADICIONE ESTA FUNÇÃO ao arquivo src/hooks/useDossie.ts
// Coloque DEPOIS da função atualizarPastaDesligado

  // =============================
  // ATUALIZAR TIPO DE DESLIGAMENTO
  // =============================
  const atualizarTipoDesligamento = useCallback(
    async (
      id: string,
      novoTipo: TipoDesligamento,
      user: string,
      email: string
    ) => {
      setLoading(true);
      setError(null);

      try {
        const dossie = await loadDossieById(id);
        if (!dossie) throw new Error('Dossiê não encontrado');

        // Obter novos documentos obrigatórios para o novo tipo
        const novosDocs = getDocumentosObrigatorios(novoTipo);

        // Manter documentos já marcados, adicionar novos, remover antigos
        const novoChecklist = novosDocs.map(doc => {
          const existente = dossie.checklist.find(
            c => c.documento === doc
          );
          return existente || { documento: doc, marcado: false };
        });

        // Registrar na auditoria
        const historico = [
          ...(dossie.historico_auditoria || []),
          {
            usuario: user,
            email_usuario: email,
            acao: 'alteracao_tipo',
            data_hora: new Date().toISOString(),
            detalhes: `Tipo alterado de ${dossie.tipo_desligamento} para ${novoTipo}`,
          },
        ];

        // Salvar no banco
        const { error } = await supabase
          .from('acompanhamento_dossie')
          .update({
            tipo_desligamento: novoTipo,
            checklist: novoChecklist,
            historico_auditoria: historico,
          })
          .eq('id', id);

        if (error) throw error;

        // Atualizar estado local
        setDossies(prev =>
          prev.map(d =>
            d.id === id
              ? {
                  ...d,
                  tipo_desligamento: novoTipo,
                  checklist: novoChecklist,
                  historico_auditoria: historico,
                }
              : d
          ) as AcompanhamentoDossie[]
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
    [loadDossieById]
  );

// ATUALIZE O RETURN FINAL DO HOOK PARA INCLUIR A NOVA FUNÇÃO:
/*
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
    atualizarDataDemissao,
    atualizarTipoDesligamento, // ← ADICIONE ESTA LINHA
  };
*/
