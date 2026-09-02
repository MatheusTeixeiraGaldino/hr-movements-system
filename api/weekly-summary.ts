import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

// ── Mailer embutido (sem import externo, evita ERR_MODULE_NOT_FOUND na Vercel) ──

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

function rodape() {
  return `<p style="margin-top:18px;">Acesse pelo link: <a href="${getAppUrl()}" style="color:#4f46e5;text-decoration:underline;">Movimentações trabalhistas</a></p><p style="margin-top:18px;">Atenciosamente,<br/>Departamento Pessoal</p>`;
}

async function enviarResumo(email: string, name: string, itens: { tipo: string; nome: string }[]) {
  if (itens.length === 0) return;
  const linhas = itens.map(i =>
    `<div style="margin:10px 0;padding:10px 14px;background:#f7f7fb;border-left:3px solid #4f46e5;border-radius:4px;"><p style="margin:0;"><strong>Tipo de Movimentação:</strong> ${i.tipo}</p><p style="margin:0;"><strong>Nome Colaborador:</strong> ${i.nome}</p></div>`
  ).join('');
  const corpo = `<p>Olá,</p><p>Visualizamos que as movimentações abaixo ainda aguardam sua validação:</p>${linhas}${rodape()}`;
  const fromName = process.env.GMAIL_FROM_NAME || 'RH Movimentações';
  const fromEmail = process.env.GMAIL_USER;
  const t = getTransporter();
  await t.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject: `Resumo semanal — ${itens.length} movimentação(ões) pendente(s) de validação`,
    html: baseTemplate(corpo),
  });
}

// ── Handler principal ──

const TIPO_LABEL: Record<string, string> = {
  admissao: 'Admissão', demissao: 'Demissão', transferencia: 'Transferência',
  alteracao: 'Alteração de Dados', promocao: 'Promoção',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'your-secret-key'}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || 'https://npvemrhimzlspgutwpje.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseKey) {
      return res.status(500).json({ success: false, error: 'Supabase key não configurada.' });
    }

    const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };
    const get = async (path: string) => {
      const r = await fetch(`${supabaseUrl}/rest/v1/${path}`, { headers: h });
      if (!r.ok) throw new Error(`Supabase ${path} -> ${r.status}: ${await r.text().catch(() => '')}`);
      return r.json();
    };

    const pendencias: Record<string, { tipo: string; nome: string }[]> = {};
    const add = (teamId: string, tipo: string, nome: string) => {
      if (!pendencias[teamId]) pendencias[teamId] = [];
      pendencias[teamId].push({ tipo, nome });
    };

    // 1) Demissão / Transferência / Alteração / Promoção
    const movements = await get('movements?status=neq.completed&type=neq.admissao&cancelamento=is.null&select=*');
    for (const mov of movements || []) {
      const pending: string[] = (mov.selected_teams || []).filter(
        (id: string) => mov.responses?.[id]?.status !== 'completed'
      );
      for (const teamId of pending) add(teamId, TIPO_LABEL[mov.type] || mov.type, mov.employee_name);
    }

    // 2) Admissão
    const itensAdm = await get('checklist_itens?movement_type=eq.admissao&ativo=eq.true&select=id,team_id,obrigatorio,alternativas,exige_observacao_se_pendente,tipo_campo');
    const itensPorEquipe: Record<string, any[]> = {};
    for (const item of itensAdm || []) {
      if (!itensPorEquipe[item.team_id]) itensPorEquipe[item.team_id] = [];
      itensPorEquipe[item.team_id].push(item);
    }

    if (Object.keys(itensPorEquipe).length > 0) {
      const admissoes = await get('acompanhamento_admissao?status=neq.concluido&select=checklist,movements(employee_name,cancelamento)');
      for (const adm of admissoes || []) {
        const mov = Array.isArray(adm.movements) ? adm.movements[0] : adm.movements;
        if (!mov || mov.cancelamento) continue;
        const checklist: any[] = Array.isArray(adm.checklist) ? adm.checklist : [];
        for (const teamId of Object.keys(itensPorEquipe)) {
          const completo = itensPorEquipe[teamId].every(item => {
            if (!item.obrigatorio) return true;
            const r = checklist.find(c => c.regra_id === item.id);
            if (!r) return false;
            if (item.tipo_campo === 'texto') return !!r.valor_texto?.trim();
            if (item.exige_observacao_se_pendente) return !!r.marcado || !!r.observacao?.trim();
            if (item.alternativas?.length) return !!r.marcado || !!r.secundario_selecionado;
            return !!r.marcado;
          });
          if (!completo) add(teamId, 'Admissão', mov.employee_name);
        }
      }
    }

    if (Object.keys(pendencias).length === 0) {
      return res.status(200).json({ success: true, message: 'Nenhuma pendência.', usuarios_notificados: 0 });
    }

    const users = await get('users?select=email,name,team_ids');
    let notificados = 0; let falhas = 0; const erros: string[] = [];

    for (const user of users || []) {
      if (!Array.isArray(user.team_ids)) continue;
      const itens: { tipo: string; nome: string }[] = [];
      for (const teamId of user.team_ids) {
        if (pendencias[teamId]) itens.push(...pendencias[teamId]);
      }
      if (itens.length === 0) continue;

      const vistos = new Set<string>();
      const unicos = itens.filter(i => { const k = `${i.tipo}::${i.nome}`; if (vistos.has(k)) return false; vistos.add(k); return true; });

      try {
        await enviarResumo(user.email, user.name, unicos);
        notificados++;
      } catch (e: any) {
        falhas++;
        erros.push(e.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `${notificados} usuário(s) notificado(s)${falhas > 0 ? `, ${falhas} falha(s)` : ''}`,
      usuarios_notificados: notificados,
      falhas,
      erros: erros.slice(0, 5),
    });
  } catch (error: any) {
    console.error('Erro weekly-summary:', error);
    return res.status(500).json({ success: false, error: error?.message || String(error) });
  }
}
