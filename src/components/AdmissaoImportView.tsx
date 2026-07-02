import { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, FileText, X, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { useAdmissao } from '../hooks/useAdmissao';
import { parseArquivoAdmissao, LinhaAdmissaoImportada } from '../lib/admissaoTxtParser';
import { LABEL_CAMPO_ADMISSAO, CATEGORIA_CAMPO, CampoAdmissao, CAMPOS_OBRIGATORIOS_IMPORTACAO } from '../types/admissao';

interface AdmissaoImportViewProps {
  currentUser: { id: string; name: string; email: string };
  onClose: () => void;
  onImportado?: () => void;
}

type Etapa = 'upload' | 'revisao' | 'resultado';

/**
 * Módulo independente de importação de Admissão.
 * Fluxo: 1) upload do .txt/.csv exportado do sistema -> 2) tela de revisão,
 * onde TODOS os campos de cada pessoa podem ser conferidos/editados (com
 * destaque para Líder e Observação, que normalmente vêm vazios no export)
 * -> 3) confirmação, criando 1 movimentação de Admissão por pessoa.
 */
export default function AdmissaoImportView({ currentUser, onClose, onImportado }: AdmissaoImportViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [etapa, setEtapa] = useState<Etapa>('upload');
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [registros, setRegistros] = useState<LinhaAdmissaoImportada[]>([]);
  const [camposNaoReconhecidos, setCamposNaoReconhecidos] = useState<string[]>([]);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<number | null>(0);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ sucesso: string[]; falhas: { nome: string; motivo: string }[] } | null>(null);
  const { criarAdmissoesEmLote } = useAdmissao();

  const categorias: Array<'Dados do Colaborador' | 'Dados da Contratação' | 'Remuneração'> = [
    'Dados do Colaborador',
    'Dados da Contratação',
    'Remuneração',
  ];

  const handleFile = async (file: File) => {
    setNomeArquivo(file.name);
    const texto = await file.text();
    const resultadoParse = parseArquivoAdmissao(texto);

    if (resultadoParse.erroGeral) {
      setErroGeral(resultadoParse.erroGeral);
      setRegistros([]);
      return;
    }

    setErroGeral(null);
    setCamposNaoReconhecidos(resultadoParse.camposNaoReconhecidos);
    setRegistros(resultadoParse.registros);
    setExpandido(0);
    setEtapa('revisao');
  };

  const atualizarCampo = (indexRegistro: number, campo: CampoAdmissao, valor: string) => {
    setRegistros(prev =>
      prev.map((r, i) => {
        if (i !== indexRegistro) return r;
        const novosDados = { ...r.dados, [campo]: valor };
        const faltando = CAMPOS_OBRIGATORIOS_IMPORTACAO.filter(c => !novosDados[c]?.trim());
        return {
          ...r,
          dados: novosDados,
          camposObrigatoriosFaltando: faltando,
          valida: faltando.length === 0,
        };
      })
    );
  };

  const removerRegistro = (indexRegistro: number) => {
    setRegistros(prev => prev.filter((_, i) => i !== indexRegistro));
  };

  const todosValidos = registros.length > 0 && registros.every(r => r.valida);

  const handleConfirmar = async () => {
    if (!todosValidos) return;
    setEnviando(true);
    try {
      const payload = registros.map(r => ({
        dados: r.dados,
        nomeMovimento: r.dados[CampoAdmissao.NOME] || 'Colaborador',
      }));
      const res = await criarAdmissoesEmLote(payload, currentUser.name, currentUser.email);
      setResultado(res);
      setEtapa('resultado');
      onImportado?.();
    } catch (err) {
      console.error(err);
      alert('Erro ao importar. Verifique o console para mais detalhes.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" /> Importar Admissão
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* ETAPA 1: UPLOAD */}
          {etapa === 'upload' && (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40"
              >
                <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {nomeArquivo ? `Arquivo selecionado: ${nomeArquivo}` : 'Clique para selecionar o arquivo (.txt ou .csv)'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Exportação do sistema, com cabeçalho na 1ª linha e uma pessoa por linha</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
              {erroGeral && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  {erroGeral}
                </div>
              )}
            </>
          )}

          {/* ETAPA 2: REVISÃO / EDIÇÃO */}
          {etapa === 'revisao' && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  {registros.length} pessoa{registros.length !== 1 ? 's' : ''} encontrada{registros.length !== 1 ? 's' : ''} em <span className="font-medium">{nomeArquivo}</span>
                </div>
                <button onClick={() => { setEtapa('upload'); setRegistros([]); }} className="text-xs text-blue-600 hover:underline">
                  Trocar arquivo
                </button>
              </div>

              {camposNaoReconhecidos.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                  <p className="font-medium mb-1">Colunas não reconhecidas (ignoradas):</p>
                  <p>{camposNaoReconhecidos.join(', ')}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                Confira os dados de cada pessoa abaixo. Os campos <strong>Líder</strong> e{' '}
                <strong>Observações</strong> costumam vir vazios no arquivo exportado — preencha-os antes de confirmar. Qualquer outro campo também pode ser corrigido aqui.
              </div>

              <div className="space-y-3">
                {registros.map((registro, idx) => {
                  const nome = registro.dados[CampoAdmissao.NOME] || `Pessoa ${idx + 1}`;
                  const aberto = expandido === idx;
                  return (
                    <div key={idx} className={`border rounded-lg overflow-hidden ${!registro.valida ? 'border-red-300' : 'border-gray-200'}`}>
                      <button
                        onClick={() => setExpandido(aberto ? null : idx)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-2 text-left">
                          {registro.valida ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                          <span className="font-medium text-sm">{nome}</span>
                          <span className="text-xs text-gray-400">(linha {registro.linha})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {!registro.valida && (
                            <span className="text-xs text-red-600">
                              Faltando: {registro.camposObrigatoriosFaltando.map(c => LABEL_CAMPO_ADMISSAO[c]).join(', ')}
                            </span>
                          )}
                          {aberto ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </button>

                      {aberto && (
                        <div className="p-4 space-y-4">
                          {/* Líder e Observações em destaque */}
                          <div className="grid grid-cols-2 gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div>
                              <label className="text-xs font-semibold text-amber-800">Líder</label>
                              <input
                                type="text"
                                value={registro.dados[CampoAdmissao.LIDER] || ''}
                                onChange={e => atualizarCampo(idx, CampoAdmissao.LIDER, e.target.value)}
                                placeholder="Nome do líder"
                                className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-amber-800">Observações</label>
                              <input
                                type="text"
                                value={registro.dados[CampoAdmissao.OBSERVACOES] || ''}
                                onChange={e => atualizarCampo(idx, CampoAdmissao.OBSERVACOES, e.target.value)}
                                placeholder="Observações"
                                className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                              />
                            </div>
                          </div>

                          {/* Demais campos, por categoria */}
                          {categorias.map(cat => {
                            const campos = (Object.keys(LABEL_CAMPO_ADMISSAO) as CampoAdmissao[]).filter(
                              c => CATEGORIA_CAMPO[c] === cat && c !== CampoAdmissao.LIDER && c !== CampoAdmissao.OBSERVACOES
                            );
                            return (
                              <div key={cat}>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{cat}</p>
                                <div className="grid grid-cols-2 gap-3">
                                  {campos.map(c => {
                                    const obrigatorio = CAMPOS_OBRIGATORIOS_IMPORTACAO.includes(c);
                                    const vazio = !registro.dados[c]?.trim();
                                    return (
                                      <div key={c}>
                                        <label className="text-xs text-gray-500">
                                          {LABEL_CAMPO_ADMISSAO[c]} {obrigatorio && <span className="text-red-500">*</span>}
                                        </label>
                                        <input
                                          type="text"
                                          value={registro.dados[c] || ''}
                                          onChange={e => atualizarCampo(idx, c, e.target.value)}
                                          className={`mt-1 w-full border rounded px-2 py-1.5 text-sm ${obrigatorio && vazio ? 'border-red-300 bg-red-50' : ''}`}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}

                          <button
                            onClick={() => removerRegistro(idx)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Remover esta pessoa da importação
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleConfirmar}
                disabled={!todosValidos || enviando}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {enviando
                  ? 'Importando...'
                  : `Confirmar Importação (${registros.length} pessoa${registros.length !== 1 ? 's' : ''})`}
              </button>
            </>
          )}

          {/* ETAPA 3: RESULTADO */}
          {etapa === 'resultado' && resultado && (
            <div className="py-4">
              <div className="text-center mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-medium text-gray-800">
                  {resultado.sucesso.length} admissão(ões) importada(s) com sucesso!
                </p>
              </div>

              {resultado.sucesso.length > 0 && (
                <ul className="text-sm text-green-700 list-disc pl-5 mb-3">
                  {resultado.sucesso.map((nome, i) => (
                    <li key={i}>{nome}</li>
                  ))}
                </ul>
              )}

              {resultado.falhas.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <p className="font-medium mb-1">Falharam:</p>
                  <ul className="list-disc pl-5">
                    {resultado.falhas.map((f, i) => (
                      <li key={i}>{f.nome}: {f.motivo}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button onClick={onClose} className="mt-4 w-full bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm">
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
