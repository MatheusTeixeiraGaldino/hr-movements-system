// api/_lib/mailer.ts
// Módulo compartilhado de envio de email via SMTP do Gmail.
// Templates seguem exatamente os modelos definidos em MODELOS_EMAILS.docx.
//
// Credenciais vêm de variáveis de ambiente (nunca hardcoded):
//   GMAIL_USER          -> o endereço Gmail remetente
//   GMAIL_APP_PASSWORD  -> a senha de app de 16 caracteres (NÃO a senha da conta)
//   GMAIL_FROM_NAME     -> (opcional) nome de exibição do remetente
//   APP_URL             -> (opcional) URL do sistema, usado no link "Acesse pelo link"

import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      'GMAIL_USER e/ou GMAIL_APP_PASSWORD não configurados nas variáveis de ambiente.'
    );
  }

  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  return transporter;
}

export interface EmailRecipient {
  email: string;
  name: string;
  team_name?: string;
}

export interface CampoDado {
  label: string;
  valor: string;
}

export interface MovementInfo {
  employee_name: string;
  type: string; // 'admissao' | 'demissao' | 'transferencia' | 'alteracao' | 'promocao'
  created_by?: string;
  deadline?: string;

  // Demissão
  dismissalDate?: string;

  // Transferência / Alteração / Promoção
  oldSector?: string;
  newSector?: string;
  oldPosition?: string;
  newPosition?: string;
  changeDate?: string;

  // Admissão — lista livre de campos (Empresa, Data de Início, Líder, Função, etc.)
  dadosContratacao?: CampoDado[];
}

const TIPO_LABEL: Record<string, string> = {
  admissao: 'Admissão',
  demissao: 'Demissão',
  transferencia: 'Transferência',
  alteracao: 'Alteração de Dados',
  promocao: 'Promoção',
};

// Frase de fechamento — exatamente como em MODELOS_EMAILS.docx (varia só na Alteração)
const FRASE_FECHAMENTO: Record<string, string> = {
  admissao: 'Solicitamos a validação e execução das ações necessárias conforme o fluxo estabelecido.',
  demissao: 'Solicitamos a validação e execução das ações necessárias conforme o fluxo estabelecido.',
  transferencia: 'Solicitamos a validação e execução das ações necessárias conforme o fluxo estabelecido.',
  alteracao: 'Solicitamos a atualização das informações nos sistemas e processos sob sua responsabilidade.',
  promocao: 'Solicitamos a adoção das providências necessárias para efetivação da promoção.',
};

