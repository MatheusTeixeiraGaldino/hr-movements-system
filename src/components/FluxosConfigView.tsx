import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Pencil, Plus, Trash2, Info, GripVertical, X } from 'lucide-react';
import { useChecklistConfig } from '../hooks/useChecklistConfig';
import { ChecklistItemConfig, TipoCampoChecklist } from '../types/checklistConfig';

const TEAMS = [
  { id: 'rh', name: 'RH', color: 'bg-purple-100 text-purple-700' },
  { id: 'ponto', name: 'Ponto', color: 'bg-orange-100 text-orange-700' },
  { id: 'transporte', name: 'Transporte', color: 'bg-green-100 text-green-700' },
  { id: 'ti', name: 'T.I', color: 'bg-blue-100 text-blue-700' },
  { id: 'seguranca', name: 'Segurança do Trabalho', color: 'bg-amber-100 text-amber-700' },
  { id: 'ambulatorio', name: 'Ambulatório', color: 'bg-teal-100 text-teal-700' },
  { id: 'beneficios', name: 'Benefícios', color: 'bg-pink-100 text-pink-700' },
  { id: 'financeiro', name: 'Financeiro', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'dp', name: 'DP', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'treinamento', name: 'Treinamento e Desenvolvimento', color: 'bg-stone-100 text-stone-700' },
  { id: 'comunicacao', name: 'Comunicação', color: 'bg-slate-100 text-slate-700' },
];

const MOVEMENT_TYPES = [
  { id: 'demissao', label: 'Demissão', dot: 'bg-red-500' },
  { id: 'transferencia', label: 'Transferência', dot: 'bg-blue-500' },
  { id: 'alteracao', label: 'Alteração Salarial', dot: 'bg-green-500' },
  { id: 'promocao', label: 'Promoção', dot: 'bg-purple-500' },
];

interface FormularioItem {
  label: string;
  obrigatorio: boolean;
  tipo_campo: TipoCampoChecklist;
  alternativas: string[];
}

const formularioVazio: FormularioItem = {
  label: '',
  obrigatorio: true,
  tipo_campo: 'checkbox',
  alternativas: [],
};

interface Props {
  userEmail?: string;
}

