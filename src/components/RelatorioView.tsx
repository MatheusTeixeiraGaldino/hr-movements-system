// src/components/RelatorioView.tsx
import { useMemo, useState, useRef, useEffect } from 'react';
import { Loader2, FileSpreadsheet, FileText, Printer, ChevronDown, X, Lock } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Movement {
  id: string;
  type: string;
  employee_name: string;
  selected_teams: string[];
  status: string;
  responses: Record<string, {
    status: string;
    comment?: string;
    date?: string;
    checklist?: Record<string, boolean>;
    history?: Array<{
      user_name: string;
      user_email: string;
      action: 'created' | 'updated';
      date: string;
      timestamp: string;
    }>;
  }>;
  created_at: string;
  created_by: string;
  details: Record<string, any>;
  deadline?: string | null;
  cancelamento?: {
    motivo: string;
    cancelado_em: string;
    cancelado_por: string;
    cancelado_por_email: string;
  } | null;
}

interface CurrentUser {
  name: string;
  email: string;
  role: 'admin' | 'responsavel' | 'team_member';
  team_ids: string[];
  team_names: string[];
  can_manage_demissoes: boolean;
  can_manage_transferencias: boolean;
}

const TEAMS_LIST = [
  { id: 'rh',         name: 'Recursos Humanos' },
  { id: 'ponto',      name: 'Ponto' },
  { id: 'transporte', name: 'Transporte' },
  { id: 'ti',         name: 'T.I' },
  { id: 'comunicacao',name: 'Comunicação' },
  { id: 'seguranca',  name: 'Segurança do Trabalho' },
  { id: 'ambulatorio',name: 'Ambulatório' },
  { id: 'financeiro', name: 'Financeiro' },
  { id: 'dp',         name: 'DP' },
  { id: 'treinamento',name: 'Treinamento e Desenvolvimento' },
  { id: 'beneficios', name: 'Benefícios' },
];

const TEAMS_MAP: Record<string, string> = Object.fromEntries(TEAMS_LIST.map(t => [t.id, t.name]));

const MOVEMENT_TYPES = [
  { id: 'demissao',     label: 'Demissão' },
  { id: 'transferencia',label: 'Transferência' },
  { id: 'alteracao',    label: 'Alteração Salarial' },
  { id: 'promocao',     label: 'Promoção' },
];

const MOVEMENT_TYPE_MAP: Record<string, string> = Object.fromEntries(MOVEMENT_TYPES.map(t => [t.id, t.label]));

const DETAIL_LABELS: Record<string, string> = {
  dismissalDate: 'Data do Desligamento',
  company:       'Empresa / Coligada',
  sector:        'Setor',
  oldSector:     'Setor Atual',
  newSector:     'Setor Destino',
  oldPosition:   'Função Atual',
  newPosition:   'Função Destino',
  changeDate:    'Data da Mudança',
  employeeName:  'Colaborador',
};

// ─── helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso?: string | null) {
  if (!iso) return '—';
  const normalized = iso.match(/^\d{4}-\d{2}-\d{2}$/) ? iso + 'T00:00:00' : iso;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

function formatDateTime(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR');
}

