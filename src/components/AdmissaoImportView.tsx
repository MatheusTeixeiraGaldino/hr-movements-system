import { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, FileText, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAdmissao } from '../hooks/useAdmissao';
import { parseTxtAdmissao, ResultadoParseAdmissao } from '../lib/admissaoTxtParser';
import { LABEL_CAMPO_ADMISSAO, CATEGORIA_CAMPO, CampoAdmissao } from '../types/admissao';

interface AdmissaoImportViewProps {
  currentUser: { id: string; name: string; email: string };
  onClose: () => void;
  onImportado?: (movimentoId: string) => void;
}

/**
 * Módulo independente: apenas importa um .txt no formato do modelo,
 * cria a movimentação do tipo "admissao" e o registro de acompanhamento
 * com o checklist zerado, pronto para as equipes preencherem.
 */
export default function AdmissaoImportView({ currentUser, onClose, onImportado }: AdmissaoImportViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resultado, setResultado] = useState<ResultadoParseAdmissao | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const { criarAdmissaoFromImport } = useAdmissao();

  const handleFile = async (file: File) => {
    setNomeArquivo(file.name);
    const texto = await file.text();
    setResultado(parseTxtAdmissao(texto));
    setSucesso(false);
  };

  const handleImportar = async () => {
    if (!resultado || !resultado.valido) return;
    setEnviando(true);
    try {
      const nome = resultado.dados[CampoAdmissao.NOME] || 'Colaborador';

      // 1) Cria a movimentação genérica (type: 'admissao')
      const { data: movimento, error: errMov } = await supabase
        .from('movements')
        .insert([
          {
            type: 'admissao',
            employee_name: nome,
            status: 'in_progress',
            created_by: currentUser.name,
            selected_teams: [],
            responses: {},
          },
        ])
        .select()
        .single();

      if (errMov || !movimento) throw errMov || new Error('Falha ao criar movimentação');

      // 2) Cria o registro de acompanhamento de admissão vinculado
      const registro = await criarAdmissaoFromImport(
        movimento.id,
        resultado.dados,
        currentUser.name,
        currentUser.email
      );

      if (!registro) throw new Error('Falha ao salvar dados de admissão');

      setSucesso(true);
      onImportado?.(movimento.id);
    } catch (err) {
      console.error(err);
      alert('Erro ao importar o arquivo. Verifique o console para mais detalhes.');
    } finally {
      setEnviando(false);
    }
  };

  const categorias: Array<'Dados do Colaborador' | 'Dados da Contratação' | 'Remuneração'> = [
    'Dados do Colaborador',
    'Dados da Contratação',
    'Remuneração',
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" /> Importar Admissão (.txt)
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!sucesso && (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40"
              >
                <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {nomeArquivo ? `Arquivo selecionado: ${nomeArquivo}` : 'Clique para selecionar o arquivo .txt'}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>

              {resultado && (
                <div className="space-y-3">
                  {resultado.erros.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <ul className="list-disc pl-4 space-y-1">
                        {resultado.erros.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {resultado.camposNaoReconhecidos.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                      <p className="font-medium mb-1">Chaves não reconhecidas (ignoradas):</p>
                      <p>{resultado.camposNaoReconhecidos.join(', ')}</p>
                    </div>
                  )}

                  <div className="border rounded-lg divide-y">
                    {categorias.map(cat => {
                      const campos = (Object.keys(resultado.dados) as CampoAdmissao[]).filter(
                        c => CATEGORIA_CAMPO[c] === cat
                      );
                      if (campos.length === 0) return null;
                      return (
                        <div key={cat} className="p-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{cat}</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            {campos.map(c => (
                              <div key={c} className="flex justify-between gap-2">
                                <span className="text-gray-500">{LABEL_CAMPO_ADMISSAO[c]}</span>
                                <span className="font-medium text-right">{resultado.dados[c]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleImportar}
                    disabled={!resultado.valido || enviando}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg disabled:bg-gray-300 flex items-center justify-center gap-2"
                  >
                    {enviando ? 'Importando...' : 'Confirmar Importação'}
                  </button>
                </div>
              )}
            </>
          )}

          {sucesso && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-medium text-gray-800">Admissão importada com sucesso!</p>
              <p className="text-sm text-gray-500 mt-1">
                A movimentação foi criada e as equipes responsáveis já podem preencher o checklist de documentos.
              </p>
              <button onClick={onClose} className="mt-4 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm">
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