export default function FluxosConfigView({ userEmail }: Props) {
  const {
    loading,
    error,
    getItensPorEquipe,
    criarItem,
    editarItem,
    alternarAtivo,
    copiarConfiguracao,
  } = useChecklistConfig();

  const [tipoSelecionado, setTipoSelecionado] = useState('demissao');
  const [equipesAbertas, setEquipesAbertas] = useState<Record<string, boolean>>({ rh: true });
  const [mostrarCopiar, setMostrarCopiar] = useState(false);
  const [tipoOrigemCopia, setTipoOrigemCopia] = useState('');

  // Modal de criação/edição de item (usado tanto pra "Novo Item" quanto pro lápis de editar)
  const [modalAberto, setModalAberto] = useState<{ equipe: string; itemEditando: ChecklistItemConfig | null } | null>(null);
  const [formulario, setFormulario] = useState<FormularioItem>(formularioVazio);

  const [confirmandoDesativar, setConfirmandoDesativar] = useState<ChecklistItemConfig | null>(null);
  const [salvando, setSalvando] = useState(false);

  const itensPorEquipe = getItensPorEquipe(tipoSelecionado);

  const toggleEquipe = (teamId: string) => {
    setEquipesAbertas(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const abrirModalNovoItem = (equipe: string) => {
    setFormulario(formularioVazio);
    setModalAberto({ equipe, itemEditando: null });
  };

  const abrirModalEditar = (item: ChecklistItemConfig) => {
    setFormulario({
      label: item.label,
      obrigatorio: item.obrigatorio,
      tipo_campo: item.tipo_campo,
      alternativas: item.alternativas ? [...item.alternativas] : [],
    });
    setModalAberto({ equipe: item.team_id, itemEditando: item });
  };

  const fecharModal = () => {
    setModalAberto(null);
    setFormulario(formularioVazio);
  };

  const adicionarAlternativa = () => {
    setFormulario(prev => ({ ...prev, alternativas: [...prev.alternativas, ''] }));
  };

  const atualizarAlternativa = (index: number, valor: string) => {
    setFormulario(prev => {
      const novas = [...prev.alternativas];
      novas[index] = valor;
      return { ...prev, alternativas: novas };
    });
  };

  const removerAlternativa = (index: number) => {
    setFormulario(prev => ({ ...prev, alternativas: prev.alternativas.filter((_, i) => i !== index) }));
  };

  const salvarModal = async () => {
    if (!modalAberto || !formulario.label.trim()) return;
    setSalvando(true);
    try {
      const alternativasLimpas = formulario.alternativas.map(a => a.trim()).filter(Boolean);

      if (modalAberto.itemEditando) {
        await editarItem(
          modalAberto.itemEditando.id,
          {
            label: formulario.label.trim(),
            obrigatorio: formulario.obrigatorio,
            tipo_campo: formulario.tipo_campo,
            alternativas: alternativasLimpas,
          },
          userEmail
        );
      } else {
        await criarItem(
          {
            movement_type: tipoSelecionado,
            team_id: modalAberto.equipe,
            label: formulario.label.trim(),
            obrigatorio: formulario.obrigatorio,
            tipo_campo: formulario.tipo_campo,
            alternativas: alternativasLimpas,
          },
          userEmail
        );
      }
      fecharModal();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar item. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const confirmarDesativar = async () => {
    if (!confirmandoDesativar) return;
    setSalvando(true);
    try {
      await alternarAtivo(confirmandoDesativar.id, false, userEmail);
      setConfirmandoDesativar(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao desativar item. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const reativar = async (item: ChecklistItemConfig) => {
    setSalvando(true);
    try {
      await alternarAtivo(item.id, true, userEmail);
    } catch (err) {
      console.error(err);
      alert('Erro ao reativar item. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const executarCopia = async () => {
    if (!tipoOrigemCopia) return;
    setSalvando(true);
    try {
      await copiarConfiguracao(tipoOrigemCopia, tipoSelecionado, userEmail);
      setMostrarCopiar(false);
      setTipoOrigemCopia('');
    } catch (err) {
      console.error(err);
      alert('Erro ao copiar configuração. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Carregando fluxos...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuração de Fluxos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os itens que cada equipe precisa responder em cada tipo de movimentação.
          </p>
        </div>
        <button
          onClick={() => abrirModalNovoItem(TEAMS[0].id)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Novo Item
        </button>
      </div>

      {/* Filtro de tipo + copiar configuração */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de processo</label>
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 w-64">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                MOVEMENT_TYPES.find(t => t.id === tipoSelecionado)?.dot
              }`}
            />
            <select
              value={tipoSelecionado}
              onChange={e => setTipoSelecionado(e.target.value)}
              className="w-full outline-none bg-transparent"
            >
              {MOVEMENT_TYPES.map(t => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setMostrarCopiar(v => !v)}
          className="flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 rounded-lg font-medium text-gray-700 transition"
        >
          <Copy className="w-4 h-4" />
          Copiar configuração de outro tipo
        </button>
      </div>

      {mostrarCopiar && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-700">Copiar itens ativos de:</span>
          <select
            value={tipoOrigemCopia}
            onChange={e => setTipoOrigemCopia(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">Selecione o tipo de origem...</option>
            {MOVEMENT_TYPES.filter(t => t.id !== tipoSelecionado).map(t => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-500">
            para <strong>{MOVEMENT_TYPES.find(t => t.id === tipoSelecionado)?.label}</strong>
          </span>
          <button
            disabled={!tipoOrigemCopia || salvando}
            onClick={executarCopia}
            className="ml-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
          >
            Copiar itens
          </button>
        </div>
      )}

      {/* Aviso */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Marque como inativo para desabilitar o item. Itens inativos não aparecem para os
          responsáveis. Itens <strong>opcionais</strong> não bloqueiam o envio do parecer da
          equipe. Nenhum item é excluído de verdade — respostas antigas continuam preservadas.
        </p>
      </div>

      {/* Lista de equipes */}
      <div className="space-y-3">
        {TEAMS.map(team => {
          const itensDaEquipe = itensPorEquipe[team.id] || [];
          const ativos = itensDaEquipe.filter(i => i.ativo).length;
          const aberta = !!equipesAbertas[team.id];

          return (
            <div key={team.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleEquipe(team.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${team.color}`}
                  >
                    {team.name.charAt(0)}
                  </span>
                  <span className="font-semibold text-gray-900">{team.name}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {itensDaEquipe.length} {itensDaEquipe.length === 1 ? 'item' : 'itens'}
                  </span>
                  {ativos !== itensDaEquipe.length && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      {ativos} ativos
                    </span>
                  )}
                </div>
                {aberta ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {aberta && (
                <div className="border-t border-gray-200">
                  {itensDaEquipe.length > 0 && (
                    <div className="grid grid-cols-[1fr_110px_140px_100px] gap-4 px-5 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                      <span>Item que a equipe precisa responder</span>
                      <span>Obrigatório</span>
                      <span>Status</span>
                      <span>Ações</span>
                    </div>
                  )}

                  {itensDaEquipe.map(item => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_110px_140px_100px] gap-4 items-start px-5 py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className={`text-sm ${!item.ativo ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                            {item.label}
                          </span>
                          {item.tipo_campo === 'texto' && (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                              campo de texto
                            </span>
                          )}
                          {item.alternativas && item.alternativas.length > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {item.alternativas.map(alt => (
                                <li key={alt} className="text-xs text-gray-500 flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-gray-300 inline-block" />
                                  {alt}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      <div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            item.obrigatorio
                              ? 'bg-red-50 text-red-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {item.obrigatorio ? 'Obrigatório' : 'Opcional'}
                        </span>
                      </div>

                      <div>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <span className="relative">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={item.ativo}
                              disabled={salvando}
                              onChange={() =>
                                item.ativo ? setConfirmandoDesativar(item) : reativar(item)
                              }
                            />
                            <span className="block w-9 h-5 bg-gray-300 peer-checked:bg-indigo-600 rounded-full transition" />
                            <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-4" />
                          </span>
                          <span className={`text-sm ${item.ativo ? 'text-indigo-700' : 'text-gray-400'}`}>
                            {item.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => abrirModalEditar(item)}
                          className="p-1.5 border border-gray-200 rounded hover:bg-gray-50"
                          title="Editar item"
                        >
                          <Pencil className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => (item.ativo ? setConfirmandoDesativar(item) : reativar(item))}
                          className="p-1.5 border border-gray-200 rounded hover:bg-gray-50"
                          title={item.ativo ? 'Desativar item' : 'Reativar item'}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => abrirModalNovoItem(team.id)}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm text-indigo-600 hover:bg-indigo-50 border-t border-dashed border-gray-200 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar novo item
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de criar/editar item */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {modalAberto.itemEditando ? 'Editar item' : 'Novo item'} —{' '}
                {TEAMS.find(t => t.id === modalAberto.equipe)?.name}
              </h3>
              <button onClick={fecharModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto do item
              </label>
              <input
                autoFocus
                value={formulario.label}
                onChange={e => setFormulario(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Ex: Comissões recebidas"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de campo</label>
              <select
                value={formulario.tipo_campo}
                onChange={e =>
                  setFormulario(prev => ({ ...prev, tipo_campo: e.target.value as TipoCampoChecklist }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="checkbox">Caixa de marcação (checkbox)</option>
                <option value="texto">Campo de texto livre (ex: matrícula)</option>
              </select>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <span className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formulario.obrigatorio}
                  onChange={e => setFormulario(prev => ({ ...prev, obrigatorio: e.target.checked }))}
                />
                <span className="block w-9 h-5 bg-gray-300 peer-checked:bg-indigo-600 rounded-full transition" />
                <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-4" />
              </span>
              <span className="text-sm text-gray-700">
                Item obrigatório (bloqueia o envio do parecer da equipe até ser atendido)
              </span>
            </label>

            {formulario.tipo_campo === 'checkbox' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Alternativas (opcional)
                  </label>
                  <button
                    onClick={adicionarAlternativa}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar alternativa
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Se o colaborador não se aplica ao item principal, uma dessas alternativas pode
                  ser escolhida no lugar (ex: "Não aderiu ao plano"). Igual funciona no checklist
                  de Admissão.
                </p>
                <div className="space-y-2">
                  {formulario.alternativas.map((alt, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        value={alt}
                        onChange={e => atualizarAlternativa(index, e.target.value)}
                        placeholder="Ex: Não participante do benefício"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                      <button
                        onClick={() => removerAlternativa(index)}
                        className="p-1.5 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={fecharModal}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                disabled={salvando || !formulario.label.trim()}
                onClick={salvarModal}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de desativação */}
      {confirmandoDesativar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
            <h3 className="font-semibold text-gray-900">Desativar item?</h3>
            <p className="text-sm text-gray-600">
              "{confirmandoDesativar.label}" deixará de aparecer para a equipe{' '}
              <strong>{TEAMS.find(t => t.id === confirmandoDesativar.team_id)?.name}</strong>.
              O item não é excluído — pode ser reativado a qualquer momento e o histórico de
              respostas antigas é mantido.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmandoDesativar(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                disabled={salvando}
                onClick={confirmarDesativar}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                Desativar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
