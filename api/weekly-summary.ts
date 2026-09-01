// api/weekly-summary.ts
// Roda toda terça-feira às 08h (horário de Brasília) — ver vercel.json.
// Manda, para cada usuário, um único email listando todas as
// movimentações (de qualquer tipo, incluindo Admissão) que ainda
// aguardam o parecer da equipe dele.
//
// IMPORTANTE: este arquivo é 100% autocontido (não importa nada de
// fora da pasta api/) de propósito — importar de src/ pode falhar
// silenciosamente no empacotamento das funções serverless da Vercel.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enviarEmailResumoSemanal, ItemPendente } from './_lib/mailer';

const TIPO_LABEL: Record<string, string> = {
  admissao: 'Admissão',
  demissao: 'Demissão',
  transferencia: 'Transferência',
  alteracao: 'Alteração de Dados',
  promocao: 'Promoção',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authHeader = req.headers.authorization;
    const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'your-secret-key'}`;
    if (authHeader !== expectedAuth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || 'https://npvemrhimzlspgutwpje.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'SUPABASE_SERVICE_KEY (ou SUPABASE_ANON_KEY) não configurada nas variáveis de ambiente da Vercel.',
      });
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    };

    async function supaGet(path: string) {
      const resp = await fetch(`${supabaseUrl}/rest/v1/${path}`, { headers });
      if (!resp.ok) {
        const texto = await resp.text().catch(() => '');
        throw new Error(`Supabase ${path} -> ${resp.status}: ${texto}`);
      }
      return resp.json();
    }

    // team_id -> [{tipo, nome}]  (acumulador antes de saber os emails de cada equipe)
    const pendenciasPorTeamId: Record<string, ItemPendente[]> = {};
    function adicionarPendencia(teamId: string, tipo: string, nome: string) {
      if (!pendenciasPorTeamId[teamId]) pendenciasPorTeamId[teamId] = [];
      pendenciasPorTeamId[teamId].push({ tipo, nome });
    }

    // 1) Demissão / Transferência / Alteração / Promoção
    const movements = await supaGet(
      'movements?status=neq.completed&type=neq.admissao&cancelamento=is.null&select=*'
    );

    for (const mov of movements || []) {
      const pendingTeams: string[] = (mov.selected_teams || []).filter(
        (teamId: string) => mov.responses?.[teamId]?.status !== 'completed'
      );
      for (const teamId of pendingTeams) {
        adicionarPendencia(teamId, TIPO_LABEL[mov.type] || mov.type, mov.employee_name);
      }
    }

    // 2) Admissão — busca os itens de checklist configurados (tabela checklist_itens,
    //    a mesma usada pela tela "Fluxos") e o estado salvo em cada admissão,
    //    para decidir quais equipes ainda estão pendentes.
    const itensAdmissao = await supaGet(
      "checklist_itens?movement_type=eq.admissao&ativo=eq.true&select=id,team_id,obrigatorio,alternativas,exige_observacao_se_pendente,tipo_campo"
    );

    const itensPorEquipe: Record<string, any[]> = {};
    for (const item of itensAdmissao || []) {
      if (!itensPorEquipe[item.team_id]) itensPorEquipe[item.team_id] = [];
      itensPorEquipe[item.team_id].push(item);
    }

    if (Object.keys(itensPorEquipe).length > 0) {
      const admissoes = await supaGet(
        'acompanhamento_admissao?status=neq.concluido&select=checklist,movimento_id,movements(employee_name,cancelamento)'
      );

      for (const adm of admissoes || []) {
        const movInfo = Array.isArray(adm.movements) ? adm.movements[0] : adm.movements;
        if (!movInfo || movInfo.cancelamento) continue; // ignora admissão cancelada ou sem movimento associado

        const checklistSalvo: any[] = Array.isArray(adm.checklist) ? adm.checklist : [];

        for (const teamId of Object.keys(itensPorEquipe)) {
          const itensDaEquipe = itensPorEquipe[teamId];

          const equipeCompleta = itensDaEquipe.every(item => {
            if (!item.obrigatorio) return true;
            const resposta = checklistSalvo.find(r => r.regra_id === item.id);
            if (!resposta) return false;
            if (item.tipo_campo === 'texto') return !!resposta.valor_texto?.trim();
            if (item.exige_observacao_se_pendente) return !!resposta.marcado || !!resposta.observacao?.trim();
            if (item.alternativas && item.alternativas.length > 0) {
              return !!resposta.marcado || !!resposta.secundario_selecionado;
            }
            return !!resposta.marcado;
          });

          if (!equipeCompleta) {
            adicionarPendencia(teamId, 'Admissão', movInfo.employee_name);
          }
        }
      }
    }

    const teamIdsComPendencia = Object.keys(pendenciasPorTeamId);
    if (teamIdsComPendencia.length === 0) {
      return res.status(200).json({ success: true, message: 'Nenhuma pendência encontrada.', usuarios_notificados: 0 });
    }

    // 3) Buscar todos os usuários e expandir: usuário -> lista de pendências (somando todas as equipes dele)
    const allUsers = await supaGet('users?select=email,name,team_ids');

    let usuariosNotificados = 0;
    let falhasEnvio = 0;
    const erros: string[] = [];

    for (const user of allUsers || []) {
      if (!user.team_ids || !Array.isArray(user.team_ids)) continue;

      const itensDoUsuario: ItemPendente[] = [];
      for (const teamId of user.team_ids) {
        if (pendenciasPorTeamId[teamId]) itensDoUsuario.push(...pendenciasPorTeamId[teamId]);
      }

      if (itensDoUsuario.length === 0) continue;

      const vistos = new Set<string>();
      const itensUnicos = itensDoUsuario.filter(i => {
        const chave = `${i.tipo}::${i.nome}`;
        if (vistos.has(chave)) return false;
        vistos.add(chave);
        return true;
      });

      try {
        const resultado = await enviarEmailResumoSemanal({ email: user.email, name: user.name }, itensUnicos);
        if (resultado.success) usuariosNotificados++;
        else { falhasEnvio++; erros.push(...(resultado.erros || [])); }
      } catch (e: any) {
        falhasEnvio++;
        erros.push(e.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `${usuariosNotificados} usuário(s) notificado(s)${falhasEnvio > 0 ? `, ${falhasEnvio} falha(s)` : ''}`,
      usuarios_notificados: usuariosNotificados,
      falhas: falhasEnvio,
      erros: erros.slice(0, 5),
    });
  } catch (error: any) {
    console.error('Erro no resumo semanal:', error);
    return res.status(500).json({ success: false, error: error?.message || String(error) });
  }
}
