/**
 * API para análise de fichas de abono de ponto
 * Responsabilidades:
 * 1. Receber imagem da ficha
 * 2. Fazer upload para Google Drive
 * 3. Analisar imagem com IA (OCR/LLM)
 * 4. Extrair dados estruturados
 * 5. Salvar no Supabase
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Tipos
interface ExtractedAttendanceData {
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

interface AnalysisResponse {
  success: boolean;
  data?: {
    id: string;
    extracted_data: ExtractedAttendanceData;
    google_drive_id?: string;
    image_url: string;
  };
  error?: string;
}

// Inicializar Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para fazer upload para Google Drive
async function uploadToGoogleDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string | null> {
  try {
    const googleDriveApiKey = process.env.GOOGLE_DRIVE_API_KEY;
    const googleDriveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!googleDriveApiKey || !googleDriveFolderId) {
      console.warn('Google Drive credentials not configured');
      return null;
    }

    // Criar metadados do arquivo
    const metadata = {
      name: fileName,
      mimeType: mimeType,
      parents: [googleDriveFolderId],
    };

    // Criar FormData para upload
    const formData = new FormData();
    formData.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    formData.append('file', new Blob([fileBuffer], { type: mimeType }));

    // Upload para Google Drive
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleDriveApiKey}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Google Drive upload failed: ${response.statusText}`);
    }

    const data = await response.json() as { id: string };
    return data.id;
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    return null;
  }
}

// Função para analisar imagem com OpenAI Vision
async function analyzeImageWithAI(imageBase64: string): Promise<ExtractedAttendanceData | null> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Você é um especialista em OCR e análise de documentos. 
    
Analise a imagem da ficha de abono de ponto e extraia os seguintes dados em formato JSON:
- nome: Nome do funcionário
- funcao: Função/cargo do funcionário
- setor: Setor/departamento
- data: Data do abono (formato DD/MM/YYYY)
- entrada: Horário de entrada (formato HH:MM)
- saida_ref: Saída de referência (formato HH:MM)
- ent_ref: Entrada de referência (formato HH:MM)
- saida: Horário de saída (formato HH:MM)
- motivo_ocorrencia: Motivo da ocorrência (ex: Viagem a Trabalho, Compensação de Horas, etc)
- assinatura_gerente: "Sim" ou "Não" se há assinatura do gerente
- assinatura_funcionario: "Sim" ou "Não" se há assinatura do funcionário

Retorne APENAS o JSON, sem explicações adicionais.
Se não conseguir ler um campo, use "N/A" como valor.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json() as {
      choices: Array<{
        message: {
          content: string;
        };
      }>;
    };
    const content = data.choices[0].message.content;

    // Extrair JSON da resposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const extractedData: ExtractedAttendanceData = JSON.parse(jsonMatch[0]);
    return extractedData;
  } catch (error) {
    console.error('Error analyzing image with AI:', error);
    return null;
  }
}

// Handler principal
export default async function handler(
  req: VercelRequest,
  res: VercelResponse<AnalysisResponse>
): Promise<void> {
  // Apenas POST é permitido
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    // Obter dados da requisição
    const { image_base64, file_name, user_id } = req.body;

    if (!image_base64 || !user_id) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: image_base64, user_id',
      });
      return;
    }

    // Converter base64 para buffer
    const imageBuffer = Buffer.from(image_base64, 'base64');
    const fileName = file_name || `attendance_${Date.now()}.jpg`;

    // 1. Fazer upload para Google Drive
    const googleDriveId = await uploadToGoogleDrive(
      imageBuffer,
      fileName,
      'image/jpeg'
    );

    // 2. Analisar imagem com IA
    const extractedData = await analyzeImageWithAI(image_base64);

    if (!extractedData) {
      res.status(500).json({
        success: false,
        error: 'Failed to analyze image',
      });
      return;
    }

    // 3. Salvar no Supabase
    const { data: record, error: dbError } = await supabase
      .from('attendance_records')
      .insert({
        user_id,
        image_url: `data:image/jpeg;base64,${image_base64}`,
        google_drive_id: googleDriveId,
        extracted_data: extractedData,
        processing_status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    res.status(200).json({
      success: true,
      data: {
        id: record.id,
        extracted_data: extractedData,
        google_drive_id: googleDriveId,
        image_url: record.image_url,
      },
    });
  } catch (error) {
    console.error('Error in analyze-attendance:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
