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
} = useDossie();

  const [selectedDossie, setSelectedDossie] =
    useState<AcompanhamentoDossie | null>(null);

  const [filterStatus, setFilterStatus] = useState<
    'all' | 'pendente' | 'em_andamento' | 'concluido'
  >('all');

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

  // =========================
  // VIEW DETALHE
  // =========================
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

  // =========================
  // LISTA COM FILTROS
  // =========================
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Acompanhamento Dossiê</h1>
        <p className="text-gray-600">
          Gerencie os checklists de documentos
        </p>
      </div>

      {/* FILTROS */}
      <div className="flex gap-2">
        {(['all', 'pendente', 'em_andamento', 'concluido'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200'
            }`}
          >
            {status === 'all'
              ? 'Todos'
              : status === 'pendente'
              ? 'Pendente'
              : status === 'em_andamento'
              ? 'Em Andamento'
              : 'Concluído'}
          </button>
        ))}
      </div>

      {loading && <Loader2 className="animate-spin" />}

      {error && <p>{error}</p>}

      <div className="grid gap-4">
        {dossies
          .filter(d => filterStatus === 'all' || d.status === filterStatus)
          .map(d => {
            const percentual = calcularPercentualConclusao(d.checklist);

            return (
              <button
                key={d.id}
                onClick={() => setSelectedDossie(d)}
                className="bg-white p-4 rounded shadow text-left"
              >
                <h3 className="font-semibold">{d.employee_name}</h3>
                <p className="text-sm text-gray-600">
                  {LABELS_DESLIGAMENTO[d.tipo_desligamento]}
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
