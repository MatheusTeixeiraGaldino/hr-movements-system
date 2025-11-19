// src/lib/emailService.ts
// Serviço de envio de emails usando Resend

interface EmailRecipient {
  email: string;
  name: string;
  team_name: string;
}

interface Movement {
  employee_name: string;
  type: string;
  created_by: string;
  deadline?: string;
  selected_teams: string[];
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  demissao: 'Demissão',
  transferencia: 'Transferência',
  alteracao: 'Alteração Salarial',
  promocao: 'Promoção'
};

// Função para enviar email via webhook (Make.com ou API própria)
export async function sendMovementCreatedEmail(
  recipients: EmailRecipient[],
  movement: Movement
) {
  try {
    // Enviar para webhook que processará os emails
    const response = await fetch('https://hook.eu2.make.com/ype19l4x522ymrkbmqhm9on10szsc62v', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'movement_created',
        movement: {
          ...movement,
          movimento_tipo: MOVEMENT_TYPE_LABELS[movement.type]
        },
        recipients: recipients,
        email_type: 'created'
      })
    });

    return { success: response.ok };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return { success: false, error };
  }
}

export async function sendMovementUpdatedEmail(
  recipients: EmailRecipient[],
  movement: Movement,
  updatedBy: string
) {
  try {
    const response = await fetch('https://hook.eu2.make.com/ype19l4x522ymrkbmqhm9on10szsc62v', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'movement_updated',
        movement: {
          ...movement,
          movimento_tipo: MOVEMENT_TYPE_LABELS[movement.type]
        },
        recipients: recipients,
        updated_by: updatedBy,
        email_type: 'updated'
      })
    });

    return { success: response.ok };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return { success: false, error };
  }
}
