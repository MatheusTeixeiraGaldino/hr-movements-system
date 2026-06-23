/**
 * Tipos para o sistema de análise de fichas de abono de ponto
 */

export interface ExtractedAttendanceData {
  nome: string;
  funcao: string;
  setor: string;
  data: string;
  entrada: string;
  saida_ref: string;
  ent_ref: string;
  saida: string;
  motivo_ocorrencia: string;
  assinatura_gerente: string;
  assinatura_funcionario: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  image_url: string;
  google_drive_id?: string;
  extracted_data: ExtractedAttendanceData;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

export interface AttendanceRecordResponse {
  success: boolean;
  data?: AttendanceRecord;
  error?: string;
  message?: string;
}
