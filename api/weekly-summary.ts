// api/weekly-summary.ts
// Roda toda terça-feira às 08h (horário de Brasília) — ver vercel.json.
// Manda, para cada usuário, um único email listando todas as
// movimentações (de qualquer tipo, incluindo Admissão) que ainda
// aguardam o parecer da equipe dele.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enviarEmailResumoSemanal, ItemPendente } from './_lib/mailer';
import { CHECKLIST_REGRAS_ADMISSAO, statusChecklistEquipe } from '../src/types/admissao';

const TIPO_LABEL: Record<string, string> = {
  admissao: 'Admissão',
  demissao: 'Demissão',
  transferencia: 'Transferência',
  alteracao: 'Alteração de Dados',
  promocao: 'Promoção',
};

// Mesmo mapa usado em useAdmissao.ts — equipe (nome) -> team_id
const TEAM_NAME_TO_ID: Record<string, string> = {
  'Recursos Humanos': 'rh',
  'Ponto': 'ponto',
  'Transporte': 'transporte',
  'T.I': 'ti',
  'Benefícios': 'beneficios',
  'Comunicação': 'comunicacao',
  'Segurança do Trabalho': 'seguranca',
  'Ambulatório': 'ambulatorio',
  'Financeiro': 'financeiro',
  'DP': 'dp',
  'Treinamento e Desenvolvimento': 'treinamento',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'your-secret-key'}`;
  if (authHeader !== expectedAuth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://npvemrhimzlspgutwpje.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseKey) throw new Error('Supabase key not configured');

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    };

    // team_id -> [{tipo, nome}]  (acumulador antes de saber os emails de cada equipe)
    const pendenciasPorTeamId: Record<string, ItemPendente[]> = {};

    function adicionarPendencia(teamId: string, tipo: string, nome: string) {
      if (!pendenciasPorTeamId[teamId]) pendenciasPorTeamId[teamId] = [];
      pendenciasPorTeamId[teamId].push({ tipo, nome });
    }

    // 1) Demissão / Transferência / Alteração / Promoção
    const movResp = await fetch(
      `${supabaseUrl}/rest/v1/movements?status=neq.completed&type=neq.admissao&cancelamento=is.null&select=*`,
      { headers }
    );
    const movements = await movResp.json();

    for (const mov of movements || []) {
      const pendingTeams: string[] = (mov.selected_teams || []).filter(
        (teamId: string) => mov.responses?.[teamId]?.status !== 'completed'
      );
      for (const teamId of pendingTeams) {
        adicionarPendencia(teamId, TIPO_LABEL[mov.type] || mov.type, mov.employee_name);
      }
    }

    // 2) Admissão (modelo de dados diferente: precisa olhar o checklist por equipe)
    const admResp = await fetch(
      `${supabaseUrl}/rest/v1/acompanhamento_admissao?status=neq.concluido&select=*,movements(employee_name,cancelamento)`,
      { headers }
    );
    const admissoes = await admResp.json();

    for (const adm of admissoes || []) {
      if (!adm.movements || adm.movements.cancelamento) continue; // ignora admissão cancelada
      const equipes = Array.from(new Set(CHECKLIST_REGRAS_ADMISSAO.map(r => r.equipe)));
      for (const equipe of equipes) {
        const status = statusChecklistEquipe(adm.checklist || [], equipe, adm.observacoes_equipe?.[equipe] || '');
        if (status !== 'completo') {
          const teamId = TEAM_NAME_TO_ID[equipe];
          if (teamId) adicionarPendencia(teamId, 'Admissão', adm.movements.employee_name);
        }
      }
    }

    const teamIdsComPendencia = Object.keys(pendenciasPorTeamId);
    if (teamIdsComPendencia.length === 0) {
      return res.status(200).json({ success: true, message: 'Nenhuma pendência encontrada.', usuarios_notificados: 0 });
    }

    // 3) Buscar todos os usuários e expandir: usuário -> lista de pendências (somando todas as equipes dele)
    const usersResp = await fetch(`${supabaseUrl}/rest/v1/users?select=email,name,team_ids`, { headers });
    const allUsers = await usersResp.json();

    let usuariosNotificados = 0;
    let falhasEnvio = 0;

    for (const user of allUsers || []) {
      if (!user.team_ids || !Array.isArray(user.team_ids)) continue;

      const itensDoUsuario: ItemPendente[] = [];
      for (const teamId of user.team_ids) {
        if (pendenciasPorTeamId[teamId]) itensDoUsuario.push(...pendenciasPorTeamId[teamId]);
      }

      if (itensDoUsuario.length === 0) continue;

      // remove duplicados (mesmo colaborador/tipo, caso o usuário esteja em 2 equipes com a mesma pendência)
      const vistos = new Set<string>();
      const itensUnicos = itensDoUsuario.filter(i => {
        const chave = `${i.tipo}::${i.nome}`;
        if (vistos.has(chave)) return false;
        vistos.add(chave);
        return true;
      });

      const resultado = await enviarEmailResumoSemanal({ email: user.email, name: user.name }, itensUnicos);
      if (resultado.success) usuariosNotificados++; else falhasEnvio++;
    }

    return res.status(200).json({
      success: true,
      message: `${usuariosNotificados} usuário(s) notificado(s)${falhasEnvio > 0 ? `, ${falhasEnvio} falha(s)` : ''}`,
      usuarios_notificados: usuariosNotificados,
      falhas: falhasEnvio,
    });
  } catch (error: any) {
    console.error('Erro no resumo semanal:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
