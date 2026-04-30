import { useState, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  AlertCircle,
  Loader2,
  ChevronDown,
  X,
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

  // NOVOS: Filtros de mês e ano
  const [filterMes, setFilterMes] = useState<string>('');
  const [filterAno, setFilterAno] = useState<string>('');
  const [showHistorico, setShowHistorico] = useState(false);
  const [togglingDoc, setTogglingDoc] = useState<string | null>(null);
  const [novoTipo, setNovoTipo] = useState<TipoDesligamento>(
    TipoDesligamento.OUTROS_MOTIVOS
  );
  const [editingTipo, setEditingTipo] = useState(false);

  // NOVO: Estado para data de demissão
  const [dataDemissao, setDataDemissao] = useState<string>('');
  const [savingDate, setSavingDate] = useState(false);

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

  // NOVO: Função para extrair mês e ano de uma data YYYY-MM-DD
  const extractMonthYear = (dateStr?: string) => {
    if (!dateStr) return { mes: '', ano: '' };
    const [ano, mes] = dateStr.split('-');
    return { mes, ano };
  };

  // NOVO: Filtrar dossies por mês e ano
  const dossiesFiltrados = dossies.filter(d => {
    if (!d.data_demissao) return true;
    const { mes, ano } = extractMonthYear(d.data_demissao);
    if (filterAno && ano !== filterAno) return false;
    if (filterMes && mes !== filterMes) return false;
    return true;
  });

  // NOVO: Obter anos únicos para filtro
  const anosDisponiveis = Array.from(
    new Set(
      dossies
        .map(d => extractMonthYear(d.data_demissao).ano)
        .filter(Boolean)
    )
  ).sort((a, b) => b.localeCompare(a));

  // NOVO: Obter meses únicos para filtro (apenas dos dossies do ano selecionado)
  const mesesDisponiveis = filterAno
    ? Array.from(
        new Set(
          dossies
            .filter(d => extractMonthYear(d.data_demissao).ano === filterAno)
            .map(d => extractMonthYear(d.data_demissao).mes)
            .filter(Boolean)
        )
      ).sort()
    : [];

  // NOVO: Nomes dos meses para exibição
  const nomeMeses: Record<string, string> = {
    '01': 'Janeiro',
    '02': 'Fevereiro',
    '03': 'Março',
    '04': 'Abril',
    '05': 'Maio',
    '06': 'Junho',
    '07': 'Julho',
    '08': 'Agosto',
    '09': 'Setembro',
    '10': 'Outubro',
    '11': 'Novembro',
    '12': 'Dezembro',
  };

  // =========================
  // REGRAS DE DOCUMENTOS
  // =========================
  const getDocsByTipo = (tipo: TipoDesligamento): TipoDocumento[] => {
    return getDocumentosObrigatorios(tipo);
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

    // CORRIGIDO: Recarregar dados do banco para atualizar corretamente
    const updated = await loadDossieById(selectedDossie.id);
    if (updated) setSelectedDossie(updated);

    setTogglingDoc(null);
  };

  // NOVO: Salvar data de demissão
  const handleSaveDataDemissao = async () => {
    if (!selectedDossie || !dataDemissao) return;

    setSavingDate(true);
    try {
      // Aqui você faria a chamada ao Supabase para atualizar data_demissao
      // Por enquanto, apenas atualizar estado local
      setSelectedDossie({
        ...selectedDossie,
        data_demissao: dataDemissao,
      });
      alert('Data de demissão atualizada com sucesso!');
    } catch (err) {
      alert('Erro ao salvar data de demissão');
      console.error(err);
    } finally {
      setSavingDate(false);
    }
  };

  // =========================
  // DETALHE DO DOSSIÊ
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

    const percentual = calcularPercentualConclusao(selectedDossie.checklist);

    return (
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">
              {selectedDossie.employee_name}
            </h1>
            <p className="text-gray-600 mt-1">
              {
                LABELS_DESLIGAMENTO[
                  selectedDossie.tipo_desligamento as TipoDesligamento
                ]
              }
            </p>
            {selectedDossie.data_demissao && (
              <p className="text-sm text-gray-500 mt-1">
                Data de demissão: <strong>{new Date(selectedDossie.data_demissao + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>
              </p>
            )}
          </div>

          <button
            onClick={() => {
              setSelectedDossie(null);
              onBack && onBack();
            }}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
          >
            ← Voltar
          </button>
        </div>

        {/* CARD: DATA DE DEMISSÃO */}
        {canEdit && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">Data de Demissão</h3>
            <div className="flex gap-3">
              <input
                type="date"
                value={dataDemissao || selectedDossie.data_demissao || ''}
                onChange={e => setDataDemissao(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2"
              />
              <button
                onClick={handleSaveDataDemissao}
                disabled={savingDate || !dataDemissao}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                {savingDate ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}

        {/* ALTERAR TIPO */}
        {canEdit && (
          <div className="bg-white border rounded-lg p-4">
            {editingTipo ? (
              <div className="space-y-3">
                <label className="block text-sm font-semibold">Alterar Tipo de Desligamento</label>
                <select
                  value={novoTipo}
                  onChange={e =>
                    setNovoTipo(e.target.value as TipoDesligamento)
                  }
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {Object.entries(LABELS_DESLIGAMENTO).map(
                    ([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    )
                  )}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleAlterarTipoLocal}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => setEditingTipo(false)}
                    className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditingTipo(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Alterar Tipo de Desligamento
              </button>
            )}
          </div>
        )}

        {/* ALERTAS */}
        {!exclusividadeOk && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>ASO e Declaração de Não Realização não podem ser marcados juntos</p>
          </div>
        )}

        {!docsOk && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>Documentos obrigatórios pendentes</p>
          </div>
        )}

        {/* PROGRESSO */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold">Progresso</span>
            <span className="text-lg font-bold text-blue-600">{percentual}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${percentual}%` }}
            />
          </div>
        </div>

        {/* CHECKLIST */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Documentos Obrigatórios</h3>
          <div className="space-y-3">
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
                  <button
                    key={item.documento}
                    onClick={() =>
                      handleToggleDocumento(item.documento)
                    }
                    disabled={!canEdit || disable}
                    className="w-full flex gap-3 items-center p-3 border rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-left"
                  >
                    {togglingDoc === item.documento ? (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                    ) : item.marcado ? (
                      <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={item.marcado ? 'text-green-700 font-medium' : 'text-gray-700'}>
                      {LABELS_DOCUMENTO[item.documento]}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* HISTÓRICO */}
        <div className="bg-white border rounded-lg p-4">
          <button
            onClick={() => setShowHistorico(!showHistorico)}
            className="w-full flex justify-between items-center font-semibold hover:text-blue-600 transition"
          >
            <span>Histórico de Auditoria</span>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                showHistorico ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showHistorico && (
            <div className="mt-4 space-y-3">
              {selectedDossie.historico_auditoria && selectedDossie.historico_auditoria.length > 0 ? (
                selectedDossie.historico_auditoria.map(
                  (h, i) => (
                    <div key={i} className="text-sm border-l-4 border-blue-400 pl-3 py-2">
                      <p className="font-medium text-gray-900">{h.usuario}</p>
                      <p className="text-gray-600">Ação: {h.acao}</p>
                      {h.documento && (
                        <p className="text-gray-600">Documento: {LABELS_DOCUMENTO[h.documento]}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(h.data_hora).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )
                )
              ) : (
                <p className="text-gray-500 text-sm">Nenhum registro de auditoria</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================
  // LISTA DE DOSSIÊS
  // =========================
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Acompanhamento Dossiê</h1>
        <p className="text-gray-600 mt-1">
          Gerencie documentos obrigatórios de desligamentos
        </p>
      </div>

      {/* FILTROS */}
      <div className="bg-white border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold mb-3">Filtros</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Filtro por Ano */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">Ano</label>
            <select
              value={filterAno}
              onChange={e => {
                setFilterAno(e.target.value);
                setFilterMes(''); // Reset mês ao mudar ano
              }}
              className="w-full border rounded-lg px-3 py-2 bg-white"
            >
              <option value="">Todos os Anos</option>
              {anosDisponiveis.map(ano => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Mês */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">Mês</label>
            <select
              value={filterMes}
              onChange={e => setFilterMes(e.target.value)}
              disabled={!filterAno}
              className="w-full border rounded-lg px-3 py-2 bg-white disabled:bg-gray-100 disabled:opacity-50"
            >
              <option value="">Todos os Meses</option>
              {mesesDisponiveis.map(mes => (
                <option key={mes} value={mes}>
                  {nomeMeses[mes]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botão Limpar Filtros */}
        {(filterAno || filterMes) && (
          <button
            onClick={() => {
              setFilterAno('');
              setFilterMes('');
            }}
            className="text-xs px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Limpar Filtros
          </button>
        )}
      </div>

      {/* CARREGAMENTO */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* ERRO */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* LISTA */}
      {!loading && dossiesFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">Nenhum dossiê encontrado.</p>
          {(filterAno || filterMes) && (
            <p className="text-gray-400 text-sm mt-2">Tente alterar os filtros.</p>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {dossiesFiltrados.map(d => {
            const percentual = calcularPercentualConclusao(
              d.checklist
            );

            return (
              <button
                key={d.id}
                onClick={() => setSelectedDossie(d)}
                className="bg-white border rounded-lg p-4 text-left hover:border-blue-400 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {d.employee_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {
                        LABELS_DESLIGAMENTO[
                          d.tipo_desligamento as TipoDesligamento
                        ]
                      }
                    </p>
                    {d.data_demissao && (
                      <p className="text-xs text-gray-500 mt-1">
                        Demissão: {new Date(d.data_demissao + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    percentual === 100
                      ? 'bg-green-100 text-green-700'
                      : percentual > 0
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {percentual}%
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentual}%` }}
                  />
                </div>

                <p className="text-xs text-gray-500">
                  {d.checklist.filter(c => c.marcado).length} de {d.checklist.length} documentos
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