function formatarData(data?: string): string {
  if (!data) return '—';
  try {
    // aceita tanto 'YYYY-MM-DD' quanto ISO completo
    const d = data.includes('T') ? new Date(data) : new Date(data + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
  } catch {
    return data;
  }
}

function getAppUrl(): string {
  return process.env.APP_URL || 'https://movimentacoes-trabalhista.vercel.app';
}

// ============================================================
// Layout base — estilo carta formal, simples, igual ao modelo do docx
// (sem cards coloridos/gradiente; só uma linha de destaque no topo)
// ============================================================
function baseTemplate(corpoHtml: string): string {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; color: #222; font-size: 14px; line-height: 1.6;">
    <div style="border-top: 4px solid #4f46e5; padding-top: 18px;">
      ${corpoHtml}
    </div>
    <p style="margin-top: 28px; padding-top: 12px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
      Este é um email automático do sistema de Movimentações Trabalhistas. Não responda a este email.
    </p>
  </div>`;
}

function linhaCampo(label: string, valor: string): string {
  return `<p style="margin: 2px 0;"><strong>${label}:</strong> ${valor}</p>`;
}

function rodapeComLink(): string {
  return `
    <p style="margin-top: 18px;">Acesse pelo link: <a href="${getAppUrl()}" style="color: #4f46e5; text-decoration: underline;">Movimentações trabalhistas</a></p>
    <p style="margin-top: 18px;">Atenciosamente,<br/>Departamento Pessoal</p>`;
}

function montarCamposMovimentacao(movement: MovementInfo): string {
  switch (movement.type) {
    case 'admissao':
      return (movement.dadosContratacao || [])
        .map(c => linhaCampo(c.label, c.valor || '—'))
        .join('');
    case 'demissao':
      return [
        linhaCampo('Data do Desligamento', formatarData(movement.dismissalDate)),
        linhaCampo('Data Limite', formatarData(movement.deadline)),
      ].join('');
    case 'transferencia':
    case 'alteracao':
    case 'promocao':
    default:
      return [
        linhaCampo('Setor Atual', movement.oldSector || '—'),
        linhaCampo('Setor Destino', movement.newSector || '—'),
        linhaCampo('Data da Mudança', formatarData(movement.changeDate)),
        linhaCampo('Função Atual', movement.oldPosition || '—'),
        linhaCampo('Função Destino', movement.newPosition || '—'),
      ].join('');
  }
}

// ============================================================
// Email de CRIAÇÃO — segue exatamente os 5 modelos do docx
// ============================================================
export async function enviarEmailCriacao(recipients: EmailRecipient[], movement: MovementInfo) {
  const tipoLabel = TIPO_LABEL[movement.type] || movement.type;
  const fraseFechamento = FRASE_FECHAMENTO[movement.type] || FRASE_FECHAMENTO.demissao;

  const corpo = `
    <p>Prezados,</p>
    <p>Informamos que foi cadastrada uma solicitação de ${tipoLabel} no sistema.</p>
    <p style="margin-bottom: 6px;"><strong>Dados da movimentação:</strong></p>
    ${linhaCampo('Funcionário', movement.employee_name)}
    ${montarCamposMovimentacao(movement)}
    <p style="margin-top: 16px;">${fraseFechamento}</p>
    ${rodapeComLink()}
  `;

  const html = baseTemplate(corpo);
  const assunto = `${tipoLabel} Cadastrada no Sistema - ${movement.employee_name}`;
  return enviarParaTodos(recipients, assunto, html);
}

// ============================================================
// Email de ATUALIZAÇÃO — mesmo estilo visual, não tinha modelo
// específico no docx (só cobria criação), texto adaptado com o
// mesmo tom formal.
// ============================================================
export async function enviarEmailAtualizacao(recipients: EmailRecipient[], movement: MovementInfo, updatedBy: string) {
  const tipoLabel = TIPO_LABEL[movement.type] || movement.type;

  const corpo = `
    <p>Prezados,</p>
    <p>Informamos que o parecer de uma movimentação de ${tipoLabel} foi atualizado no sistema por <strong>${updatedBy}</strong>.</p>
    <p style="margin-bottom: 6px;"><strong>Dados da movimentação:</strong></p>
    ${linhaCampo('Funcionário', movement.employee_name)}
    ${linhaCampo('Atualizado por', updatedBy)}
    ${rodapeComLink()}
  `;

  const html = baseTemplate(corpo);
  const assunto = `Parecer Atualizado no Sistema - ${movement.employee_name}`;
  return enviarParaTodos(recipients, assunto, html);
}

// ============================================================
// Email de LEMBRETE de prazo (check-deadlines.ts, diário)
// ============================================================
export async function enviarEmailLembrete(recipients: EmailRecipient[], movement: MovementInfo, daysRemaining: number) {
  const tipoLabel = TIPO_LABEL[movement.type] || movement.type;
  const urgente = daysRemaining <= 1;

  const corpo = `
    <p>Prezados,</p>
    <p>
      ${urgente ? '⚠️ O prazo vence <strong>hoje ou amanhã</strong>!' : `Faltam <strong>${daysRemaining} dia(s)</strong> para o prazo.`}
      Sua equipe ainda não enviou o parecer desta movimentação de ${tipoLabel}.
    </p>
    <p style="margin-bottom: 6px;"><strong>Dados da movimentação:</strong></p>
    ${linhaCampo('Funcionário', movement.employee_name)}
    ${linhaCampo('Prazo', formatarData(movement.deadline))}
    ${rodapeComLink()}
  `;

  const html = baseTemplate(corpo);
  const assunto = `Lembrete de prazo: ${movement.employee_name} — ${daysRemaining} dia(s) restante(s)`;
  return enviarParaTodos(recipients, assunto, html);
}

// ============================================================
// Email de RESUMO SEMANAL (toda terça 08h) — uma mensagem por
// destinatário, listando todas as movimentações que ainda
// aguardam a validação daquela pessoa/equipe.
// ============================================================
export interface ItemPendente {
  tipo: string;
  nome: string;
}

export async function enviarEmailResumoSemanal(
  recipient: EmailRecipient,
  itens: ItemPendente[]
) {
  if (itens.length === 0) return { success: true, enviados: 0, falhas: 0, erros: [] };

  const linhas = itens
    .map(
      item => `
      <div style="margin: 10px 0; padding: 10px 14px; background: #f7f7fb; border-left: 3px solid #4f46e5; border-radius: 4px;">
        <p style="margin: 0;"><strong>Tipo de Movimentação:</strong> ${item.tipo}</p>
        <p style="margin: 0;"><strong>Nome Colaborador:</strong> ${item.nome}</p>
      </div>`
    )
    .join('');

  const corpo = `
    <p>Olá,</p>
    <p>Visualizamos que as movimentações abaixo ainda aguardam sua validação:</p>
    ${linhas}
    ${rodapeComLink()}
  `;

  const html = baseTemplate(corpo);
  const assunto = `Resumo semanal — ${itens.length} movimentação(ões) pendente(s) de validação`;
  return enviarParaTodos([recipient], assunto, html);
}

async function enviarParaTodos(recipients: EmailRecipient[], assunto: string, html: string) {
  const fromName = process.env.GMAIL_FROM_NAME || 'RH Movimentações';
  const fromEmail = process.env.GMAIL_USER;
  const t = getTransporter();

  const resultados = await Promise.allSettled(
    recipients.map(r =>
      t.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: r.email,
        subject: assunto,
        html,
      })
    )
  );

  const falhas = resultados.filter(r => r.status === 'rejected');
  return {
    success: falhas.length === 0,
    enviados: resultados.length - falhas.length,
    falhas: falhas.length,
    erros: falhas.map(f => (f as PromiseRejectedResult).reason?.message || 'erro desconhecido'),
  };
}
