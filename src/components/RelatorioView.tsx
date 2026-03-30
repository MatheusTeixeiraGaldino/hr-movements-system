// src/components/RelatorioView.tsx
// Módulo de Relatório — acessível por admin e responsável
// Exporta tabela para Excel com colunas:
// Nome | Criado por | Data de criação | Status | Faltam parecer | Com pareceres emitidos

import React, { useMemo, useState } from 'react';
import { Download, Loader2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── tipos mínimos necessários ────────────────────────────────
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

const TEAMS: Record<string, string> = {
  rh: 'Recursos Humanos',
  ponto: 'Ponto',
  transporte: 'Transporte',
  ti: 'T.I',
  comunicacao: 'Comunicação',
  seguranca: 'Segurança do Trabalho',
  ambulatorio: 'Ambulatório',
  financeiro: 'Financeiro',
  dp: 'DP',
  treinamento: 'Treinamento e Desenvolvimento',
};

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  demissao: 'Demissão',
  transferencia: 'Transferência',
  alteracao: 'Alteração Salarial',
  promocao: 'Promoção',
};

// ─── helpers ──────────────────────────────────────────────────
function buildRows(movements: Movement[], currentUser: CurrentUser) {
  return movements
    .filter((m) => {
      if (currentUser.role === 'admin') return true;
      // responsável vê apenas movimentações que criou
      return m.created_by === currentUser.name;
    })
    .map((m) => {
      const totalTeams = m.selected_teams.length;
      const respondidas = m.selected_teams.filter(
        (id) => m.responses[id]?.status === 'completed'
      );
      const pendentes = m.selected_teams.filter(
        (id) => m.responses[id]?.status !== 'completed'
      );

      const allDone = pendentes.length === 0;
      const statusLabel = allDone ? 'Aprovado' : 'Pendente';

      const pendentesNomes = pendentes
        .map((id) => TEAMS[id] || id)
        .join(', ');
      const respondidasNomes = respondidas
        .map((id) => TEAMS[id] || id)
        .join(', ');

      const tipo = MOVEMENT_TYPE_LABELS[m.type] || m.type;

      return {
        _id: m.id,
        Nome: m.employee_name,
        Tipo: tipo,
        'Criado por': m.created_by,
        'Data de criação': new Date(m.created_at).toLocaleDateString('pt-BR'),
        Status: statusLabel,
        'Faltam parecer': pendentes.length === 0 ? '—' : pendentesNomes,
        'Com pareceres emitidos':
          respondidas.length === 0 ? '—' : respondidasNomes,
        _pendentes: pendentes.length,
        _total: totalTeams,
      };
    });
}

// ─── componente principal ─────────────────────────────────────
interface RelatorioViewProps {
  currentUser: CurrentUser;
  movements: Movement[];
  loading: boolean;
}

export default function RelatorioView({
  currentUser,
  movements,
  loading,
}: RelatorioViewProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'Aprovado' | 'Pendente'>('all');
  const [exporting, setExporting] = useState(false);

  const rows = useMemo(() => buildRows(movements, currentUser), [movements, currentUser]);

  const filtered = useMemo(
    () =>
      filterStatus === 'all'
        ? rows
        : rows.filter((r) => r.Status === filterStatus),
    [rows, filterStatus]
  );

  const handleExport = () => {
    setExporting(true);
    try {
      // Colunas visíveis (sem campos internos prefixados com _)
      const exportData = filtered.map(({ _id, _pendentes, _total, ...rest }) => rest);

      const ws = XLSX.utils.json_to_sheet(exportData);

      // Larguras de coluna
      ws['!cols'] = [
        { wch: 30 }, // Nome
        { wch: 20 }, // Tipo
        { wch: 25 }, // Criado por
        { wch: 18 }, // Data de criação
        { wch: 12 }, // Status
        { wch: 45 }, // Faltam parecer
        { wch: 45 }, // Com pareceres emitidos
      ];

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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Relatório de Movimentações</h2>
          <p className="text-sm text-gray-600 mt-1">
            {currentUser.role === 'admin'
              ? 'Todas as movimentações do sistema'
              : 'Movimentações que você criou'}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Excel
            </>
          )}
        </button>
      </div>

      {/* Filtros de status */}
      <div className="flex gap-2 mb-5">
        {(['all', 'Pendente', 'Aprovado'] as const).map((opt) => {
          const count =
            opt === 'all'
              ? rows.length
              : rows.filter((r) => r.Status === opt).length;
          const active = filterStatus === opt;
          const colors: Record<string, string> = {
            all: active
              ? 'bg-blue-100 text-blue-800 border-2 border-blue-400'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            Pendente: active
              ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            Aprovado: active
              ? 'bg-green-100 text-green-800 border-2 border-green-400'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          };
          const labels: Record<string, string> = {
            all: `Todas (${count})`,
            Pendente: `⏳ Pendentes (${count})`,
            Aprovado: `✓ Aprovadas (${count})`,
          };
          return (
            <button
              key={opt}
              onClick={() => setFilterStatus(opt)}
              className={`py-2 px-4 rounded-lg font-medium text-sm transition ${colors[opt]}`}
            >
              {labels[opt]}
            </button>
          );
        })}
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Nenhuma movimentação encontrada.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                {[
                  'Nome',
                  'Tipo',
                  'Criado por',
                  'Data de criação',
                  'Status',
                  'Faltam parecer',
                  'Com pareceres emitidos',
                ].map((col) => (
                  <th
                    key={col}
                    className="px-3 py-3 font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr
                  key={row._id}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-3 py-3 border-b border-gray-100 font-medium text-gray-900 whitespace-nowrap">
                    {row.Nome}
                  </td>
                  <td className="px-3 py-3 border-b border-gray-100 text-gray-600 whitespace-nowrap">
                    {row.Tipo}
                  </td>
                  <td className="px-3 py-3 border-b border-gray-100 text-gray-600 whitespace-nowrap">
                    {row['Criado por']}
                  </td>
                  <td className="px-3 py-3 border-b border-gray-100 text-gray-600 whitespace-nowrap">
                    {row['Data de criação']}
                  </td>
                  <td className="px-3 py-3 border-b border-gray-100 whitespace-nowrap">
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        row.Status === 'Aprovado'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {row.Status === 'Aprovado' ? '✓ Aprovado' : '⏳ Pendente'}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-b border-gray-100 text-gray-600">
                    {row['Faltam parecer'] === '—' ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <span className="text-red-700">{row['Faltam parecer']}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 border-b border-gray-100 text-gray-600">
                    {row['Com pareceres emitidos'] === '—' ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <span className="text-green-700">
                        {row['Com pareceres emitidos']}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-3">
            {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
