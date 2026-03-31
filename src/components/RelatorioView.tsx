// src/components/RelatorioView.tsx
import { useMemo, useState } from 'react';
import { Loader2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Movement {
  id: string;
  type: string;
  employee_name: string;
  selected_teams: string[];
  status: string;
  responses: Record<string, { status: string; comment?: string }>;
  created_at: string;
  created_by: string;
  details: Record<string, any>;
  deadline?: string | null;
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
  { id: 'rh', name: 'Recursos Humanos' },
  { id: 'ponto', name: 'Ponto' },
  { id: 'transporte', name: 'Transporte' },
  { id: 'ti', name: 'T.I' },
  { id: 'comunicacao', name: 'Comunicação' },
  { id: 'seguranca', name: 'Segurança do Trabalho' },
  { id: 'ambulatorio', name: 'Ambulatório' },
  { id: 'financeiro', name: 'Financeiro' },
  { id: 'dp', name: 'DP' },
  { id: 'treinamento', name: 'Treinamento e Desenvolvimento' },
];

const TEAMS_MAP: Record<string, string> = Object.fromEntries(TEAMS_LIST.map(t => [t.id, t.name]));

const MOVEMENT_TYPES = [
  { id: 'demissao', label: 'Demissão' },
  { id: 'transferencia', label: 'Transferência' },
  { id: 'alteracao', label: 'Alteração Salarial' },
  { id: 'promocao', label: 'Promoção' },
];

const MOVEMENT_TYPE_MAP: Record<string, string> = Object.fromEntries(MOVEMENT_TYPES.map(t => [t.id, t.label]));

interface Row {
  _id: string;
  _type: string;
  _teams: string[];
  _status: string; // status geral (todos responderam ou não)
  _teamStatus: Record<string, 'completed' | 'pending'>; // status por equipe
  Nome: string;
  Tipo: string;
  'Criado por': string;
  'Data de criação': string;
  Status: string;
  'Faltam parecer': string;
  'Com pareceres emitidos': string;
}

function buildRows(movements: Movement[], currentUser: CurrentUser): Row[] {
  return movements
    .filter((m) => {
      if (currentUser.role === 'admin') return true;
      return m.created_by === currentUser.name;
    })
    .map((m) => {
      const respondidas = m.selected_teams.filter((id) => m.responses[id]?.status === 'completed');
      const pendentes = m.selected_teams.filter((id) => m.responses[id]?.status !== 'completed');
      const statusLabel = pendentes.length === 0 ? 'Aprovado' : 'Pendente';

      // mapa de status por equipe para uso no filtro
      const teamStatus: Record<string, 'completed' | 'pending'> = {};
      m.selected_teams.forEach(id => {
        teamStatus[id] = m.responses[id]?.status === 'completed' ? 'completed' : 'pending';
      });

      return {
        _id: m.id,
        _type: m.type,
        _teams: m.selected_teams,
        _status: statusLabel,
        _teamStatus: teamStatus,
        Nome: m.employee_name,
        Tipo: MOVEMENT_TYPE_MAP[m.type] || m.type,
        'Criado por': m.created_by,
        'Data de criação': new Date(m.created_at).toLocaleDateString('pt-BR'),
        Status: statusLabel,
        'Faltam parecer': pendentes.length === 0 ? '—' : pendentes.map((id) => TEAMS_MAP[id] || id).join(', '),
        'Com pareceres emitidos': respondidas.length === 0 ? '—' : respondidas.map((id) => TEAMS_MAP[id] || id).join(', '),
      };
    });
}

/**
 * Decide se uma row passa no filtro combinado de equipe + status.
 *
 * Sem equipe selecionada (filterTeam === 'all'):
 *   - usa o status geral da movimentação (todos responderam = Aprovado)
 *
 * Com equipe selecionada:
 *   - a movimentação precisa incluir aquela equipe
 *   - filterStatus 'all'     → passa sempre (independente do parecer da equipe)
 *   - filterStatus 'Aprovado' → passa só se aquela equipe JÁ deu o parecer
 *   - filterStatus 'Pendente' → passa só se aquela equipe AINDA NÃO deu o parecer
 */
function matchesTeamStatus(row: Row, filterTeam: string, filterStatus: string): boolean {
  if (filterTeam === 'all') {
    // sem filtro de equipe: usa status geral
    if (filterStatus !== 'all' && row._status !== filterStatus) return false;
    return true;
  }

  // a movimentação precisa envolver a equipe
  if (!row._teams.includes(filterTeam)) return false;

  if (filterStatus === 'all') return true;

  const teamResponded = row._teamStatus[filterTeam] === 'completed';

  if (filterStatus === 'Aprovado') return teamResponded;
  if (filterStatus === 'Pendente') return !teamResponded;

  return true;
}

interface RelatorioViewProps {
  currentUser: CurrentUser;
  movements: Movement[];
  loading: boolean;
}

export default function RelatorioView({ currentUser, movements, loading }: RelatorioViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [exporting, setExporting] = useState(false);

  const allRows = useMemo(() => buildRows(movements, currentUser), [movements, currentUser]);

  // ── Contadores intercalados ──────────────────────────────────────────
  // Cada coluna conta considerando os outros dois filtros já ativos.

  // Para contar status: aplica filtro de tipo e equipe (com a lógica especial de equipe+status)
  const rowsForStatusCount = useMemo(() =>
    allRows.filter(r => {
      if (filterType !== 'all' && r._type !== filterType) return false;
      // usa filterTeam mas ignora filterStatus (estamos contando por status)
      if (filterTeam !== 'all' && !r._teams.includes(filterTeam)) return false;
      return true;
    }), [allRows, filterType, filterTeam]);

  // Para contar tipos: aplica filtro de status+equipe
  const rowsForTypeCount = useMemo(() =>
    allRows.filter(r => {
      if (!matchesTeamStatus(r, filterTeam, filterStatus)) return false;
      return true;
    }), [allRows, filterTeam, filterStatus]);

  // Para contar equipes: aplica filtro de tipo e status geral
  const rowsForTeamCount = useMemo(() =>
    allRows.filter(r => {
      if (filterType !== 'all' && r._type !== filterType) return false;
      // sem filtro de equipe, usa status geral
      if (filterStatus !== 'all' && r._status !== filterStatus) return false;
      return true;
    }), [allRows, filterType, filterStatus]);

  // ── Resultado final ──────────────────────────────────────────────────
  const filtered = useMemo(() =>
    allRows.filter(r => {
      if (filterType !== 'all' && r._type !== filterType) return false;
      if (!matchesTeamStatus(r, filterTeam, filterStatus)) return false;
      return true;
    }), [allRows, filterType, filterTeam, filterStatus]);

  // ── Export ───────────────────────────────────────────────────────────
  const handleExport = () => {
    setExporting(true);
    try {
      const exportData = filtered.map(({ _id, _type, _teams, _status, _teamStatus, ...rest }) => rest);
      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 25 }, { wch: 18 }, { wch: 12 }, { wch: 45 }, { wch: 45 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Movimentações');
      const today = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      XLSX.writeFile(wb, `relatorio-movimentacoes-${today}.xlsx`);
    } catch (e) {
      console.error('Erro ao exportar:', e);
      alert('Erro ao gerar o arquivo Excel.');
    } finally {
      setExporting(false);
    }
  };

  const btnClass = (active: boolean) =>
    `py-1.5 px-3 rounded-lg text-sm font-medium border transition text-left ${
      active
        ? 'bg-blue-100 text-blue-800 border-blue-400 border-2'
        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
    }`;

  // legenda explicativa quando equipe está selecionada
  const showTeamStatusHint = filterTeam !== 'all';
  const selectedTeamName = TEAMS_LIST.find(t => t.id === filterTeam)?.name ?? '';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Relatório de Movimentações</h2>
          <p className="text-sm text-gray-600 mt-1">
            {currentUser.role === 'admin' ? 'Todas as movimentações do sistema' : 'Movimentações que você criou'}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
        >
          {exporting
            ? <><Loader2 className="w-4 h-4 animate-spin" />Exportando...</>
            : <><FileSpreadsheet className="w-4 h-4" />Exportar Excel</>}
        </button>
      </div>

      {/* Botão limpar filtros */}
      {(filterStatus !== 'all' || filterType !== 'all' || filterTeam !== 'all') && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => { setFilterStatus('all'); setFilterType('all'); setFilterTeam('all'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition"
          >
            ✕ Limpar filtros
          </button>
        </div>
      )}

      {/* Hint quando equipe selecionada */}
      {showTeamStatusHint && (
        <div className="mb-4 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
          <strong>{selectedTeamName}</strong> selecionada —
          {' '}Status <strong>Aprovado</strong> mostra movimentações em que essa equipe já deu o parecer;
          {' '}Status <strong>Pendente</strong> mostra onde ainda não deu.
        </div>
      )}

      {/* Filtros intercalados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Status</label>
          <div className="flex flex-col gap-1.5">
            <button onClick={() => setFilterStatus('all')} className={btnClass(filterStatus === 'all')}>
              Todos ({rowsForStatusCount.length})
            </button>
            {(['Pendente', 'Aprovado'] as const).map((opt) => {
              // contar usando a lógica correta por equipe
              const count = rowsForStatusCount.filter(r => {
                if (filterTeam === 'all') return r._status === opt;
                const teamResponded = r._teamStatus[filterTeam] === 'completed';
                return opt === 'Aprovado' ? teamResponded : !teamResponded;
              }).length;
              return (
                <button
                  key={opt}
                  onClick={() => setFilterStatus(filterStatus === opt ? 'all' : opt)}
                  className={btnClass(filterStatus === opt)}
                >
                  {opt === 'Pendente' ? '⏳' : '✓'} {opt} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Tipo</label>
          <div className="flex flex-col gap-1.5">
            <button onClick={() => setFilterType('all')} className={btnClass(filterType === 'all')}>
              Todos ({rowsForTypeCount.length})
            </button>
            {MOVEMENT_TYPES.map((t) => {
              const count = rowsForTypeCount.filter(r => r._type === t.id).length;
              return (
                <button
                  key={t.id}
                  onClick={() => setFilterType(filterType === t.id ? 'all' : t.id)}
                  className={btnClass(filterType === t.id)}
                >
                  {t.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Equipe */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Equipe</label>
          <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
            <button onClick={() => setFilterTeam('all')} className={btnClass(filterTeam === 'all')}>
              Todas ({rowsForTeamCount.length})
            </button>
            {TEAMS_LIST.map((t) => {
              const count = rowsForTeamCount.filter(r => r._teams.includes(t.id)).length;
              if (count === 0) return null;
              return (
                <button
                  key={t.id}
                  onClick={() => setFilterTeam(filterTeam === t.id ? 'all' : t.id)}
                  className={btnClass(filterTeam === t.id)}
                >
                  {t.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Nenhuma movimentação encontrada para os filtros selecionados.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                {['Nome', 'Tipo', 'Criado por', 'Data de criação', 'Status', 'Faltam parecer', 'Com pareceres emitidos'].map((col) => (
                  <th key={col} className="px-3 py-3 font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={row._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-3 border-b border-gray-100 font-medium text-gray-900 whitespace-nowrap">{row.Nome}</td>
                  <td className="px-3 py-3 border-b border-gray-100 text-gray-600 whitespace-nowrap">{row.Tipo}</td>
                  <td className="px-3 py-3 border-b border-gray-100 text-gray-600 whitespace-nowrap">{row['Criado por']}</td>
                  <td className="px-3 py-3 border-b border-gray-100 text-gray-600 whitespace-nowrap">{row['Data de criação']}</td>
                  <td className="px-3 py-3 border-b border-gray-100 whitespace-nowrap">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${row.Status === 'Aprovado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {row.Status === 'Aprovado' ? '✓ Aprovado' : '⏳ Pendente'}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-b border-gray-100">
                    {row['Faltam parecer'] === '—'
                      ? <span className="text-gray-400">—</span>
                      : <span className="text-red-700">{row['Faltam parecer']}</span>}
                  </td>
                  <td className="px-3 py-3 border-b border-gray-100">
                    {row['Com pareceres emitidos'] === '—'
                      ? <span className="text-gray-400">—</span>
                      : <span className="text-green-700">{row['Com pareceres emitidos']}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-3">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      )}
    </div>
  );
}
