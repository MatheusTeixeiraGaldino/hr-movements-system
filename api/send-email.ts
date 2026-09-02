import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('GMAIL_USER e/ou GMAIL_APP_PASSWORD não configurados.');
  return nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });
}

function getAppUrl() { return process.env.APP_URL || 'https://movimentacoes-trabalhista.vercel.app'; }

function baseTemplate(corpo: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222;font-size:14px;line-height:1.6;"><div style="border-top:4px solid #4f46e5;padding-top:18px;">${corpo}</div><p style="margin-top:28px;padding-top:12px;border-top:1px solid #eee;font-size:12px;color:#999;">Este é um email automático do sistema de Movimentações Trabalhistas. Não responda a este email.</p></div>`;
}

function linhaCampo(label: string, valor: string) {
  return `<p style="margin:2px 0;"><strong>${label}:</strong> ${valor}</p>`;
}

function rodape() {
  return `<p style="margin-top:18px;">Acesse pelo link: <a href="${getAppUrl()}" style="color:#4f46e5;text-decoration:underline;">Movimentações trabalhistas</a></p><p style="margin-top:18px;">Atenciosamente,<br/>Departamento Pessoal</p>`;
}

function formatarData(data?: string) {
  if (!data) return '—';
  try { return new Date(data.includes('T') ? data : data + 'T00:00:00').toLocaleDateString('pt-BR'); } catch { return data; }
}

const TIPO_LABEL: Record<string, string> = { admissao: 'Admissão', demissao: 'Demissão', transferencia: 'Transferência', alteracao: 'Alteração de Dados', promocao: 'Promoção' };
const FRASE_FECHAMENTO: Record<string, string> = {
  admissao: 'Solicitamos a validação e execução das ações necessárias conforme o fluxo estabelecido.',
  demissao: 'Solicitamos a validação e execução das ações necessárias conforme o fluxo estabelecido.',
  transferencia: 'Solicitamos a validação e execução das ações necessárias conforme o fluxo estabelecido.',
  alteracao: 'Solicitamos a atualização das informações nos sistemas e processos sob sua responsabilidade.',
  promocao: 'Solicitamos a adoção das providências necessárias para efetivação da promoção.',
};

function montarCampos(movement: any) {
  switch (movement.type) {
    case 'admissao': return (movement.dadosContratacao || []).map((c: any) => linhaCampo(c.label, c.valor || '—')).join('');
    case 'demissao': return [linhaCampo('Data do Desligamento', formatarData(movement.dismissalDate)), linhaCampo('Data Limite', formatarData(movement.deadline))].join('');
    default: return [linhaCampo('Setor Atual', movement.oldSector || '—'), linhaCampo('Setor Destino', movement.newSector || '—'), linhaCampo('Data da Mudança', formatarData(movement.changeDate)), linhaCampo('Função Atual', movement.oldPosition || '—'), linhaCampo('Função Destino', movement.newPosition || '—')].join('');
  }
}

async function enviar(recipients: any[], assunto: string, html: string) {
  const fromName = process.env.GMAIL_FROM_NAME || 'RH Movimentações';
  const fromEmail = process.env.GMAIL_USER;
  const t = getTransporter();
  const resultados = await Promise.allSettled(recipients.map(r => t.sendMail({ from: `"${fromName}" <${fromEmail}>`, to: r.email, subject: assunto, html })));
  const falhas = resultados.filter(r => r.status === 'rejected');
  return { success: falhas.length === 0, enviados: resultados.length - falhas.length, falhas: falhas.length, erros: falhas.map(f => (f as PromiseRejectedResult).reason?.message || 'erro') };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  try {
    const { action, movement, recipients, updated_by } = req.body;
    if (!movement || !recipients?.length) return res.status(400).json({ success: false, error: 'movement e recipients são obrigatórios' });

    const tipoLabel = TIPO_LABEL[movement.type] || movement.type;
    const frase = FRASE_FECHAMENTO[movement.type] || FRASE_FECHAMENTO.demissao;

    if (action === 'movement_created') {
      const corpo = `<p>Prezados,</p><p>Informamos que foi cadastrada uma solicitação de ${tipoLabel} no sistema.</p><p style="margin-bottom:6px;"><strong>Dados da movimentação:</strong></p>${linhaCampo('Funcionário', movement.employee_name)}${montarCampos(movement)}<p style="margin-top:16px;">${frase}</p>${rodape()}`;
      const resultado = await enviar(recipients, `${tipoLabel} Cadastrada no Sistema - ${movement.employee_name}`, baseTemplate(corpo));
      return res.status(200).json(resultado);
    }

    if (action === 'movement_updated') {
      const corpo = `<p>Prezados,</p><p>Informamos que o parecer de uma movimentação de ${tipoLabel} foi atualizado no sistema por <strong>${updated_by || 'Alguém'}</strong>.</p><p style="margin-bottom:6px;"><strong>Dados da movimentação:</strong></p>${linhaCampo('Funcionário', movement.employee_name)}${linhaCampo('Atualizado por', updated_by || '—')}${rodape()}`;
      const resultado = await enviar(recipients, `Parecer Atualizado no Sistema - ${movement.employee_name}`, baseTemplate(corpo));
      return res.status(200).json(resultado);
    }

    return res.status(400).json({ success: false, error: `action desconhecida: ${action}` });
  } catch (error: any) {
    console.error('Erro send-email:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
