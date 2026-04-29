import { useState, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  AlertCircle,
  Loader2,
  User,
} from 'lucide-react';

import { useDossie } from '../hooks/useDossie';
import { supabase } from '../lib/supabase';

import {
  AcompanhamentoDossie,
  TipoDocumento,
  TipoDesligamento,
  LABELS_DOCUMENTO,
  LABELS_DESLIGAMENTO,
  calcularPercentualConclusao,
  verificarExclusividadeASODeclaracao,
  todosDocumentosNecessariosMarados,
  getDocumentosObrigatorios,
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
    atualizarObservacao,
    atualizarPastaDesligado,
  } = useDossie();

  const [selectedDossie, setSelectedDossie] =
    useState<AcompanhamentoDossie | null>(null);

  const [editingObservacao, setEditingObservacao] = useState(false);
  const [novaObservacao, setNovaObservacao] = useState('');

  const [editingPasta, setEditingPasta] = useState(false);
  const [novaPasta, setNovaPasta] = useState('');

  const [editingTipo, setEditingTipo] = useState(false);
  const [novoTipo, setNovoTipo] = useState<TipoDesligamento>(
    TipoDesligamento.OUTROS_MOTIVOS
  );

  const [togglingDoc, setTogglingDoc] = useState<string | null>(null);

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

  const handleSaveObservacao = async () => {
    if (!selectedDossie) return;

    await atualizarObservacao(
      selectedDossie.id,
      novaObservacao,
      currentUser.name,
      currentUser.email
    );

    const updated = await loadDossieById(selectedDossie.id);
    if (updated) {
      setSelectedDossie(updated);
      setEditingObservacao(false);
    }
  };

  const handleSavePasta = async () => {
    if (!selectedDossie) return;

    await atualizarPastaDesligado(
      selectedDossie.id,
      novaPasta,
      currentUser.name,
      currentUser.email
    );

    const updated = await loadDossieById(selectedDossie.id);
    if (updated) {
      setSelectedDossie(updated);
      setEditingPasta(false);
    }
  };

  const handleAlterarTipo = async () => {
    if (!selectedDossie) return;

    const docs = getDocumentosObrigatorios(novoTipo);

    const checklist = docs.map(doc => {
      const existente = selectedDossie.checklist.find(
        c => c.documento === doc
      );
      return existente || { documento: doc, marcado: false };
    });

    const { error } = await supabase
      .from('acompanhamento_dossie')
      .update({
        tipo_desligamento: novoTipo,
        checklist,
      })
      .eq('id', selectedDossie.id);

    if (error) return;

    const updated = await loadDossieById(selectedDossie.id);
    if (updated) {
      setSelectedDossie(updated);
      setEditingTipo(false);
    }
  };

  if (selectedDossie) {
    const percentual = calcularPercentualConclusao(
      selectedDossie.checklist
    );

    const exclusividadeOk =
      verificarExclusividadeASODeclaracao(selectedDossie.checklist);

    const docsOk = todosDocumentosNecessariosMarados(
      selectedDossie.checklist,
      selectedDossie.tipo_desligamento
    );

    return (
      <div className="space-y-6">
        {/* BOTÃO VOLTAR */}
        {onBack && (
          <button
            onClick={() => {
              setSelectedDossie(null);
              onBack();
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Voltar
          </button>
        )}

        <h1 className="text-2xl font-bold">Dossiê</h1>

        {/* Tipo */}
        <div className="bg-white p-4 rounded shadow">
          {editingTipo ? (
            <>
              <select
                value={novoTipo}
                onChange={e =>
                  setNovoTipo(e.target.value as TipoDesligamento)
                }
              >
                {Object.entries(LABELS_DESLIGAMENTO).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>

              <button onClick={handleAlterarTipo}>Salvar</button>
            </>
          ) : (
            <div className="flex justify-between">
              <span>
                {
                  LABELS_DESLIGAMENTO[
                    selectedDossie.tipo_desligamento
                  ]
                }
              </span>
              {canEdit && (
                <button onClick={() => setEditingTipo(true)}>
                  Alterar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Progresso */}
        <div className="bg-white p-4 rounded shadow">
          <div className="w-full bg-gray-200 h-2 rounded">
            <div
              className="bg-blue-600 h-2 rounded"
              style={{ width: `${percentual}%` }}
            />
          </div>
          <p className="text-sm mt-2">{percentual}% concluído</p>
        </div>

        {/* Alertas */}
        {!exclusividadeOk && (
          <div className="bg-red-100 p-3 rounded flex gap-2">
            <AlertCircle />
            ASO e Declaração não podem coexistir
          </div>
        )}

        {!docsOk && (
          <div className="bg-yellow-100 p-3 rounded">
            Documentos pendentes
          </div>
        )}

        {/* Checklist */}
        <div className="bg-white p-4 rounded shadow">
          {selectedDossie.checklist.map(item => (
            <div key={item.documento} className="flex gap-2">
              <button
                disabled={!canEdit}
                onClick={() =>
                  handleToggleDocumento(item.documento)
                }
              >
                {togglingDoc === item.documento ? (
                  <Loader2 className="animate-spin" />
                ) : item.marcado ? (
                  <CheckSquare />
                ) : (
                  <Square />
                )}
              </button>

              {LABELS_DOCUMENTO[item.documento]}
            </div>
          ))}
        </div>

        {/* Observação */}
        <div className="bg-white p-4 rounded shadow">
          <h3>Observação</h3>

          {editingObservacao ? (
            <>
              <textarea
                value={novaObservacao}
                onChange={e =>
                  setNovaObservacao(e.target.value)
                }
              />
              <button onClick={handleSaveObservacao}>
                Salvar
              </button>
            </>
          ) : (
            <p>{selectedDossie.observacao || '-'}</p>
          )}
        </div>

        {/* Pasta */}
        <div className="bg-white p-4 rounded shadow">
          <h3>Pasta</h3>

          {editingPasta ? (
            <>
              <input
                value={novaPasta}
                onChange={e => setNovaPasta(e.target.value)}
              />
              <button onClick={handleSavePasta}>
                Salvar
              </button>
            </>
          ) : selectedDossie.pasta_desligado ? (
            <a
              href={selectedDossie.pasta_desligado}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {selectedDossie.pasta_desligado}
            </a>
          ) : (
            <p>-</p>
          )}
        </div>

        {/* Histórico */}
        <div className="bg-white p-4 rounded shadow">
          <h3>Histórico</h3>

          {selectedDossie.historico_auditoria?.map((h, i) => (
            <div key={i} className="text-sm border-b py-1">
              <User className="inline w-3 h-3 mr-1" />
              {h.usuario} - {h.acao}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Dossiês</h1>

      {loading && <Loader2 className="animate-spin" />}

      {error && <p>{error}</p>}

      {dossies.map(d => (
        <button key={d.id} onClick={() => setSelectedDossie(d)}>
          {d.employee_name}
        </button>
      ))}
    </div>
  );
}