// ─── PDF generation ───────────────────────────────────────────────────────────
function buildMovementPDFHtml(m: Movement): string {
  const tipo    = MOVEMENT_TYPE_MAP[m.type] || m.type;
  const criacao = formatDate(m.created_at);
  const prazo   = m.deadline ? formatDate(m.deadline) : '—';
  const allDone = m.selected_teams.every(id => m.responses[id]?.status === 'completed');
  const isCanceled = m.cancelamento !== null && m.cancelamento !== undefined;
  
  let statusColor = isCanceled ? '#dc2626' : (allDone ? '#166534' : '#92400e');
  let statusBg    = isCanceled ? '#fee2e2' : (allDone ? '#dcfce7' : '#fef3c7');
  let statusText  = isCanceled ? '✕ CANCELADO' : (allDone ? '✓ APROVADO — TODOS OS PARECERES EMITIDOS' : '⏳ PENDENTE — AGUARDANDO PARECERES');
  let statusBorder = isCanceled ? '#fca5a5' : (allDone ? '#86efac' : '#fde68a');

  const detailRows = Object.entries(m.details)
    .filter(([key]) => key !== 'observation' && key !== 'employeeName')
    .map(([key, value]) => {
      const label = DETAIL_LABELS[key] || key;
      const val   = typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)
        ? formatDate(value)
        : String(value || '—');
      return `<tr><td class="detail-label">${label}</td><td class="detail-value">${val}</td></tr>`;
    }).join('');

  const observation = m.details?.observation || (m as any).observation;

  let cancelamentoHtml = '';
  if (isCanceled) {
    cancelamentoHtml = `
    <div class="cancellation-box">
      <p class="cancellation-title">Informações do Cancelamento</p>
      <table class="info-table">
        <tr>
          <td class="detail-label">Cancelado por</td>
          <td class="detail-value">
  ${m.cancelamento?.cancelado_por || '—'}
  (${m.cancelamento?.cancelado_por_email || '—'})
</td>
        </tr>
        <tr>
          <td class="detail-label">Data/Hora do cancelamento</td>
          <td class="detail-value">
  ${formatDateTime(m.cancelamento?.cancelado_em)}
</td>
        </tr>
        <tr>
          <td class="detail-label" style="vertical-align:top">Motivo</td>
          <td class="detail-value" style="font-style:italic">   ${m.cancelamento?.motivo || '—'} </td>
        </tr>
      </table>
    </div>`;
  }

  let teamSections = '';
  if (!isCanceled) {
    teamSections = m.selected_teams.map(teamId => {
      const teamName = TEAMS_MAP[teamId] || teamId;
      const resp     = m.responses[teamId];
      const done     = resp?.status === 'completed';
      const color    = done ? '#166534' : '#92400e';
      const bg       = done ? '#f0fdf4' : '#fffbeb';
      const border   = done ? '#86efac' : '#fde68a';

      const history  = resp?.history || [];
      const lastEntry= history.length > 0 ? history[history.length - 1] : null;
      const pareceristaNome  = lastEntry?.user_name  || '—';
      const pareceristaMail  = lastEntry?.user_email || '';
      const dataHoraParecer  = lastEntry?.timestamp ? formatDateTime(lastEntry.timestamp) : (resp?.date ? formatDate(resp.date) : '—');
      const acaoLabel        = lastEntry?.action === 'updated' ? 'Atualizado' : 'Emitido';

      const histRows = history.length > 1
        ? history.slice(0, -1).map((h, i) => `
            <tr>
              <td style="color:#6b7280;font-size:9px;padding:3px 6px">${i + 1}ª versão</td>
              <td style="color:#6b7280;font-size:9px;padding:3px 6px">${h.user_name}</td>
              <td style="color:#6b7280;font-size:9px;padding:3px 6px">${formatDateTime(h.timestamp)}</td>
              <td style="color:#6b7280;font-size:9px;padding:3px 6px">${h.action === 'created' ? 'Emissão inicial' : 'Atualização'}</td>
            </tr>`).join('')
        : '';

      const checklist = resp?.checklist || {};
      const checkItems = Object.entries(checklist);
      const checkHtml = checkItems.length > 0
        ? `<div class="checklist-wrap">
             <p class="checklist-title">Checklist</p>
             ${checkItems.map(([item, checked]) => `
               <div class="check-item">
                 <span class="check-icon" style="color:${checked ? '#16a34a' : '#dc2626'}">${checked ? '✓' : '✗'}</span>
                 <span style="color:${checked ? '#111' : '#6b7280'}">${item}</span>
               </div>`).join('')}
           </div>`
        : '';

      return `
        <div class="team-card" style="border-color:${border};background:${bg}">
          <div class="team-header">
            <div>
              <span class="team-name">${teamName}</span>
            </div>
            <span class="status-badge" style="color:${color};background:${done ? '#dcfce7' : '#fef3c7'};border:1px solid ${border}">
              ${done ? '✓ Parecer Emitido' : '⏳ Pendente'}
            </span>
          </div>

          ${done ? `
          <table class="info-table" style="margin-bottom:8px">
            <tr>
              <td class="detail-label">Responsável</td>
              <td class="detail-value">${pareceristaNome}${pareceristaMail ? ` <span style="color:#6b7280;font-size:9px">(${pareceristaMail})</span>` : ''}</td>
            </tr>
            <tr>
              <td class="detail-label">Data / Hora do Parecer</td>
              <td class="detail-value" style="font-weight:700;color:#1e3a5f">${dataHoraParecer} <span style="font-size:9px;color:#6b7280">(${acaoLabel})</span></td>
            </tr>
          </table>

          ${checkHtml}

          <div class="parecer-box">
            <p class="parecer-label">Parecer / Observações</p>
            <p class="parecer-text">${resp?.comment || '—'}</p>
          </div>

          ${histRows ? `
          <div style="margin-top:8px">
            <p style="font-size:9px;font-weight:700;color:#6b7280;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">Histórico de alterações</p>
            <table style="width:100%;border-collapse:collapse;font-size:9px">
              <thead><tr style="background:#f3f4f6">
                <th style="text-align:left;padding:3px 6px;color:#6b7280">Versão</th>
                <th style="text-align:left;padding:3px 6px;color:#6b7280">Usuário</th>
                <th style="text-align:left;padding:3px 6px;color:#6b7280">Data / Hora</th>
                <th style="text-align:left;padding:3px 6px;color:#6b7280">Ação</th>
              </tr></thead>
              <tbody>${histRows}</tbody>
            </table>
          </div>` : ''}
          ` : `<p style="font-size:10px;color:#92400e;margin-top:6px">Aguardando emissão de parecer.</p>`}
        </div>`;
    }).join('');
  }

  const now = new Date().toLocaleString('pt-BR');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Movimentação — ${m.employee_name}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111;background:#fff;padding:28px 32px}
    .doc-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:3px solid #1e3a5f;margin-bottom:18px}
    .doc-title{font-size:20px;font-weight:700;color:#1e3a5f;letter-spacing:-.3px}
    .doc-subtitle{font-size:11px;color:#555;margin-top:3px}
    .doc-meta{text-align:right;font-size:10px;color:#555;line-height:1.6}
    .doc-meta strong{color:#111}
    .status-geral{display:inline-block;padding:4px 14px;border-radius:6px;font-size:12px;font-weight:700;letter-spacing:.5px;margin-bottom:16px}
    .section{margin-bottom:20px}
    .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#1e3a5f;border-bottom:1.5px solid #bfdbfe;padding-bottom:4px;margin-bottom:10px}
    .info-table{width:100%;border-collapse:collapse}
    .detail-label{width:36%;font-weight:600;color:#374151;padding:4px 8px 4px 0;vertical-align:top;white-space:nowrap}
    .detail-value{color:#111;padding:4px 0;vertical-align:top}
    .obs-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;font-size:10px;color:#374151;line-height:1.5}
    .cancellation-box{background:#fee2e2;border:1.5px solid #fca5a5;border-radius:8px;padding:12px 14px;margin-bottom:20px}
    .cancellation-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#7f1d1d;margin-bottom:8px}
    .team-card{border:1.5px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin-bottom:12px;page-break-inside:avoid}
    .team-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
    .team-name{font-size:12px;font-weight:700;color:#1e3a5f}
    .status-badge{font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px}
    .checklist-wrap{background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;margin-bottom:8px}
    .checklist-title{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;margin-bottom:6px}
    .check-item{display:flex;align-items:flex-start;gap:6px;font-size:10px;margin-bottom:3px}
    .check-icon{font-size:11px;font-weight:700;flex-shrink:0;margin-top:1px}
    .parecer-box{background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px}
    .parecer-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;margin-bottom:4px}
    .parecer-text{font-size:10px;color:#111;line-height:1.5;white-space:pre-wrap}
    .summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}
    .summary-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;text-align:center}
    .summary-num{font-size:22px;font-weight:700;color:#1e3a5f}
    .summary-label{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
    .doc-footer{margin-top:28px;padding-top:10px;border-top:1.5px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#9ca3af}
    @page{size:A4 portrait;margin:10mm 12mm}
    @media print{body{padding:0}.no-print{display:none}}
  </style>
</head>
<body>
  <div class="doc-header">
    <div>
      <div class="doc-title">Ficha de Movimentação Trabalhista</div>
      <div class="doc-subtitle">RH Movimentações — Registro Oficial</div>
    </div>
    <div class="doc-meta">
      <div>Nº do Registro: <strong>${m.id.substring(0, 8).toUpperCase()}</strong></div>
      <div>Criado em: <strong>${criacao}</strong></div>
      <div>Gerado em: <strong>${now}</strong></div>
    </div>
  </div>
  <span class="status-geral" style="color:${statusColor};background:${statusBg};border:1.5px solid ${statusBorder}">
    ${statusText}
  </span>
  <div class="section">
    <div class="section-title">Identificação da Movimentação</div>
    <table class="info-table">
      <tr><td class="detail-label">Colaborador</td><td class="detail-value" style="font-size:13px;font-weight:700">${m.employee_name}</td></tr>
      <tr><td class="detail-label">Tipo de Movimentação</td><td class="detail-value"><strong>${tipo}</strong></td></tr>
      <tr><td class="detail-label">Criado por</td><td class="detail-value">${m.created_by}</td></tr>
      <tr><td class="detail-label">Data de Criação</td><td class="detail-value">${criacao}</td></tr>
      <tr><td class="detail-label">Prazo para Respostas</td><td class="detail-value">${prazo}</td></tr>
      ${detailRows}
    </table>
    ${observation ? `<div style="margin-top:10px"><div class="section-title" style="margin-bottom:6px">Observações Gerais</div><div class="obs-box">${observation}</div></div>` : ''}
  </div>
  ${cancelamentoHtml ? `<div class="section"><div class="section-title">Status do Cancelamento</div>${cancelamentoHtml}</div>` : ''}
  ${!isCanceled ? `
  <div class="summary-grid">
    <div class="summary-card"><div class="summary-num">${m.selected_teams.length}</div><div class="summary-label">Equipes envolvidas</div></div>
    <div class="summary-card" style="border-color:#86efac"><div class="summary-num" style="color:#16a34a">${m.selected_teams.filter(id => m.responses[id]?.status === 'completed').length}</div><div class="summary-label">Pareceres emitidos</div></div>
    <div class="summary-card" style="border-color:#fde68a"><div class="summary-num" style="color:#d97706">${m.selected_teams.filter(id => m.responses[id]?.status !== 'completed').length}</div><div class="summary-label">Pareceres pendentes</div></div>
  </div>
  <div class="section"><div class="section-title">Pareceres das Equipes</div>${teamSections}</div>
  ` : ''}
  <div class="doc-footer">
    <span>RH Movimentações — Documento gerado automaticamente em ${now}</span>
    <span>ID: ${m.id}</span>
  </div>
</body>
</html>`;
}

function printMovementPDF(m: Movement) {
  const html = buildMovementPDFHtml(m);
  const win = window.open('', '_blank');
  if (!win) { alert('Permita pop-ups para gerar o PDF.'); return; }
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

// ─── MultiSelect dropdown ────────────────────────────────────────────────────
interface MultiSelectOption { value: string; label: string; count: number; }
interface MultiSelectProps {
  label: string;
  selected: Set<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
  options: MultiSelectOption[];
  totalCount: number;
}

function MultiSelect({ label, selected, onToggle, onClear, options, totalCount }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasSelection = selected.size > 0;
  const displayLabel = hasSelection
    ? options.filter(o => selected.has(o.value)).map(o => o.label).join(', ')
    : `Todos (${totalCount})`;

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition ${
          hasSelection
            ? 'border-blue-400 bg-blue-50 text-blue-800 font-medium'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
        }`}
      >
        <span className="truncate text-left">{displayLabel}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {hasSelection && (
            <span
              onClick={e => { e.stopPropagation(); onClear(); }}
              className="text-blue-400 hover:text-red-500 cursor-pointer"
              title="Limpar seleção"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={() => { onClear(); setOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition ${
              !hasSelection ? 'bg-blue-50 text-blue-800 font-medium' : 'text-gray-700'
            }`}
          >
            <span>Todos</span>
            <span className="text-xs text-gray-400">{totalCount}</span>
          </button>
          <div className="border-t border-gray-100" />
          <div className="max-h-52 overflow-y-auto">
            {options.map(opt => {
              const checked = selected.has(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onToggle(opt.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition ${
                    checked ? 'bg-blue-50 text-blue-800' : 'text-gray-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                    checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {checked && (
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                        <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="flex-1 text-left">{opt.label}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{opt.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Row builder ──────────────────────────────────────────────────────────────
interface Row {
  _id: string;
  _type: string;
  _teams: string[];
  _status: string;
  _teamStatus: Record<string, 'completed' | 'pending'>;
  _movement: Movement;
  _createdAt: Date;
  _approvedAt: Date | null;
  _isCanceled: boolean;
  _canceledAt: Date | null;
  Nome: string;
  Tipo: string;
  'Criado por': string;
  'Data de criação': string;
  Status: string;
  'Faltam parecer': string;
  'Com pareceres emitidos': string;
  'Último Parecer': string;
  'Cancelado em': string;
  'Cancelado por': string;
  'Data da Mudança/Desligamento': string;
  _movementDate: Date | null;
}

function buildRows(movements: Movement[], currentUser: CurrentUser): Row[] {
  return movements
    .filter(m =>
      currentUser.role === 'admin' ||
      m.created_by === currentUser.name ||
      m.selected_teams.some((t: string) => currentUser.team_ids.includes(t)) ||
      (m.type === 'admissao' && currentUser.team_names.includes('DP'))
    )
    .map(m => {
      const respondidas = m.selected_teams.filter(id => m.responses[id]?.status === 'completed');
      const pendentes   = m.selected_teams.filter(id => m.responses[id]?.status !== 'completed');
      const isCanceled = m.cancelamento !== null && m.cancelamento !== undefined;
      
      let statusLabel = isCanceled ? 'Cancelado' : (pendentes.length === 0 ? 'Aprovado' : 'Pendente');
      const teamStatus: Record<string, 'completed' | 'pending'> = {};
      m.selected_teams.forEach(id => { teamStatus[id] = m.responses[id]?.status === 'completed' ? 'completed' : 'pending'; });

      let approvedAt: Date | null = null;
      if (!isCanceled && pendentes.length === 0) {
        const timestamps = m.selected_teams
          .map(id => {
            const resp = m.responses[id];
            const hist = resp?.history || [];
            if (hist.length > 0) return new Date(hist[hist.length - 1].timestamp);
            if (resp?.date) return new Date(resp.date);
            return null;
          })
          .filter((d): d is Date => d !== null && !isNaN(d.getTime()));
        if (timestamps.length > 0) {
          approvedAt = new Date(Math.max(...timestamps.map(d => d.getTime())));
        }
      }

      const allTimestamps = m.selected_teams
        .map(id => {
          const resp = m.responses[id];
          if (resp?.status !== 'completed') return null;
          const hist = resp?.history || [];
          if (hist.length > 0) return new Date(hist[hist.length - 1].timestamp);
          if (resp?.date) return new Date(resp.date);
          return null;
        })
        .filter((d): d is Date => d !== null && !isNaN(d.getTime()));
      const lastResponseDate = allTimestamps.length > 0
        ? formatDate(new Date(Math.max(...allTimestamps.map(d => d.getTime()))).toISOString())
        : '—';

      let canceledAt: Date | null = null;
      let canceledAtStr = '—';
      let canceledByStr = '—';

      if (isCanceled) {
        canceledAt = m.cancelamento?.cancelado_em ? new Date(m.cancelamento.cancelado_em) : null;
        canceledAtStr = formatDate(m.cancelamento?.cancelado_em);
        canceledByStr = m.cancelamento?.cancelado_por || '—';
      }

      const rawMovementDate = m.type === 'demissao' ? m.details.dismissalDate : m.details.changeDate;
      const movementDate = rawMovementDate ? new Date(rawMovementDate) : null;

      return {
        _id: m.id, _type: m.type, _teams: m.selected_teams,
        _status: statusLabel, _teamStatus: teamStatus, _movement: m,
        _createdAt: new Date(m.created_at),
        _approvedAt: approvedAt,
        _isCanceled: isCanceled,
        _canceledAt: canceledAt,
        _movementDate: movementDate,
        Nome: m.employee_name,
        Tipo: MOVEMENT_TYPE_MAP[m.type] || m.type,
        'Criado por': m.created_by,
        'Data de criação': formatDate(m.created_at),
        'Data da Mudança/Desligamento': rawMovementDate ? formatDate(rawMovementDate) : '—',
        Status: statusLabel,
        'Faltam parecer':         pendentes.length === 0 ? '—' : pendentes.map(id => TEAMS_MAP[id] || id).join(', '),
        'Com pareceres emitidos': respondidas.length === 0 ? '—' : respondidas.map(id => TEAMS_MAP[id] || id).join(', '),
        'Último Parecer': lastResponseDate,
        'Cancelado em': canceledAtStr,
        'Cancelado por': canceledByStr,
      };
    });
}

function matchesTeamStatus(row: Row, filterTeams: Set<string>, filterStatuses: Set<string>): boolean {
  if (filterTeams.size === 0) {
    if (filterStatuses.size > 0 && !filterStatuses.has(row._status)) return false;
    return true;
  }
  const hasTeam = [...filterTeams].some(t => row._teams.includes(t));
  if (!hasTeam) return false;
  if (filterStatuses.size === 0) return true;
  return [...filterTeams].some(teamId => {
    if (!row._teams.includes(teamId)) return false;
    const done = row._teamStatus[teamId] === 'completed';
    if (filterStatuses.has('Aprovado') && done) return true;
    if (filterStatuses.has('Pendente') && !done) return true;
    return false;
  });
}

// ─── Excel export helpers ─────────────────────────────────────────────────────

/**
 * As 5 colunas exatas do modelo de referência (Pendencias_por_Setor.xlsx).
 * Cada aba de equipe lista apenas as movimentações PENDENTES para aquela equipe.
 */
const PENDING_COLS = [
  'Nome',
  'Tipo',
  'Criado por',
  'Data de criação',
  'Data da Mudança/Desligamento',
  'Status',
];

/**
 * Colunas da aba Geral (visão completa de todas as movimentações filtradas).
 */
const GENERAL_COLS = [
  'Nome', 'Tipo', 'Criado por', 'Data de criação',
  'Data da Mudança/Desligamento', 'Status',
  'Último Parecer', 'Faltam parecer', 'Com pareceres emitidos',
  'Cancelado em', 'Cancelado por',
];

/** Monta a aba "Geral" com todas as linhas filtradas. */
function buildGeneralSheet(rows: Row[]): XLSX.WorkSheet {
  const data = rows.map(r => ({
    'Nome':                         r.Nome,
    'Tipo':                         r.Tipo,
    'Criado por':                   r['Criado por'],
    'Data de criação':              r['Data de criação'],
    'Data da Mudança/Desligamento': r['Data da Mudança/Desligamento'],
    'Status':                       r.Status,
    'Último Parecer':               r['Último Parecer'],
    'Faltam parecer':               r['Faltam parecer'],
    'Com pareceres emitidos':       r['Com pareceres emitidos'],
    'Cancelado em':                 r['Cancelado em'],
    'Cancelado por':                r['Cancelado por'],
  }));

  const ws = XLSX.utils.json_to_sheet(data, { header: GENERAL_COLS });
  ws['!cols'] = [
    { wch: 35 }, { wch: 18 }, { wch: 28 }, { wch: 16 },
    { wch: 28 }, { wch: 12 }, { wch: 16 }, { wch: 45 },
    { wch: 45 }, { wch: 16 }, { wch: 22 },
  ];
  return ws;
}

/**
 * Monta a aba de uma equipe específica.
 * Lista todas as movimentações filtradas que incluem aquela equipe,
 * com as mesmas 5 colunas do modelo de referência.
 */
function buildTeamPendingSheet(teamId: string, allRows: Row[]): XLSX.WorkSheet | null {
  const pendingRows = allRows.filter(r => r._teams.includes(teamId));

  if (pendingRows.length === 0) return null;

  const data = pendingRows.map(r => ({
    'Nome':                         r.Nome,
    'Tipo':                         r.Tipo,
    'Criado por':                   r['Criado por'],
    'Data de criação':              r['Data de criação'],
    'Data da Mudança/Desligamento': r['Data da Mudança/Desligamento'],
    'Status':                       r._teamStatus[teamId] === 'completed' ? 'Respondido' : 'Pendente',
  }));

  const ws = XLSX.utils.json_to_sheet(data, { header: PENDING_COLS });
  ws['!cols'] = [
    { wch: 35 }, { wch: 18 }, { wch: 28 }, { wch: 16 }, { wch: 28 }, { wch: 12 },
  ];
  return ws;
}

// ─── Component ────────────────────────────────────────────────────────────────
interface RelatorioViewProps {
  currentUser: CurrentUser;
  movements: Movement[];
  loading: boolean;
}

export default function RelatorioView({ currentUser, movements, loading }: RelatorioViewProps) {
  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(new Set());
  const [filterTypes,    setFilterTypes]    = useState<Set<string>>(new Set());
  const [filterTeams,    setFilterTeams]    = useState<Set<string>>(new Set());
  const [showCanceled,   setShowCanceled]   = useState(false);
  const [dateCreatedStart, setDateCreatedStart] = useState<string>('');
  const [dateCreatedEnd,   setDateCreatedEnd]   = useState<string>('');
  const [dateApprStart,    setDateApprStart]    = useState<string>('');
  const [dateApprEnd,      setDateApprEnd]      = useState<string>('');
  const [dateMovStart,     setDateMovStart]     = useState<string>('');
  const [dateMovEnd,       setDateMovEnd]       = useState<string>('');
  const [sortCol,  setSortCol]  = useState<string>('');
  const [sortDir,  setSortDir]  = useState<'asc' | 'desc'>('asc');
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [exporting,    setExporting]    = useState(false);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) => {
    setter(prev => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  };

  const allRows = useMemo(() => buildRows(movements, currentUser), [movements, currentUser]);

  // Só quem tem acesso a DP pode gerar PDF de movimentações de Admissão
  const podeGerarPdfAdmissao = currentUser.team_names.includes('DP');
  const podeGerarPdf = (row: Row) => row._type !== 'admissao' || podeGerarPdfAdmissao;

  const toStart = (s: string) => s ? new Date(s + 'T00:00:00') : null;
  const toEnd   = (s: string) => s ? new Date(s + 'T23:59:59') : null;

  const matchesDateFilters = (r: Row) => {
    const cs = toStart(dateCreatedStart);
    const ce = toEnd(dateCreatedEnd);
    if (cs && r._createdAt < cs) return false;
    if (ce && r._createdAt > ce) return false;
    const as_ = toStart(dateApprStart);
    const ae  = toEnd(dateApprEnd);
    if (as_ || ae) {
      if (!r._approvedAt) return false;
      if (as_ && r._approvedAt < as_) return false;
      if (ae  && r._approvedAt > ae)  return false;
    }
    const ms = toStart(dateMovStart);
    const me = toEnd(dateMovEnd);
    if (ms || me) {
      if (!r._movementDate) return false;
      if (ms && r._movementDate < ms) return false;
      if (me && r._movementDate > me) return false;
    }
    return true;
  };

  const rowsForStatusCount = useMemo(() =>
    allRows.filter(r => {
      if (filterTypes.size > 0 && !filterTypes.has(r._type)) return false;
      if (filterTeams.size > 0 && ![...filterTeams].some(t => r._teams.includes(t))) return false;
      if (!matchesDateFilters(r)) return false;
      if (showCanceled && !r._isCanceled) return false;
      if (!showCanceled && r._isCanceled) return false;
      return true;
    }), [allRows, filterTypes, filterTeams, dateCreatedStart, dateCreatedEnd, dateApprStart, dateApprEnd, dateMovStart, dateMovEnd, showCanceled]);

  const rowsForTypeCount = useMemo(() =>
    allRows.filter(r => {
      if (!matchesTeamStatus(r, filterTeams, filterStatuses)) return false;
      if (!matchesDateFilters(r)) return false;
      if (showCanceled && !r._isCanceled) return false;
      if (!showCanceled && r._isCanceled) return false;
      return true;
    }), [allRows, filterTeams, filterStatuses, dateCreatedStart, dateCreatedEnd, dateApprStart, dateApprEnd, dateMovStart, dateMovEnd, showCanceled]);

  const rowsForTeamCount = useMemo(() =>
    allRows.filter(r => {
      if (filterTypes.size > 0 && !filterTypes.has(r._type)) return false;
      if (filterStatuses.size > 0 && !filterStatuses.has(r._status)) return false;
      if (!matchesDateFilters(r)) return false;
      if (showCanceled && !r._isCanceled) return false;
      if (!showCanceled && r._isCanceled) return false;
      return true;
    }), [allRows, filterTypes, filterStatuses, dateCreatedStart, dateCreatedEnd, dateApprStart, dateApprEnd, dateMovStart, dateMovEnd, showCanceled]);

  const filtered = useMemo(() =>
    allRows.filter(r => {
      if (filterTypes.size > 0 && !filterTypes.has(r._type)) return false;
      if (!matchesTeamStatus(r, filterTeams, filterStatuses)) return false;
      if (!matchesDateFilters(r)) return false;
      if (showCanceled && !r._isCanceled) return false;
      if (!showCanceled && r._isCanceled) return false;
      return true;
    }), [allRows, filterTypes, filterTeams, filterStatuses, dateCreatedStart, dateCreatedEnd, dateApprStart, dateApprEnd, dateMovStart, dateMovEnd, showCanceled]);

  const COL_KEY: Record<string, keyof Row> = {
    'Nome':           'Nome',
    'Tipo':           'Tipo',
    'Criado por':     'Criado por',
    'Criação':        '_createdAt',
    'Mudança/Deslig.': '_movementDate',
    'Status':         'Status',
    'Último Parecer': 'Último Parecer',
    'Faltam':         'Faltam parecer',
    'Responderam':    'Com pareceres emitidos',
    'Cancelado em':   'Cancelado em',
    'Cancelado por':  'Cancelado por',
  };

  const sortedFiltered = useMemo(() => {
    if (!sortCol || !COL_KEY[sortCol]) return filtered;
    const key = COL_KEY[sortCol];
    return [...filtered].sort((a, b) => {
      const av = String(a[key] ?? '');
      const bv = String(b[key] ?? '');
      const ae = av === '—' ? '' : av;
      const be = bv === '—' ? '' : bv;
      const aDate = ae.match(/^\d{2}\/\d{2}\/\d{4}$/) ? ae.split('/').reverse().join('-') : ae;
      const bDate = be.match(/^\d{2}\/\d{2}\/\d{4}$/) ? be.split('/').reverse().join('-') : be;
      const cmp = aDate.localeCompare(bDate, 'pt-BR', { numeric: true, sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const clearFilters = () => {
    setFilterStatuses(new Set()); setFilterTypes(new Set()); setFilterTeams(new Set());
    setDateCreatedStart(''); setDateCreatedEnd('');
    setDateApprStart(''); setDateApprEnd('');
    setDateMovStart(''); setDateMovEnd('');
    setShowCanceled(false);
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const selecionaveis = sortedFiltered.filter(podeGerarPdf);
    if (selected.size === selecionaveis.length && selecionaveis.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selecionaveis.map(r => r._id)));
    }
  };

  const handlePrintSelected = () => {
    const rows = sortedFiltered.filter(r => selected.has(r._id) && podeGerarPdf(r));
    if (rows.length === 0) { alert('Selecione ao menos uma movimentação (admissões exigem acesso de DP).'); return; }
    rows.forEach(r => printMovementPDF(r._movement));
  };

  const handlePrintOne = (row: Row) => {
    if (!podeGerarPdf(row)) { alert('Apenas usuários com acesso a DP podem gerar o PDF de uma Admissão.'); return; }
    printMovementPDF(row._movement);
  };

  // ─── EXPORT EXCEL POR EQUIPE ───────────────────────────────────────────────
  const handleExportExcel = () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // 1. Aba "Geral" com visão completa das movimentações filtradas
      const generalWs = buildGeneralSheet(sortedFiltered);
      XLSX.utils.book_append_sheet(wb, generalWs, 'Geral');

      // 2. Uma aba por equipe — apenas pendências daquela equipe,
      //    exatamente no formato do modelo (5 colunas, sem respondidas).
      //    Só cria a aba se a equipe tiver ao menos 1 pendência.
      for (const team of TEAMS_LIST) {
        const teamWs = buildTeamPendingSheet(team.id, sortedFiltered);
        if (!teamWs) continue;
        // Limite Excel: 31 chars no nome da aba
        const sheetName = team.name.length > 31 ? team.name.substring(0, 31) : team.name;
        XLSX.utils.book_append_sheet(wb, teamWs, sheetName);
      }

      const today = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      XLSX.writeFile(wb, `pendencias-por-setor-${today}.xlsx`);
    } catch (e) {
      alert('Erro ao gerar o arquivo Excel.');
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const hasActiveFilters = filterStatuses.size > 0 || filterTypes.size > 0 || filterTeams.size > 0
    || !!dateCreatedStart || !!dateCreatedEnd || !!dateApprStart || !!dateApprEnd || !!dateMovStart || !!dateMovEnd || showCanceled;
  const allSelected = sortedFiltered.length > 0 && selected.size === sortedFiltered.length;
  const someSelected = selected.size > 0;

  return (
    <div className="bg-white rounded-lg shadow" style={{ minWidth: 0 }}>
      {/* Cabeçalho */}
      <div className="flex flex-wrap justify-between items-center gap-3 p-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold">Relatório de Movimentações</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {currentUser.role === 'admin' ? 'Todas as movimentações do sistema' : 'Movimentações que você criou'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {someSelected && (
            <button
              onClick={handlePrintSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir ({selected.size})
            </button>
          )}
          <button
            onClick={handleExportExcel}
            disabled={exporting || sortedFiltered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs font-medium"
            title="Exporta aba Geral + uma aba por equipe com pendências"
          >
            {exporting
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Exportando...</>
              : <><FileSpreadsheet className="w-3.5 h-3.5" />Pendências por Setor</>}
          </button>
        </div>
      </div>

      <div className="p-4">
        {hasActiveFilters && (
          <div className="flex justify-end mb-2">
            <button onClick={clearFilters} className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition">
              ✕ Limpar filtros
            </button>
          </div>
        )}

        {filterTeams.size > 0 && (
          <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            Equipe(s) selecionada(s) — <strong>Aprovado</strong>: equipe já deu o parecer; <strong>Pendente</strong>: ainda não deu.
          </div>
        )}

        {/* Filtros — dropdowns multi-select */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <MultiSelect
            label="Status"
            selected={filterStatuses}
            onToggle={v => toggleSet(setFilterStatuses, v)}
            onClear={() => setFilterStatuses(new Set())}
            options={(['Pendente', 'Aprovado', 'Cancelado'] as const).map(opt => {
              let count = 0;
              if (opt === 'Cancelado') {
                count = rowsForStatusCount.filter(r => r._isCanceled).length;
              } else {
                count = rowsForStatusCount.filter(r => {
                  if (filterTeams.size === 0) return r._status === opt;
                  return [...filterTeams].some(t => {
                    if (!r._teams.includes(t)) return false;
                    const done = r._teamStatus[t] === 'completed';
                    return opt === 'Aprovado' ? done : !done;
                  });
                }).length;
              }
              const icon = opt === 'Cancelado' ? '✕' : (opt === 'Pendente' ? '⏳' : '✓');
              return { value: opt, label: `${icon} ${opt}`, count };
            })}
            totalCount={rowsForStatusCount.length}
          />

          <MultiSelect
            label="Tipo"
            selected={filterTypes}
            onToggle={v => toggleSet(setFilterTypes, v)}
            onClear={() => setFilterTypes(new Set())}
            options={MOVEMENT_TYPES.map(t => ({
              value: t.id,
              label: t.label,
              count: rowsForTypeCount.filter(r => r._type === t.id).length,
            }))}
            totalCount={rowsForTypeCount.length}
          />

          <MultiSelect
            label="Equipe"
            selected={filterTeams}
            onToggle={v => toggleSet(setFilterTeams, v)}
            onClear={() => setFilterTeams(new Set())}
            options={TEAMS_LIST
              .map(t => ({
                value: t.id,
                label: t.name,
                count: rowsForTeamCount.filter(r => r._teams.includes(t.id)).length,
              }))
              .filter(o => o.count > 0)}
            totalCount={rowsForTeamCount.length}
          />
        </div>

        {/* Toggle Canceladas */}
        <div className="mb-4 flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCanceled}
              onChange={(e) => setShowCanceled(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">Mostrar apenas canceladas</span>
          </label>
        </div>

        {/* Filtros de data */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-gray-50 rounded-lg border">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Data de Criação</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">De</label>
                <input type="date" value={dateCreatedStart} onChange={e => setDateCreatedStart(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-blue-400" />
              </div>
              <span className="text-gray-300 text-xs mt-4">→</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Até</label>
                <input type="date" value={dateCreatedEnd} onChange={e => setDateCreatedEnd(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-blue-400" />
              </div>
              {(dateCreatedStart || dateCreatedEnd) && (
                <button onClick={() => { setDateCreatedStart(''); setDateCreatedEnd(''); }}
                  className="mt-4 text-gray-400 hover:text-red-500" title="Limpar">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Data de Aprovação <span className="text-gray-400 font-normal normal-case">(último parecer)</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">De</label>
                <input type="date" value={dateApprStart} onChange={e => setDateApprStart(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-blue-400" />
              </div>
              <span className="text-gray-300 text-xs mt-4">→</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Até</label>
                <input type="date" value={dateApprEnd} onChange={e => setDateApprEnd(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-blue-400" />
              </div>
              {(dateApprStart || dateApprEnd) && (
                <button onClick={() => { setDateApprStart(''); setDateApprEnd(''); }}
                  className="mt-4 text-gray-400 hover:text-red-500" title="Limpar">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {(dateApprStart || dateApprEnd) && (
              <p className="text-xs text-blue-600 mt-1">Apenas movimentações totalmente aprovadas.</p>
            )}
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border col-span-2">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Data da Mudança / Desligamento</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">De</label>
                <input type="date" value={dateMovStart} onChange={e => setDateMovStart(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-blue-400" />
              </div>
              <span className="text-gray-300 text-xs mt-4">→</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Até</label>
                <input type="date" value={dateMovEnd} onChange={e => setDateMovEnd(e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-blue-400" />
              </div>
              {(dateMovStart || dateMovEnd) && (
                <button onClick={() => { setDateMovStart(''); setDateMovEnd(''); }}
                  className="mt-4 text-gray-400 hover:text-red-500" title="Limpar">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : sortedFiltered.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-sm">Nenhuma movimentação encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-2 py-2.5 border-b border-gray-200 w-8">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-3.5 h-3.5 cursor-pointer" title="Selecionar todos" />
                  </th>
                  {['Nome', 'Tipo', 'Criado por', 'Criação', 'Mudança/Deslig.', 'Status', 'Último Parecer', 'Faltam', 'Responderam', 'Cancelado em', 'Cancelado por'].map(col => {
                    const active = sortCol === col;
                    return (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className="px-2 py-2.5 font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap cursor-pointer select-none hover:bg-gray-100 transition"
                      >
                        <span className="flex items-center gap-1">
                          {col}
                          <span className={`text-xs ${active ? 'text-blue-500' : 'text-gray-300'}`}>
                            {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                          </span>
                        </span>
                      </th>
                    );
                  })}
                  <th className="px-2 py-2.5 font-semibold text-gray-600 border-b border-gray-200">PDF</th>
                </tr>
              </thead>
              <tbody>
                {sortedFiltered.map((row, idx) => {
                  const isChecked = selected.has(row._id);
                  return (
                    <tr key={row._id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isChecked ? 'ring-1 ring-inset ring-blue-300' : ''} ${row._isCanceled ? 'opacity-75' : ''}`}>
                      <td className="px-2 py-2 border-b border-gray-100">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!podeGerarPdf(row)}
                          onChange={() => toggleSelect(row._id)}
                          title={!podeGerarPdf(row) ? 'Apenas usuários com acesso a DP podem gerar PDF de Admissão' : undefined}
                          className="w-3.5 h-3.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-2 py-2 border-b border-gray-100 font-medium text-gray-900 max-w-[140px] truncate" title={row.Nome}>{row.Nome}</td>
                      <td className="px-2 py-2 border-b border-gray-100 text-gray-600 whitespace-nowrap">{row.Tipo}</td>
                      <td className="px-2 py-2 border-b border-gray-100 text-gray-600 whitespace-nowrap">{row['Criado por']}</td>
                      <td className="px-2 py-2 border-b border-gray-100 text-gray-500 whitespace-nowrap">{row['Data de criação']}</td>
                      <td className="px-2 py-2 border-b border-gray-100 text-gray-900 font-medium whitespace-nowrap">{row['Data da Mudança/Desligamento']}</td>
                      <td className="px-2 py-2 border-b border-gray-100 whitespace-nowrap">
                        {row._isCanceled ? (
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-red-100 text-red-800">✕ Cancelado</span>
                        ) : (
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${row.Status === 'Aprovado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {row.Status === 'Aprovado' ? '✓' : '⏳'} {row.Status}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 border-b border-gray-100 whitespace-nowrap text-gray-500">
                        {row['Último Parecer'] === '—' ? <span className="text-gray-300">—</span> : row['Último Parecer']}
                      </td>
                      <td className="px-2 py-2 border-b border-gray-100 max-w-[120px]">
                        {row['Faltam parecer'] === '—'
                          ? <span className="text-gray-300">—</span>
                          : <span className="text-red-600 text-xs truncate block" title={row['Faltam parecer']}>{row['Faltam parecer']}</span>}
                      </td>
                      <td className="px-2 py-2 border-b border-gray-100 max-w-[120px]">
                        {row['Com pareceres emitidos'] === '—'
                          ? <span className="text-gray-300">—</span>
                          : <span className="text-green-700 text-xs truncate block" title={row['Com pareceres emitidos']}>{row['Com pareceres emitidos']}</span>}
                      </td>
                      <td className="px-2 py-2 border-b border-gray-100 text-gray-500 whitespace-nowrap">
                        {row['Cancelado em'] === '—' ? <span className="text-gray-300">—</span> : row['Cancelado em']}
                      </td>
                      <td className="px-2 py-2 border-b border-gray-100 text-gray-600 whitespace-nowrap">
                        {row['Cancelado por'] === '—' ? <span className="text-gray-300">—</span> : row['Cancelado por']}
                      </td>
                      <td className="px-2 py-2 border-b border-gray-100">
                        {podeGerarPdf(row) ? (
                          <button onClick={() => handlePrintOne(row)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 border border-red-200 bg-red-50 rounded hover:bg-red-100 transition whitespace-nowrap">
                            <FileText className="w-3 h-3" />PDF
                          </button>
                        ) : (
                          <span
                            title="Apenas usuários com acesso a DP podem gerar o PDF de uma Admissão"
                            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 border border-gray-200 bg-gray-50 rounded whitespace-nowrap cursor-not-allowed"
                          >
                            <Lock className="w-3 h-3" />PDF
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400">{sortedFiltered.length} registro{sortedFiltered.length !== 1 ? 's' : ''}</p>
              {someSelected && (
                <p className="text-xs text-blue-600 font-medium">{selected.size} selecionada{selected.size !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
