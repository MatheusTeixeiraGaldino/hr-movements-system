import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, AlertCircle, Pencil, Check, X, Clock, MinusCircle, History } from 'lucide-react';
import { useAdmissao } from '../hooks/useAdmissao';
import {
  AcompanhamentoAdmissao,
  CampoAdmissao,
  CATEGORIA_CAMPO,
  LABEL_CAMPO_ADMISSAO,
  filtrarCamposVisiveis,
  CHECKLIST_REGRAS_ADMISSAO,
  EQUIPES_CHECKLIST_ADMISSAO,
  itemChecklistAtendido,
  calcularPercentualConclusaoAdmissao,
  statusChecklistEquipe,
  StatusChecklistEquipe,
} from '../types/admissao';

interface AdmissaoViewProps {
  movimentoId: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
    team_ids: string[];
    team_names: string[];
  };
  /** Equipe ativa selecionada em "Filtrar equipe" na barra lateral ('' = todas as equipes do usuário) */
  activeTeamId?: string;
}

const BADGE_STATUS: Record<StatusChecklistEquipe, { label: string; className: string; Icon: any }> = {
  completo: { label: 'Respondido', className: 'bg-green-50 text-green-700 border-green-200', Icon: CheckCircle2 },
  pendente: { label: 'Em andamento', className: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock },
  nao_iniciado: { label: 'Não iniciado', className: 'bg-gray-50 text-gray-500 border-gray-200', Icon: MinusCircle },
};

/**
 * Exibe os dados da admissão (respeitando visibilidade por equipe, e o filtro
 * "Filtrar equipe" da barra lateral) e o checklist de documentos, segmentado
 * por equipe:
 *  - Se o usuário pertence à equipe atualmente selecionada no filtro: vê e
 *    edita o checklist completo, incluindo a observação obrigatória.
 *  - Caso contrário: vê apenas um resumo (Respondido / Em andamento / Não
 *    iniciado), sem detalhes dos itens.
 *
 * Os campos de Remuneração só ficam visíveis se DP estiver entre as equipes
 * "ativas" no momento (respeitando o filtro), ou para o criador da movimentação.
 * DP e o criador também podem editar esses campos, sempre informando o motivo.
 */
