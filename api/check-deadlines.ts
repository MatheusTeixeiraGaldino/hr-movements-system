// api/check-deadlines.ts
// API Route para verificar prazos e enviar lembretes
// ATUALIZADO PARA SUPORTAR MÚLTIPLAS EQUIPES POR USUÁRIO

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verificar autenticação básica do cron
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'your-secret-key'}`;
  
  if (authHeader !== expectedAuth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Configuração do Supabase
    const supabaseUrl = process.env.SUPABASE_URL || 'https://npvemrhimzlspgutwpje.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseKey) {
      throw new Error('Supabase key not configured');
    }

    // Buscar movimentações com prazo próximo
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const response = await fetch(
      `${supabaseUrl}/rest/v1/movements?status=neq.completed&deadline=gte.${today.toISOString().split('T')[0]}&deadline=lte.${threeDaysLater.toISOString().split('T')[0]}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const movements = await response.json();
    let emailsSent = 0;
    const emailsToSend = [];

    // Processar cada movimentação
    for (const movement of movements) {
      const deadline = new Date(movement.deadline);
      deadline.setHours(0, 0, 0, 0);
      
      const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Enviar apenas se for 1, 2 ou 3 dias
      if (![1, 2, 3].includes(daysRemaining)) continue;

      // Buscar equipes que ainda não responderam
      const pendingTeams = movement.selected_teams.filter(
        (teamId: string) => movement.responses[teamId]?.status !== 'completed'
      );

      if (pendingTeams.length === 0) continue;

      // MUDANÇA: Buscar usuários usando overlaps para arrays
      const usersResponse = await fetch(
        `${supabaseUrl}/rest/v1/users?select=email,name,team_ids,team_names`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const allUsers = await usersResponse.json();

      // Filtrar usuários que pertencem às equipes pendentes
      // e expandir para criar um email por equipe
      const expandedRecipients = allUsers
        .flatMap((user: any) => {
          if (!user.team_ids || !Array.isArray(user.team_ids)) return [];
          
          return user.team_ids
            .map((teamId: string, index: number) => {
              if (pendingTeams.includes(teamId)) {
                return {
                  email: user.email,
                  name: user.name,
                  team_id: teamId,
                  team_name: user.team_names[index]
                };
              }
              return null;
            })
            .filter((item: any) => item !== null);
        });

      if (expandedRecipients.length > 0) {
        // Adicionar à lista de emails para enviar
        emailsToSend.push({
          movement,
          users: expandedRecipients,
          daysRemaining
        });
        emailsSent += expandedRecipients.length;
      }
    }

    // Enviar todos os emails via webhook do Make.com
    if (emailsToSend.length > 0) {
      await fetch('https://hook.eu2.make.com/acgp1d7grpmgeubdn2vm6fwohfs73p7w', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deadline_reminder',
          reminders: emailsToSend.map(item => ({
            movement: {
              employee_name: item.movement.employee_name,
              type: item.movement.type,
              deadline: item.movement.deadline,
              created_by: item.movement.created_by
            },
            recipients: item.users,
            days_remaining: item.daysRemaining,
            email_type: 'reminder'
          }))
        })
      });
    }

    return res.status(200).json({
      success: true,
      message: `${emailsSent} emails serão enviados`,
      movements_checked: movements.length,
      reminders_sent: emailsToSend.length,
      details: emailsToSend.map(item => ({
        employee: item.movement.employee_name,
        days_remaining: item.daysRemaining,
        emails_count: item.users.length
      }))
    });
  } catch (error: any) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
