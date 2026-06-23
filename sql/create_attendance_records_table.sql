-- Criar tabela de registros de abono de ponto
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  google_drive_id TEXT,
  extracted_data JSONB NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Índices
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX idx_attendance_records_user_id ON attendance_records(user_id);
CREATE INDEX idx_attendance_records_created_at ON attendance_records(created_at DESC);
CREATE INDEX idx_attendance_records_processing_status ON attendance_records(processing_status);

-- Criar política de segurança em nível de linha (RLS)
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seus próprios registros
CREATE POLICY "Users can view their own attendance records"
  ON attendance_records
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem criar registros
CREATE POLICY "Users can create attendance records"
  ON attendance_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Admins podem ver todos os registros
CREATE POLICY "Admins can view all attendance records"
  ON attendance_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_attendance_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_attendance_records_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_records_updated_at();