export default function AdmissaoView({ movimentoId, currentUser, activeTeamId }: AdmissaoViewProps) {
  const { loadAdmissaoByMovimentoId, atualizarItemChecklist, atualizarObservacaoEquipe, atualizarCampoDados, loading } = useAdmissao();
  const [admissao, setAdmissao] = useState<AcompanhamentoAdmissao | null>(null);
  const [editandoCampo, setEditandoCampo] = useState<CampoAdmissao | null>(null);
  const [valorEdicao, setValorEdicao] = useState('');
  const [motivoEdicao, setMotivoEdicao] = useState('');

  // Nome da equipe correspondente ao filtro "Filtrar equipe" da barra lateral
  // ('' ou indefinido = "Todas as equipes")
  const activeTeamName = activeTeamId ? currentUser.team_names[currentUser.team_ids.indexOf(activeTeamId)] : '';

  // Equipes "ativas" no momento: se um filtro específico está selecionado, considera
  // só essa equipe; senão, considera todas as equipes do usuário. Usado tanto para
  // decidir quais campos de dados aparecem quanto quais seções de checklist expandem.
  const equipesAtivas = activeTeamId ? [activeTeamName] : currentUser.team_names;

  const recarregar = async () => {
    const atualizado = await loadAdmissaoByMovimentoId(movimentoId);
    setAdmissao(atualizado);
    return atualizado;
  };

  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movimentoId]);

  if (!admissao) {
    return <div className="p-6 text-sm text-gray-500">Carregando dados de admissão...</div>;
  }

  const isCriador = admissao.email_usuario_criacao === currentUser.email;
  const dadosVisiveis = filtrarCamposVisiveis(admissao.dados, equipesAtivas, isCriador);
  const categorias: Array<'Dados do Colaborador' | 'Dados da Contratação' | 'Remuneração'> = [
    'Dados do Colaborador',
    'Dados da Contratação',
    'Remuneração',
  ];

  // Permissão de EDIÇÃO de Remuneração: sempre baseada no pertencimento real do
  // usuário (não no filtro da barra lateral) — DP ou o criador podem editar.
  const podeEditarRemuneracao = isCriador || currentUser.team_names.includes('DP');

  const percentual = calcularPercentualConclusaoAdmissao(admissao.checklist, admissao.observacoes_equipe);

  const handleToggle = async (regraId: string, novoValor: boolean) => {
    await atualizarItemChecklist(admissao.id, regraId, { marcado: novoValor }, currentUser.name, currentUser.email);
    await recarregar();
  };

  const handleSecundario = async (regraId: string, opcao: string) => {
    await atualizarItemChecklist(
      admissao.id,
      regraId,
      { marcado: false, secundario_selecionado: opcao },
      currentUser.name,
      currentUser.email
    );
    await recarregar();
  };

  const handleTexto = async (regraId: string, valor: string) => {
    await atualizarItemChecklist(admissao.id, regraId, { valor_texto: valor }, currentUser.name, currentUser.email);
  };

  const handleObservacaoItem = async (regraId: string, observacao: string) => {
    await atualizarItemChecklist(admissao.id, regraId, { observacao }, currentUser.name, currentUser.email);
  };

  const handleObservacaoEquipe = async (equipe: string, texto: string) => {
    await atualizarObservacaoEquipe(admissao.id, equipe, texto, currentUser.name, currentUser.email);
    await recarregar();
  };

  const exigeMotivo = (campo: CampoAdmissao) => CATEGORIA_CAMPO[campo] === 'Remuneração';

  const iniciarEdicao = (campo: CampoAdmissao) => {
    setValorEdicao(admissao.dados[campo] || '');
    setMotivoEdicao('');
    setEditandoCampo(campo);
  };

  const cancelarEdicao = () => {
    setEditandoCampo(null);
    setValorEdicao('');
    setMotivoEdicao('');
  };

  const salvarEdicao = async () => {
    if (!editandoCampo) return;
    if (exigeMotivo(editandoCampo) && !motivoEdicao.trim()) return; // bloqueia sem motivo

    await atualizarCampoDados(
      admissao.id,
      editandoCampo,
      valorEdicao,
      currentUser.name,
      currentUser.email,
      exigeMotivo(editandoCampo) ? motivoEdicao.trim() : undefined
    );
    cancelarEdicao();
    await recarregar();
  };

  /** Última edição registrada para um campo específico, para mostrar "quem alterou e por quê" */
  const ultimaEdicaoDoCampo = (campo: CampoAdmissao) => {
    const label = LABEL_CAMPO_ADMISSAO[campo];
    const edicoes = admissao.historico_auditoria.filter(h => h.acao === 'edicao_campo' && h.campo_ou_item === label);
    return edicoes.length > 0 ? edicoes[edicoes.length - 1] : null;
  };

  return (
    <div className="space-y-6">
      {/* Dados do colaborador (filtrados por equipe/filtro ativo) */}
      <div className="border rounded-lg divide-y">
        {categorias.map(cat => {
          const campos = (Object.keys(dadosVisiveis) as CampoAdmissao[]).filter(c => CATEGORIA_CAMPO[c] === cat);
          if (campos.length === 0) return null;
          return (
            <div key={cat} className="p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{cat}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {campos.map(c => {
                  const editavel = c === CampoAdmissao.DATA_INICIO || (exigeMotivo(c) && podeEditarRemuneracao);
                  const editando = editandoCampo === c;
                  const ultimaEdicao = exigeMotivo(c) ? ultimaEdicaoDoCampo(c) : null;

                  return (
                    <div key={c} className={editando ? 'col-span-2' : ''}>
                      <div className="flex justify-between gap-2 items-center">
                        <span className="text-gray-500 flex items-center gap-1">
                          {LABEL_CAMPO_ADMISSAO[c]}
                          {ultimaEdicao && (
                            <span title={`Alterado por ${ultimaEdicao.usuario} em ${new Date(ultimaEdicao.data_hora).toLocaleString('pt-BR')}. ${ultimaEdicao.detalhes || ''}`}>
                              <History className="w-3 h-3 text-gray-300" />
                            </span>
                          )}
                        </span>

                        {!editando && (
                          <span className="font-medium text-right flex items-center gap-1.5">
                            {dadosVisiveis[c]}
                            {editavel && (
                              <button onClick={() => iniciarEdicao(c)} className="text-gray-300 hover:text-blue-500">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </span>
                        )}
                      </div>

                      {editando && (
                        <div className="mt-1.5 p-2 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5">
                          <input
                            type="text"
                            value={valorEdicao}
                            onChange={e => setValorEdicao(e.target.value)}
                            placeholder={c === CampoAdmissao.DATA_INICIO ? 'dd/mm/aaaa' : 'Novo valor'}
                            className="w-full border rounded px-2 py-1 text-sm"
                            autoFocus
                          />
                          {exigeMotivo(c) && (
                            <input
                              type="text"
                              value={motivoEdicao}
                              onChange={e => setMotivoEdicao(e.target.value)}
                              placeholder="Motivo da alteração (obrigatório)"
                              className={`w-full border rounded px-2 py-1 text-xs ${!motivoEdicao.trim() ? 'border-red-300' : ''}`}
                            />
                          )}
                          <div className="flex justify-end gap-2">
                            <button onClick={cancelarEdicao} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                              <X className="w-3.5 h-3.5" /> Cancelar
                            </button>
                            <button
                              onClick={salvarEdicao}
                              disabled={exigeMotivo(c) && !motivoEdicao.trim()}
                              className="text-xs text-green-600 hover:text-green-700 disabled:text-gray-300 flex items-center gap-1 font-medium"
                            >
                              <Check className="w-3.5 h-3.5" /> Salvar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progresso geral */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">Checklist de Documentos</span>
          <span className="text-gray-500">{percentual}% concluído</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${percentual}%` }} />
        </div>
      </div>

      {/* Checklist por equipe: completo para quem pertence à equipe ativa, resumo para os demais */}
      {EQUIPES_CHECKLIST_ADMISSAO.map(equipe => {
        const pertenceAEquipe = equipesAtivas.includes(equipe);
        const observacaoEquipe = admissao.observacoes_equipe[equipe] || '';

        if (!pertenceAEquipe) {
          const status = statusChecklistEquipe(admissao.checklist, equipe, observacaoEquipe);
          const badge = BADGE_STATUS[status];
          return (
            <div key={equipe} className="border rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{equipe}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${badge.className}`}>
                <badge.Icon className="w-3.5 h-3.5" />
                {badge.label}
              </span>
            </div>
          );
        }

        const regras = CHECKLIST_REGRAS_ADMISSAO.filter(r => r.equipe === equipe);
        return (
          <div key={equipe} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 text-sm font-semibold flex items-center justify-between">
              {equipe}
              {(() => {
                const status = statusChecklistEquipe(admissao.checklist, equipe, observacaoEquipe);
                const badge = BADGE_STATUS[status];
                return (
                  <span className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${badge.className}`}>
                    <badge.Icon className="w-3.5 h-3.5" />
                    {badge.label}
                  </span>
                );
              })()}
            </div>
            <div className="divide-y">
              {regras.map(regra => {
                const item = admissao.checklist.find(i => i.regra_id === regra.id) || {
                  regra_id: regra.id,
                  marcado: false,
                };
                const atendido = itemChecklistAtendido(item, regra);

                return (
                  <div key={regra.id} className="p-3 space-y-2">
                    {regra.tipo_campo === 'texto' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium flex-1">{regra.campo_principal}</span>
                        <input
                          type="text"
                          defaultValue={item.valor_texto || ''}
                          onBlur={e => handleTexto(regra.id, e.target.value)}
                          placeholder="Digite a matrícula"
                          className="border rounded px-2 py-1 text-sm w-40"
                        />
                        {atendido ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                        )}
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.marcado}
                          onChange={e => handleToggle(regra.id, e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium flex-1">{regra.campo_principal}</span>
                        {atendido ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                        )}
                      </label>
                    )}

                    {regra.campos_secundarios && !item.marcado && (
                      <div className="pl-6 flex flex-wrap gap-3">
                        {regra.campos_secundarios.map(opcao => (
                          <label key={opcao} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="radio"
                              name={`sec-${regra.id}`}
                              checked={item.secundario_selecionado === opcao}
                              onChange={() => handleSecundario(regra.id, opcao)}
                            />
                            {opcao}
                          </label>
                        ))}
                      </div>
                    )}

                    {regra.validacao === 'obrigatorio_com_observacao' && !item.marcado && (
                      <div className="pl-6 flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <input
                          type="text"
                          defaultValue={item.observacao || ''}
                          onBlur={e => handleObservacaoItem(regra.id, e.target.value)}
                          placeholder="Observação obrigatória (documento não entregue)"
                          className="border rounded px-2 py-1 text-xs w-full"
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Observação obrigatória da equipe */}
              <div className="p-3 bg-gray-50">
                <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                  Observação da equipe <span className="text-red-500">*</span>
                </label>
                <textarea
                  defaultValue={observacaoEquipe}
                  onBlur={e => handleObservacaoEquipe(equipe, e.target.value)}
                  placeholder={`Observação obrigatória de ${equipe} sobre esta admissão`}
                  rows={2}
                  className={`mt-1 w-full border rounded px-2 py-1.5 text-sm ${!observacaoEquipe.trim() ? 'border-red-300 bg-red-50' : ''}`}
                />
                {!observacaoEquipe.trim() && (
                  <p className="text-xs text-red-500 mt-1">Preencha a observação para concluir o checklist desta equipe.</p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {loading && <p className="text-xs text-gray-400">Salvando...</p>}
    </div>
  );
}
