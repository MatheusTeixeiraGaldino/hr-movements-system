import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY);

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

export async function sendMovementCreatedEmail(
  recipients: EmailRecipient[],
  movement: Movement
) {
  const promises = recipients.map(recipient => 
    resend.emails.send({
      from: 'RH Movimentações <noreply@seudominio.com>',
      to: recipient.email,
      subject: `🆕 Nova Movimentação: ${movement.employee_name} - ${MOVEMENT_TYPE_LABELS[movement.type]}`,
      html: getCreatedEmailTemplate(recipient, movement),
    })
  );

  return Promise.allSettled(promises);
}

export async function sendMovementUpdatedEmail(
  recipients: EmailRecipient[],
  movement: Movement,
  updatedBy: string
) {
  const promises = recipients.map(recipient =>
    resend.emails.send({
      from: 'RH Movimentações <noreply@seudominio.com>',
      to: recipient.email,
      subject: `📝 Movimentação Atualizada: ${movement.employee_name}`,
      html: getUpdatedEmailTemplate(recipient, movement, updatedBy),
    })
  );

  return Promise.allSettled(promises);
}

export async function sendDeadlineReminderEmail(
  recipients: EmailRecipient[],
  movement: Movement,
  daysRemaining: number
) {
  const urgencyEmoji = daysRemaining === 1 ? '🚨' : daysRemaining === 2 ? '⚠️' : '⏰';
  const urgencyText = daysRemaining === 1 ? 'CRÍTICO' : daysRemaining === 2 ? 'URGENTE' : 'LEMBRETE';
  
  const promises = recipients.map(recipient =>
    resend.emails.send({
      from: 'RH Movimentações <noreply@seudominio.com>',
      to: recipient.email,
      subject: `${urgencyEmoji} ${urgencyText}: ${daysRemaining} dia(s) para prazo - ${movement.employee_name}`,
      html: getReminderEmailTemplate(recipient, movement, daysRemaining),
    })
  );

  return Promise.allSettled(promises);
}

function getCreatedEmailTemplate(recipient: EmailRecipient, movement: Movement): string {
  const deadlineHTML = movement.deadline 
    ? `<p><strong>⏰ Prazo Limite:</strong> ${new Date(movement.deadline).toLocaleDateString('pt-BR')}</p>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #2563eb; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🆕 Nova Movimentação Criada</h1>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
                Olá, <strong>${recipient.name}</strong>!
              </p>
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 30px 0;">
                Uma nova movimentação foi criada e requer parecer da equipe <strong>${recipient.team_name}</strong>.
              </p>
            </td>
          </tr>
          
          <!-- Movement Info -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">📋 Informações da Movimentação</h3>
                    <p style="margin: 5px 0; font-size: 14px; color: #374151;">
                      <strong>Colaborador:</strong> ${movement.employee_name}
                    </p>
                    <p style="margin: 5px 0; font-size: 14px; color: #374151;">
                      <strong>Tipo:</strong> ${MOVEMENT_TYPE_LABELS[movement.type]}
                    </p>
                    <p style="margin: 5px 0; font-size: 14px; color: #374151;">
                      <strong>Criado por:</strong> ${movement.created_by}
                    </p>
                    ${deadlineHTML}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Warning Box -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 15px;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                      <strong>⚠️ Atenção:</strong> Sua equipe precisa fornecer um parecer sobre esta movimentação.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <a href="https://seu-sistema.vercel.app" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                📋 Acessar Sistema
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                Sistema de Movimentações RH
              </p>
              <p style="margin: 5px 0 0 0; font-size: 11px; color: #9ca3af;">
                Este é um email automático, não responda.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function getUpdatedEmailTemplate(recipient: EmailRecipient, movement: Movement, updatedBy: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #0891b2; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📝 Movimentação Atualizada</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 16px; color: #374151;">Olá, <strong>${recipient.name}</strong>!</p>
              <p style="font-size: 14px; color: #6b7280;">
                A movimentação de <strong>${movement.employee_name}</strong> foi atualizada por <strong>${updatedBy}</strong>.
              </p>
              <p style="font-size: 14px; color: #6b7280;">
                Por favor, revise as alterações no sistema.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <a href="https://seu-sistema.vercel.app" style="display: inline-block; background-color: #0891b2; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                🔍 Ver Alterações
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function getReminderEmailTemplate(recipient: EmailRecipient, movement: Movement, daysRemaining: number): string {
  const bgColor = daysRemaining === 1 ? '#dc2626' : daysRemaining === 2 ? '#ea580c' : '#f59e0b';
  const urgencyText = daysRemaining === 1 ? '🚨 CRÍTICO' : daysRemaining === 2 ? '⚠️ URGENTE' : '⏰ ATENÇÃO';
  
  return `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 3px solid ${bgColor};">
          <tr>
            <td style="background-color: ${bgColor}; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${urgencyText}</h1>
              <h2 style="color: #ffffff; margin: 10px 0 0 0; font-size: 20px;">Faltam ${daysRemaining} dia(s) para o prazo!</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 16px; color: #374151;">Olá, <strong>${recipient.name}</strong>!</p>
              <p style="font-size: 14px; color: #6b7280;">
                A movimentação de <strong>${movement.employee_name}</strong> está próxima do prazo limite e sua equipe <strong>${recipient.team_name}</strong> ainda não forneceu parecer.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px;">
              <table width="100%" cellpadding="15" style="background-color: #fee2e2; border-radius: 8px; border: 2px solid ${bgColor};">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 14px; color: #7f1d1d;">
                      <strong>Colaborador:</strong> ${movement.employee_name}<br>
                      <strong>Tipo:</strong> ${MOVEMENT_TYPE_LABELS[movement.type]}<br>
                      <strong>Prazo Final:</strong> ${movement.deadline ? new Date(movement.deadline).toLocaleDateString('pt-BR') : 'Não definido'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; text-align: center;">
              <a href="https://seu-sistema.vercel.app" style="display: inline-block; background-color: ${bgColor}; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 18px;">
                🚀 RESPONDER AGORA
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
