// src/lib/emailService.ts
// Serviço de envio de emails — chama a rota serverless /api/send-email,
// que manda pelo SMTP do Gmail usando os modelos definidos em
// MODELOS_EMAILS.docx. (Antes ia direto pro Make.com; SMTP não pode ser
// feito direto do navegador, por isso essa rota intermediária existe.)

export interface EmailRecipient {
  email: string;
  name: string;
  team_name?: string;
}

export interface CampoDado {
  label: string;
  valor: string;
}

export interface MovementForEmail {
  employee_name: string;
  type: string; // 'admissao' | 'demissao' | 'transferencia' | 'alteracao' | 'promocao'
  created_by?: string;
  deadline?: string;
  dismissalDate?: string;
  oldSector?: string;
  newSector?: string;
  oldPosition?: string;
  newPosition?: string;
  changeDate?: string;
  dadosContratacao?: CampoDado[];
}

async function chamarSendEmail(payload: any) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);
    return { success: response.ok && data?.success !== false, ...data };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return { success: false, error };
  }
}

export async function sendMovementCreatedEmail(
  recipients: EmailRecipient[],
  movement: MovementForEmail
) {
  return chamarSendEmail({ action: 'movement_created', movement, recipients });
}

export async function sendMovementUpdatedEmail(
  recipients: EmailRecipient[],
  movement: MovementForEmail,
  updatedBy: string
) {
  return chamarSendEmail({ action: 'movement_updated', movement, recipients, updated_by: updatedBy });
}
