// api/send-email.ts
// Substitui o webhook do Make.com. Chamado pelo frontend
// (src/lib/emailService.ts) para enviar emails de criação e
// atualização de movimentações, via SMTP do Gmail.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enviarEmailCriacao, enviarEmailAtualizacao, EmailRecipient, MovementInfo } from './_lib/mailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { action, movement, recipients, updated_by } = req.body as {
      action: 'movement_created' | 'movement_updated';
      movement: MovementInfo;
      recipients: EmailRecipient[];
      updated_by?: string;
    };

    if (!movement || !recipients || recipients.length === 0) {
      return res.status(400).json({ success: false, error: 'movement e recipients são obrigatórios' });
    }

    let resultado;
    if (action === 'movement_created') {
      resultado = await enviarEmailCriacao(recipients, movement);
    } else if (action === 'movement_updated') {
      resultado = await enviarEmailAtualizacao(recipients, movement, updated_by || 'Alguém');
    } else {
      return res.status(400).json({ success: false, error: `action desconhecida: ${action}` });
    }

    return res.status(200).json(resultado);
  } catch (error: any) {
    console.error('Erro ao enviar email:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
