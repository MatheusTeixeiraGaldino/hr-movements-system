import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2, Download, Eye, EyeOff } from 'lucide-react';
import { useAttendanceAnalysis } from '../hooks/useAttendanceAnalysis';
import { ExtractedAttendanceData, AttendanceRecord } from '../types/attendance-record';
import { supabase } from '../lib/supabase';

interface AttendanceAnalysisViewProps {
  userId: string;
  userName: string;
}

interface HistoryRecord extends AttendanceRecord {
  user_name?: string;
}

export default function AttendanceAnalysisView({ userId, userName }: AttendanceAnalysisViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

  const { loading, error, extractedData, record, analyzeImage, reset } = useAttendanceAnalysis();

  // Carregar histórico de fichas processadas
  useEffect(() => {
    loadHistory();
  }, [userId]);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const { data, error: fetchError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setHistory(data || []);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      alert('Por favor, selecione uma imagem');
      return;
    }

    await analyzeImage(selectedFile, userId);
  };

  const handleReset = () => {
    reset();
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadCSV = () => {
    if (!extractedData) return;

    const csv = [
      ['Campo', 'Valor'],
      ['Nome', extractedData.nome],
      ['Função', extractedData.funcao],
      ['Setor', extractedData.setor],
      ['Data', extractedData.data],
      ['Entrada', extractedData.entrada],
      ['Saída Ref.', extractedData.saida_ref],
      ['Ent. Ref.', extractedData.ent_ref],
      ['Saída', extractedData.saida],
      ['Motivo da Ocorrência', extractedData.motivo_ocorrencia],
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ficha_abono_${extractedData.data?.replace(/\//g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Análise de Fichas de Abono de Ponto</h1>
          <p className="text-slate-600">Envie uma imagem da ficha para análise automática e extração de dados</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal - Upload e Resultados */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card de Upload */}
            <div className="bg-white rounded-lg shadow-md p-8 border-2 border-dashed border-slate-200 hover:border-blue-400 transition">
              {!preview ? (
                <div
                  className="text-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-slate-900 mb-1">Clique para enviar uma imagem</p>
                  <p className="text-sm text-slate-500 mb-4">ou arraste e solte aqui</p>
                  <p className="text-xs text-slate-400">PNG, JPG, JPEG até 10MB</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    {!extractedData && (
                      <button
                        onClick={() => {
                          setPreview(null);
                          setSelectedFile(null);
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {!extractedData && (
                    <button
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-400 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Analisar Imagem
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Erro na análise</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Resultados da Análise */}
            {extractedData && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-white" />
                  <div>
                    <h2 className="text-xl font-bold text-white">Análise Concluída</h2>
                    <p className="text-green-100 text-sm">Dados extraídos com sucesso</p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Grid de Dados */}
                  <div className="grid grid-cols-2 gap-4">
                    <DataField label="Nome" value={extractedData.nome} />
                    <DataField label="Função" value={extractedData.funcao} />
                    <DataField label="Setor" value={extractedData.setor} />
                    <DataField label="Data" value={extractedData.data} />
                    <DataField label="Entrada" value={extractedData.entrada} />
                    <DataField label="Saída Ref." value={extractedData.saida_ref} />
                    <DataField label="Ent. Ref." value={extractedData.ent_ref} />
                    <DataField label="Saída" value={extractedData.saida} />
                  </div>

                  {/* Motivo da Ocorrência - Full Width */}
                  <div className="col-span-2 bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Motivo da Ocorrência</p>
                    <p className="text-slate-900 font-medium">{extractedData.motivo_ocorrencia}</p>
                  </div>

                  {/* Assinaturas */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${extractedData.assinatura_gerente === 'Sim' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-slate-700">Assinatura Gerente: {extractedData.assinatura_gerente}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${extractedData.assinatura_funcionario === 'Sim' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-slate-700">Assinatura Funcionário: {extractedData.assinatura_funcionario}</span>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="bg-slate-50 px-6 py-4 flex gap-3">
                  <button
                    onClick={handleDownloadCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Baixar CSV
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-300 text-slate-900 rounded-lg hover:bg-slate-400 font-medium"
                  >
                    <X className="w-4 h-4" />
                    Limpar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Coluna Lateral - Histórico */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-6">
              <div className="bg-slate-100 px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Histórico</h3>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-1 hover:bg-slate-200 rounded"
                >
                  {showHistory ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {showHistory && (
                <div className="divide-y max-h-96 overflow-y-auto">
                  {loadingHistory ? (
                    <div className="p-4 text-center text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    </div>
                  ) : history.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">
                      Nenhuma ficha processada ainda
                    </div>
                  ) : (
                    history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedRecord(item)}
                        className={`w-full text-left p-3 hover:bg-slate-50 transition ${
                          selectedRecord?.id === item.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {item.extracted_data.nome}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(item.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.extracted_data.data}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Detalhes do Registro Selecionado */}
              {selectedRecord && showHistory && (
                <div className="p-4 bg-blue-50 border-t border-blue-200">
                  <h4 className="font-semibold text-slate-900 mb-3 text-sm">Detalhes</h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-slate-600">Nome</p>
                      <p className="text-slate-900 font-medium">{selectedRecord.extracted_data.nome}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Data</p>
                      <p className="text-slate-900 font-medium">{selectedRecord.extracted_data.data}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Motivo</p>
                      <p className="text-slate-900 font-medium truncate">
                        {selectedRecord.extracted_data.motivo_ocorrencia}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para exibir campos de dados
function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs font-semibold text-slate-600 mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value || 'N/A'}</p>
    </div>
  );
}
