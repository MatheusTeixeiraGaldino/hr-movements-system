import { useState } from 'react';
import { AttendanceRecord, ExtractedAttendanceData } from '../types/attendance-record';

interface UseAttendanceAnalysisReturn {
  loading: boolean;
  error: string | null;
  extractedData: ExtractedAttendanceData | null;
  record: AttendanceRecord | null;
  analyzeImage: (file: File, userId: string) => Promise<void>;
  reset: () => void;
}

export function useAttendanceAnalysis(): UseAttendanceAnalysisReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedAttendanceData | null>(null);
  const [record, setRecord] = useState<AttendanceRecord | null>(null);

  const analyzeImage = async (file: File, userId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Validar arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo deve ser uma imagem');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('A imagem não pode ter mais de 10MB');
      }

      // Converter arquivo para base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(file);
      const imageBase64 = await base64Promise;

      // Chamar API de análise
      const response = await fetch('/api/analyze-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: imageBase64,
          file_name: file.name,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao analisar imagem');
      }

      const result = await response.json();
      setExtractedData(result.data.extracted_data);
      setRecord({
        id: result.data.id,
        user_id: userId,
        image_url: result.data.image_url,
        google_drive_id: result.data.google_drive_id,
        extracted_data: result.data.extracted_data,
        processing_status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Error analyzing image:', err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setExtractedData(null);
    setRecord(null);
  };

  return {
    loading,
    error,
    extractedData,
    record,
    analyzeImage,
    reset,
  };
}
