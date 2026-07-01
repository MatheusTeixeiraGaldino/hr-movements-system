import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
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
} from '../types/admissao';

interface AdmissaoViewProps {
  movimentoId: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
    team_names: string[];
    role?: string;
  };
}

/**
 * Exibe os dados da admissão (respeitando visibilidade por equipe) e o checklist
 * de documentos, também segmentado por equipe: cada equipe só vê e edita os
 * itens que são de sua responsabilidade (conforme REGRAS_DE_NEGOCIO).
 */
export default function AdmissaoView({ movimentoId, currentUser }: AdmissaoViewProps) {
  const { loadAdmissaoByMovimentoId, atualizarItemChecklist, loading } = useAdmissao();
  const [admissao, setAdmissao] = useState<AcompanhamentoAdmissao | null>(null);

  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    loadAdmissaoByMovimentoId(movimentoId).then(setAdmissao);
  }, [movimentoId, loadAdmissaoByMovimentoId]);

  if (!admissao) {
    return <div className="p-6 text-sm text-gray-500">Carregando dados de admissão...</div>;
  }

  const isCriador = admissao.email_usuario_criacao === currentUser.email;
  const dadosVisiveis = filtrarCamposVisiveis(admissao.dados, currentUser.team_names, isCriador, isAdmin);
  const categorias: Array<'Dados do Colaborador' | 'Dados da Contratação' | 'Remuneração'> = [
    'Dados do Colaborador',
    'Dados da Contratação',
    'Remuneração',
  ];

  const equipesVisiveisChecklist = isAdmin
    ? EQUIPES_CHECKLIST_ADMISSAO
    : EQUIPES_CHECKLIST_ADMISSAO.filter(eq => currentUser.team_names.includes(eq));

  const percentual = calcularPercentualConclusaoAdmissao(admissao.checklist);

  const handleToggle = async (regraId: string, novoValor: boolean) => {
    await atualizarItemChecklist(admissao.id, regraId, { marcado: novoValor }, currentUser.name, currentUser.email);
    const atualizado = await loadAdmissaoByMovimentoId(movimentoId);
    setAdmissao(atualizado);
  };

  const handleSecundario = async (regraId: string, opcao: string) => {
    await atualizarItemChecklist(
      admissao.id,
      regraId,
      { marcado: false, secundario_selecionado: opcao },
      currentUser.name,
      currentUser.email
    );
    const atualizado = await loadAdmissaoByMovimentoId(movimentoId);
    setAdmissao(atualizado);
  };

  const handleTexto = async (regraId: string, valor: string) => {
    await atualizarItemChecklist(admissao.id, regraId, { valor_texto: valor }, currentUser.name, currentUser.email);
  };

  const handleObservacao = async (regraId: string, observacao: string) => {
    await atualizarItemChecklist(admissao.id, regraId, { observacao }, currentUser.name, currentUser.email);
  };

  return (
    <div className="space-y-6">
      {/* Dados do colaborador (filtrados por equipe) */}
      <div className="border rounded-lg divide-y">
        {categorias.map(cat => {
          const campos = (Object.keys(dadosVisiveis) as CampoAdmissao[]).filter(c => CATEGORIA_CAMPO[c] === cat);
          if (campos.length === 0) return null;
          return (
            <div key={cat} className="p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{cat}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {campos.map(c => (
                  <div key={c} className="flex justify-between gap-2">
                    <span className="text-gray-500">{LABEL_CAMPO_ADMISSAO[c]}</span>
                    <span className="font-medium text-right">{dadosVisiveis[c]}</span>
                  </div>
                ))}
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

      {/* Checklist por equipe */}
      {equipesVisiveisChecklist.length === 0 && (
        <p className="text-sm text-gray-500">Sua equipe não possui itens de checklist neste módulo.</p>
      )}

      {equipesVisiveisChecklist.map(equipe => {
        const regras = CHECKLIST_REGRAS_ADMISSAO.filter(r => r.equipe === equipe);
        return (
          <div key={equipe} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 text-sm font-semibold">{equipe}</div>
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
                          onBlur={e => handleObservacao(regra.id, e.target.value)}
                          placeholder="Observação obrigatória (documento não entregue)"
                          className="border rounded px-2 py-1 text-xs w-full"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {loading && <p className="text-xs text-gray-400">Salvando...</p>}
    </div>
  );
}
