import { useState, useEffect } from 'react';
import { CheckSquare, Square, AlertCircle, Loader2, FileText, Folder, MessageSquare, Clock, User } from 'lucide-react';
import { useDossie } from '../hooks/useDossie';
import {
  AcompanhamentoDossie,
  TipoDocumento,
  StatusDossie,
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

export default function DossieView({ currentUser, selectedDossieId, onBack }: DossieViewProps) {
  const { dossies, loading, error, loadDossies, loadDossieById, toggleDocumento, atualizarObservacao, atualizarPastaDesligado } = useDossie();
  const [selectedDossie, setSelectedDossie] = useState<AcompanhamentoDossie | null>(null);
  const [editingObservacao, setEditingObservacao] = useState(false);
  const [novaObservacao, setNovaObservacao] = useState('');
  const [editingPasta, setEditingPasta] = useState(false);
  const [novaPasta, setNovaPasta] = useState('');
  const [togglingDoc, setTogglingDoc] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<StatusDossie | 'all'>('all');

  // Carregar dossiês ao montar o componente
  useEffect(() => {
    console.log('DossieView montado, carregando dossiês...');
    loadDossies();
  }, [loadDossies]);

  // Debug: mostrar dossiês carregados
  useEffect(() => {
    console.log('Dossiês carregados:', dossies);
  }, [dossies]);

  useEffect(() => {
    if (selectedDossieId) {
      const dossie = dossies.find(d => d.id === selectedDossieId);
      if (dossie) {
        setSelectedDossie(dossie);
      }
    }
  }, [selectedDossieId, dossies]);

const handleToggleDocumento = async (documento: TipoDocumento) => {
  if (!selectedDossie) return;
  setTogglingDoc(documento);
  try {
    await toggleDocumento(selectedDossie.id, documento, currentUser.name, currentUser.email);
    // Pequeno delay para garantir que o Supabase processou
    await new Promise(resolve => setTimeout(resolve, 300));
    const updated = await loadDossieById(selectedDossie.id);
    if (updated) {
      setSelectedDossie(updated);
    }
  } catch (error) {
    console.error('Erro ao marcar documento:', error);
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

  const getStatusColor = (status: StatusDossie) => {
    switch (status) {
      case StatusDossie.PENDENTE:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case StatusDossie.EM_ANDAMENTO:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case StatusDossie.CONCLUIDO:
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: StatusDossie) => {
    switch (status) {
      case StatusDossie.PENDENTE:
        return 'Pendente';
      case StatusDossie.EM_ANDAMENTO:
        return 'Em Andamento';
      case StatusDossie.CONCLUIDO:
        return 'Concluído';
      default:
        return status;
    }
  };

  const filteredDossies = dossies.filter(d => filterStatus === 'all' || d.status === filterStatus);

  if (selectedDossie) {
    const percentual = calcularPercentualConclusao(selectedDossie.checklist);
    const isExclusividadeValida = verificarExclusividadeASODeclaracao(selectedDossie.checklist);
    const canEdit = currentUser.role === 'admin' || currentUser.role === 'responsavel';

    return (
      <div className="space-y-6">
        {/* Header com botão voltar */}
        <div className="flex items-center justify-between">
          {onBack && (
            <button
              onClick={() => {
                setSelectedDossie(null);
                onBack();
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              ← Voltar
            </button>
          )}
          <h1 className="text-2xl font-bold">Acompanhamento Dossiê</h1>
          <div className={`px-4 py-2 rounded-lg border ${getStatusColor(selectedDossie.status)}`}>
            {getStatusLabel(selectedDossie.status)}
          </div>
        </div>

        {/* Informações do Colaborador */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Colaborador</p>
              <p className="text-lg font-semibold text-gray-900">{selectedDossie.employee_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tipo de Desligamento</p>
              <p className="text-lg font-semibold text-gray-900">
                {LABELS_DESLIGAMENTO[selectedDossie.tipo_desligamento]}
              </p>
            </div>
            {selectedDossie.cpf && (
              <div>
                <p className="text-sm text-gray-600">CPF</p>
                <p className="text-lg font-semibold text-gray-900">{selectedDossie.cpf}</p>
              </div>
            )}
            {selectedDossie.chapa && (
              <div>
                <p className="text-sm text-gray-600">Chapa</p>
                <p className="text-lg font-semibold text-gray-900">{selectedDossie.chapa}</p>
              </div>
            )}
          </div>
        </div>

        {/* Indicador de Progresso */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-900">Progresso de Conclusão</h3>
              <span className="text-2xl font-bold text-blue-600">{percentual}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${percentual}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {selectedDossie.checklist.filter(c => c.marcado).length} de {selectedDossie.checklist.length} documentos marcados
            </p>
          </div>

          {!isExclusividadeValida && (
            <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Atenção</p>
                <p className="text-sm text-red-700">ASO e Declaração de Não Realização são mutuamente exclusivos. Desmarque um deles.</p>
              </div>
            </div>
          )}
        </div>

        {/* Checklist de Documentos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentos Obrigatórios</h3>
          <div className="space-y-3">
            {selectedDossie.checklist.map(item => {
              const isASO = item.documento === TipoDocumento.ASO;
              const isDeclaracao = item.documento === TipoDocumento.DECLARACAO_NAO_REALIZACAO_EXAMES;
              const shouldDisable = !isExclusividadeValida && ((isASO && selectedDossie.checklist.some(c => c.documento === TipoDocumento.DECLARACAO_NAO_REALIZACAO_EXAMES && c.marcado)) || (isDeclaracao && selectedDossie.checklist.some(c => c.documento === TipoDocumento.ASO && c.marcado)));

              return (
                <div
                  key={item.documento}
                  className={`flex items-start gap-3 p-4 border rounded-lg transition-all ${
                    item.marcado ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  } ${shouldDisable ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <button
                    onClick={() => handleToggleDocumento(item.documento)}
                    disabled={togglingDoc === item.documento || !canEdit || shouldDisable}
                    className="flex-shrink-0 mt-1 disabled:opacity-50"
                  >
                    {togglingDoc === item.documento ? (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : item.marcado ? (
                      <CheckSquare className="w-5 h-5 text-green-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${item.marcado ? 'text-green-900 line-through' : 'text-gray-900'}`}>
                      {LABELS_DOCUMENTO[item.documento]}
                    </p>
                    {item.usuario_marcacao && (
                      <p className="text-xs text-gray-600 mt-1">
                        Marcado por {item.usuario_marcacao} em {new Date(item.data_marcacao!).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Observações
            </h3>
            {canEdit && !editingObservacao && (
              <button
                onClick={() => {
                  setNovaObservacao(selectedDossie.observacao || '');
                  setEditingObservacao(true);
                }}
                className="text-sm px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
              >
                Editar
              </button>
            )}
          </div>

          {editingObservacao ? (
            <div className="space-y-3">
              <textarea
                value={novaObservacao}
                onChange={e => setNovaObservacao(e.target.value)}
                placeholder="Adicione observações sobre o dossiê..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                rows={4}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveObservacao}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setEditingObservacao(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">
              {selectedDossie.observacao || '(Nenhuma observação adicionada)'}
            </p>
          )}
        </div>

        {/* Pasta do Desligado */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Pasta do Desligado
            </h3>
            {canEdit && !editingPasta && (
              <button
                onClick={() => {
                  setNovaPasta(selectedDossie.pasta_desligado || '');
                  setEditingPasta(true);
                }}
                className="text-sm px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
              >
                Editar
              </button>
            )}
          </div>

          {editingPasta ? (
            <div className="space-y-3">
              <input
                type="text"
                value={novaPasta}
                onChange={e => setNovaPasta(e.target.value)}
                placeholder="Ex: /storage/desligados/2024/colaborador_nome ou https://drive.google.com/..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSavePasta}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setEditingPasta(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div>
              {selectedDossie.pasta_desligado ? (
                <a
                  href={selectedDossie.pasta_desligado}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  {selectedDossie.pasta_desligado}
                </a>
              ) : (
                <p className="text-gray-500">(Nenhuma pasta definida)</p>
              )}
            </div>
          )}
        </div>

        {/* Auditoria */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Histórico de Auditoria
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedDossie.historico_auditoria && selectedDossie.historico_auditoria.length > 0 ? (
              selectedDossie.historico_auditoria.map((item, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {item.usuario} ({item.email_usuario})
                    </p>
                    <p className="text-xs text-gray-600">
                      {item.acao === 'marcacao' && `Marcou: ${LABELS_DOCUMENTO[item.documento!]}`}
                      {item.acao === 'desmarcacao' && `Desmarcou: ${LABELS_DOCUMENTO[item.documento!]}`}
                      {item.acao === 'criacao' && 'Criou o dossiê'}
                      {item.acao === 'conclusao' && 'Concluiu o dossiê'}
                      {item.acao === 'edicao_observacao' && 'Editou informações'}
                      {item.detalhes && ` - ${item.detalhes}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.data_hora).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum registro de auditoria</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Acompanhamento Dossiê</h1>
        <p className="text-gray-600 mt-1">Gerencie os checklists de documentos para desligamentos</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {(['all', StatusDossie.PENDENTE, StatusDossie.EM_ANDAMENTO, StatusDossie.CONCLUIDO] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'Todos' : getStatusLabel(status as StatusDossie)}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="ml-3 text-gray-600">Carregando dossiês...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Erro</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Lista de Dossiês */}
      {!loading && filteredDossies.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="font-medium text-gray-900">Nenhum dossiê encontrado</p>
          <p className="text-sm text-gray-600 mt-1">Os dossiês serão criados automaticamente quando movimentações de desligamento forem registradas</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDossies.map(dossie => {
            const percentual = calcularPercentualConclusao(dossie.checklist);
            return (
              <button
                key={dossie.id}
                onClick={() => setSelectedDossie(dossie)}
                className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow text-left border-l-4"
                style={{
                  borderLeftColor:
                    dossie.status === StatusDossie.CONCLUIDO
                      ? '#10b981'
                      : dossie.status === StatusDossie.EM_ANDAMENTO
                      ? '#3b82f6'
                      : '#f59e0b',
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{dossie.employee_name}</h3>
                    <p className="text-sm text-gray-600">{LABELS_DESLIGAMENTO[dossie.tipo_desligamento]}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getStatusColor(dossie.status)}`}>
                    {getStatusLabel(dossie.status)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percentual}%` }} />
                </div>
                <p className="text-xs text-gray-600 mt-2">{percentual}% concluído</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
