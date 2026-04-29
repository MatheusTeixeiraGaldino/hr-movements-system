import { useState, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { useDossie } from '../hooks/useDossie';

import {
  AcompanhamentoDossie,
  TipoDocumento,
  TipoDesligamento,
  LABELS_DOCUMENTO,
  LABELS_DESLIGAMENTO,
  calcularPercentualConclusao,
  verificarExclusividadeASODeclaracao,
} from '../types/dossie';

interface DossieViewProps {
  currentUser: any;
  selectedDossieId?: string;
  onBack?: () => void;
}

export default function DossieView({
  currentUser,
  selectedDossieId,
  onBack,
}: DossieViewProps) {
  const {
    dossies,
    loading,
    error,
    loadDossies,
    loadDossieById,
    toggleDocumento,
  } = useDossie();

  const [selectedDossie, setSelectedDossie] =
    useState<AcompanhamentoDossie | null>(null);

  const [showHistorico, setShowHistorico] = useState(false);
  const [togglingDoc, setTogglingDoc] = useState<string | null>(null);
  const [novoTipo, setNovoTipo] = useState<TipoDesligamento>(
    TipoDesligamento.OUTROS_MOTIVOS
  );
  const [editingTipo, setEditingTipo] = useState(false);

  useEffect(() => {
    loadDossies();
  }, [loadDossies]);

  useEffect(() => {
    if (selectedDossieId) {
      const d = dossies.find(d => d.id === selectedDossieId);
      if (d) setSelectedDossie(d);
    }
  }, [selectedDossieId, dossies]);

  const canEdit =
    currentUser.role === 'admin' || currentUser.role === 'responsavel';

  // =========================
  // REGRAS DE DOCUMENTOS
  // =========================
  const getDocsByTipo = (tipo: TipoDesligamento): TipoDocumento[] => {
    const base = [
      TipoDocumento.MOVIMENTACAO_TRABALHISTA,
      TipoDocumento.TRCT,
      TipoDocumento.EMAIL_SETOR,
    ];

    const mapa: Record<string, TipoDocumento[]> = {
      PEDIDO_DEMISSAO: [TipoDocumento.AVISO_PREVIO],
      TERMINO_CONTRATO: [],
      DISPENSA_SEM_JUSTA_CAUSA: [
        TipoDocumento.AVISO_PREVIO,
        TipoDocumento.SEGURO_DESEMPREGO,
        TipoDocumento.EXTRATO_FGTS,
      ],
      DISPENSA_COM_JUSTA_CAUSA: [TipoDocumento.AVISO_PREVIO],
      ABANDONO: [TipoDocumento.CARTA_ABANDONO],
      COMUM_ACORDO: [
        TipoDocumento.AVISO_PREVIO,
        TipoDocumento.EXTRATO_FGTS,
      ],
      OBITO: [TipoDocumento.EXTRATO_FGTS],
      OUTROS_MOTIVOS: [
        TipoDocumento.EXTRATO_FGTS,
        TipoDocumento.DESCRICAO_MOTIVO,
      ],
    };

    const obrigatorios = [
      TipoDocumento.ASO,
      TipoDocumento.DECLARACAO_NAO_REALIZACAO_EXAMES,
      TipoDocumento.FICHA_EPI,
      TipoDocumento.FICHA_MEDICA,
    ];

    return [...base, ...(mapa[tipo] || []), ...obrigatorios];
  };

  const handleAlterarTipoLocal = () => {
    if (!selectedDossie) return;

    const novosDocs = getDocsByTipo(novoTipo);

    const novoChecklist = novosDocs.map(doc => {
      const existente = selectedDossie.checklist.find(
        c => c.documento === doc
      );
      return existente || { documento: doc, marcado: false };
    });

    setSelectedDossie({
      ...selectedDossie,
      tipo_desligamento: novoTipo,
      checklist: novoChecklist,
    });

    setEditingTipo(false);
  };

  const handleToggleDocumento = async (doc: TipoDocumento) => {
    if (!selectedDossie) return;

    setTogglingDoc(doc);

    await toggleDocumento(
      selectedDossie.id,
      doc,
      currentUser.name,
      currentUser.email
    );

    const updated = await loadDossieById(selectedDossie.id);
    if (updated) setSelectedDossie(updated);

    setTogglingDoc(null);
  };

  // =========================
  // DETALHE
  // =========================
  if (selectedDossie) {
    const exclusividadeOk =
      verificarExclusividadeASODeclaracao(selectedDossie.checklist);

    const docsObrigatorios = getDocsByTipo(
      selectedDossie.tipo_desligamento
    );

    const docsOk = docsObrigatorios.every(doc =>
      selectedDossie.checklist.some(
        c => c.documento === doc && c.marcado
      )
    );

    return (
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              {selectedDossie.employee_name}
            </h1>
            <p className="text-gray-600">
              {
                LABELS_DESLIGAMENTO[
                  selectedDossie.tipo_desligamento
                ]
              }
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedDossie(null);
              onBack && onBack();
            }}
            className="px-3 py-1 bg-gray-100 rounded"
          >
            ← Voltar
          </button>
        </div>

        {/* ALTERAR TIPO */}
        {canEdit && (
          <div className="bg-white p-4 rounded shadow">
            {editingTipo ? (
              <>
                <select
                  value={novoTipo}
                  onChange={e =>
                    setNovoTipo(e.target.value as TipoDesligamento)
                  }
                >
                  {Object.entries(LABELS_DESLIGAMENTO).map(
                    ([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    )
                  )}
                </select>

                <button onClick={handleAlterarTipoLocal}>
                  Confirmar
                </button>
              </>
            ) : (
              <button onClick={() => setEditingTipo(true)}>
                Alterar Tipo
              </button>
            )}
          </div>
        )}

        {/* ALERTAS */}
        {!exclusividadeOk && (
          <div className="bg-red-100 p-3 rounded flex gap-2">
            <AlertCircle />
            ASO e Declaração não podem ser marcados juntos
          </div>
        )}

        {!docsOk && (
          <div className="bg-yellow-100 p-3 rounded">
            Documentos obrigatórios pendentes
          </div>
        )}

        {/* CHECKLIST */}
        <div className="bg-white p-4 rounded shadow space-y-2">
          {selectedDossie.checklist
            .filter(c =>
              docsObrigatorios.includes(c.documento)
            )
            .map(item => {
              const isASO =
                item.documento === TipoDocumento.ASO;

              const outroMarcado = selectedDossie.checklist.some(
                c =>
                  c.marcado &&
                  (isASO
                    ? c.documento ===
                      TipoDocumento.DECLARACAO_NAO_REALIZACAO_EXAMES
                    : c.documento === TipoDocumento.ASO)
              );

              const disable = outroMarcado && !item.marcado;

              return (
                <div
                  key={item.documento}
                  className="flex gap-2 items-center"
                >
                  <button
                    disabled={!canEdit || disable}
                    onClick={() =>
                      handleToggleDocumento(item.documento)
                    }
                  >
                    {togglingDoc === item.documento ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : item.marcado ? (
                      <CheckSquare />
                    ) : (
                      <Square />
                    )}
                  </button>

                  <span>
                    {LABELS_DOCUMENTO[item.documento]}
                  </span>
                </div>
              );
            })}
        </div>

        {/* HISTÓRICO */}
        <div className="bg-white p-4 rounded shadow">
          <button
            onClick={() => setShowHistorico(!showHistorico)}
            className="w-full flex justify-between"
          >
            <span>Histórico</span>
            <span>{showHistorico ? '▲' : '▼'}</span>
          </button>

          {showHistorico && (
            <div className="mt-2 space-y-2">
              {selectedDossie.historico_auditoria?.map(
                (h, i) => (
                  <div key={i} className="text-sm border-b">
                    <p>{h.usuario}</p>
                    <p>{h.acao}</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================
  // LISTA
  // =========================
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        Acompanhamento Dossiê
      </h1>

      {loading && <Loader2 className="animate-spin" />}
      {error && <p>{error}</p>}

      <div className="grid gap-4">
        {dossies.map(d => {
          const percentual = calcularPercentualConclusao(
            d.checklist
          );

          return (
            <button
              key={d.id}
              onClick={() => setSelectedDossie(d)}
              className="bg-white p-4 rounded shadow text-left"
            >
              <h3 className="font-semibold">
                {d.employee_name}
              </h3>

              <p className="text-sm text-gray-600">
                {
                  LABELS_DESLIGAMENTO[
                    d.tipo_desligamento
                  ]
                }
              </p>

              <div className="w-full bg-gray-200 h-2 mt-2">
                <div
                  className="bg-blue-600 h-2"
                  style={{ width: `${percentual}%` }}
                />
              </div>

              <p className="text-xs mt-1">
                {percentual}% concluído
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
