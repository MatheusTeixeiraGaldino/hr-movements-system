import { useState, useEffect } from 'react';
import { CheckSquare, Square, AlertCircle, Loader2, FileText, Folder, MessageSquare, Clock, User } from 'lucide-react';
import { useDossie } from '../hooks/useDossie';
import { supabase } from '../lib/supabase';
import {
  AcompanhamentoDossie,
  TipoDocumento,
  StatusDossie,
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

export default function DossieView({ currentUser, selectedDossieId, onBack }: DossieViewProps) {
  const { dossies, loading, error, loadDossies, loadDossieById, toggleDocumento, atualizarObservacao, atualizarPastaDesligado } = useDossie();

  const [selectedDossie, setSelectedDossie] = useState<AcompanhamentoDossie | null>(null);
  const [editingObservacao, setEditingObservacao] = useState(false);
  const [novaObservacao, setNovaObservacao] = useState('');
  const [editingPasta, setEditingPasta] = useState(false);
  const [novaPasta, setNovaPasta] = useState('');
  const [togglingDoc, setTogglingDoc] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<StatusDossie | 'all'>('all');
  const [editingTipo, setEditingTipo] = useState(false);
  const [novoTipo, setNovoTipo] = useState<TipoDesligamento>(TipoDesligamento.OUTROS_MOTIVOS);

  useEffect(() => {
    loadDossies();
  }, [loadDossies]);

  useEffect(() => {
    if (selectedDossieId) {
      const dossie = dossies.find(d => d.id === selectedDossieId);
      if (dossie) setSelectedDossie(dossie);
    }
  }, [selectedDossieId, dossies]);

  const handleToggleDocumento = async (documento: TipoDocumento) => {
    if (!selectedDossie) return;
    setTogglingDoc(documento);

    try {
      await toggleDocumento(selectedDossie.id, documento, currentUser.name, currentUser.email);
      const updated = await loadDossieById(selectedDossie.id);
      if (updated) setSelectedDossie(updated);
    } finally {
      setTogglingDoc(null);
    }
  };

  const handleSaveObservacao = async () => {
    if (!selectedDossie) return;
    await atualizarObservacao(selectedDossie.id, novaObservacao, currentUser.name, currentUser.email);
    const updated = await loadDossieById(selectedDossie.id);
    if (updated) {
      setSelectedDossie(updated);
      setEditingObservacao(false);
    }
  };

  const handleSavePasta = async () => {
    if (!selectedDossie) return;
    await atualizarPastaDesligado(selectedDossie.id, novaPasta, currentUser.name, currentUser.email);
    const updated = await loadDossieById(selectedDossie.id);
    if (updated) {
      setSelectedDossie(updated);
      setEditingPasta(false);
    }
  };

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'responsavel';

  if (selectedDossie) {
    const percentual = calcularPercentualConclusao(selectedDossie.checklist);
    const isExclusividadeValida = verificarExclusividadeASODeclaracao(selectedDossie.checklist);
    const todosDocumentosMarcados = todosDocumentosNecessariosMarados(
      selectedDossie.checklist,
      selectedDossie.tipo_desligamento as TipoDesligamento
    );

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Acompanhamento Dossiê</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <p><strong>Colaborador:</strong> {selectedDossie.employee_name}</p>
          <p><strong>Tipo:</strong> {LABELS_DESLIGAMENTO[selectedDossie.tipo_desligamento]}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Progresso</h3>
          <div className="w-full bg-gray-200 h-3 rounded">
            <div className="bg-blue-600 h-3 rounded" style={{ width: `${percentual}%` }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Documentos</h3>

          {selectedDossie.checklist.map(item => (
            <div key={item.documento} className="flex gap-3 mb-2">
              <button onClick={() => handleToggleDocumento(item.documento)} disabled={!canEdit}>
                {item.marcado ? <CheckSquare /> : <Square />}
              </button>
              <span>{LABELS_DOCUMENTO[item.documento]}</span>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Observações</h3>

          {editingObservacao ? (
            <>
              <textarea value={novaObservacao} onChange={e => setNovaObservacao(e.target.value)} />
              <button onClick={handleSaveObservacao}>Salvar</button>
            </>
          ) : (
            <p>{selectedDossie.observacao || 'Nenhuma'}</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Pasta</h3>

          {editingPasta ? (
            <>
              <input value={novaPasta} onChange={e => setNovaPasta(e.target.value)} />
              <button onClick={handleSavePasta}>Salvar</button>
            </>
          ) : (
            <div>
              {selectedDossie.pasta_desligado ? (
                <a
                  href={selectedDossie.pasta_desligado}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {selectedDossie.pasta_desligado}
                </a>
              ) : (
                <p>Nenhuma pasta definida</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Dossiês</h1>

      {loading && <p>Carregando...</p>}
      {error && <p>{error}</p>}

      {dossies.map(d => (
        <button key={d.id} onClick={() => setSelectedDossie(d)}>
          {d.employee_name}
        </button>
      ))}
    </div>
  );
}
