import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ConfiguracaoDossie } from '../types/dossie';

interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function DossieConfigView() {
  const [config, setConfig] = useState<ConfiguracaoDossie | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedUsuarios, setSelectedUsuarios] = useState<string[]>([]);
  const [selectedPerfis, setSelectedPerfis] = useState<string[]>([]);
  const [ativo, setAtivo] = useState(true);

  const PERFIS_DISPONIVEIS = [
    { id: 'admin', label: 'Administrador' },
    { id: 'responsavel', label: 'Responsável' },
    { id: 'team_member', label: 'Membro da Equipe' },
  ];

  useEffect(() => {
    loadConfig();
    loadUsuarios();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error: err } = await supabase
        .from('configuracao_dossie')
        .select('*')
        .limit(1)
        .single();

      if (err && err.code !== 'PGRST116') throw err; // PGRST116 = no rows

      if (data) {
        setConfig(data);
        setSelectedUsuarios(data.usuarios_autorizados || []);
        setSelectedPerfis(data.perfis_autorizados || []);
        setAtivo(data.ativo);
      }
    } catch (err: any) {
      console.error('Erro ao carregar configuração:', err);
      setError('Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  };

  const loadUsuarios = async () => {
    try {
      const { data, error: err } = await supabase
        .from('users')
        .select('id, name, email, role')
        .order('name');

      if (err) throw err;
      setUsuarios(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const emails = usuarios
        .filter(u => selectedUsuarios.includes(u.id))
        .map(u => u.email);

      const configData = {
        usuarios_autorizados: selectedUsuarios,
        emails_autorizados: emails,
        perfis_autorizados: selectedPerfis,
        ativo: ativo,
        data_atualizacao: new Date().toISOString(),
      };

      if (config) {
        // Atualizar configuração existente
        const { error: err } = await supabase
          .from('configuracao_dossie')
          .update(configData)
          .eq('id', config.id);

        if (err) throw err;
        setSuccess('Configuração atualizada com sucesso!');
      } else {
        // Criar nova configuração
        const { error: err } = await supabase
          .from('configuracao_dossie')
          .insert([
            {
              ...configData,
              data_criacao: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (err) throw err;
        setSuccess('Configuração criada com sucesso!');
      }

      await loadConfig();
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao salvar configuração';
      setError(errorMsg);
      console.error('Erro:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleUsuario = (usuarioId: string) => {
    setSelectedUsuarios(prev =>
      prev.includes(usuarioId) ? prev.filter(id => id !== usuarioId) : [...prev, usuarioId]
    );
  };

  const togglePerfil = (perfil: string) => {
    setSelectedPerfis(prev =>
      prev.includes(perfil) ? prev.filter(p => p !== perfil) : [...prev, perfil]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Configuração - Acompanhamento Dossiê
        </h1>
        <p className="text-gray-600 mt-1">Defina quem pode acessar e gerenciar o módulo de dossiê</p>
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Status do Módulo</h3>
            <p className="text-sm text-gray-600 mt-1">
              {ativo ? 'O módulo está ativo e acessível' : 'O módulo está desativado'}
            </p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={ativo}
              onChange={e => setAtivo(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">
              {ativo ? 'Ativo' : 'Inativo'}
            </span>
          </label>
        </div>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Erro</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-900">Sucesso</p>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Autorização por Perfil */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Autorizar por Perfil de Usuário</h3>
        <p className="text-sm text-gray-600 mb-4">
          Selecione quais perfis têm acesso automático ao módulo de dossiê
        </p>

        <div className="space-y-3">
          {PERFIS_DISPONIVEIS.map(perfil => (
            <label
              key={perfil.id}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
            >
              <input
                type="checkbox"
                checked={selectedPerfis.includes(perfil.id)}
                onChange={() => togglePerfil(perfil.id)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <div>
                <p className="font-medium text-gray-900">{perfil.label}</p>
                <p className="text-xs text-gray-600">
                  {perfil.id === 'admin' && 'Todos os administradores'}
                  {perfil.id === 'responsavel' && 'Todos os responsáveis'}
                  {perfil.id === 'team_member' && 'Todos os membros de equipe'}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Autorização por Usuário Individual */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Autorizar Usuários Específicos</h3>
        <p className="text-sm text-gray-600 mb-4">
          Selecione usuários individuais que podem acessar o módulo de dossiê
        </p>

        <div className="max-h-96 overflow-y-auto border rounded-lg">
          {usuarios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum usuário cadastrado</p>
            </div>
          ) : (
            <div className="divide-y">
              {usuarios.map(usuario => (
                <label
                  key={usuario.id}
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsuarios.includes(usuario.id)}
                    onChange={() => toggleUsuario(usuario.id)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{usuario.name}</p>
                    <p className="text-sm text-gray-600">{usuario.email}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full whitespace-nowrap">
                    {usuario.role === 'admin'
                      ? 'Admin'
                      : usuario.role === 'responsavel'
                      ? 'Responsável'
                      : 'Membro'}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-600 mt-3">
          {selectedUsuarios.length} usuário{selectedUsuarios.length !== 1 ? 's' : ''} selecionado{selectedUsuarios.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Resumo de Acesso */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Resumo de Acesso</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>Perfis autorizados:</strong>{' '}
            {selectedPerfis.length > 0
              ? selectedPerfis
                  .map(p => PERFIS_DISPONIVEIS.find(pf => pf.id === p)?.label)
                  .join(', ')
              : 'Nenhum'}
          </p>
          <p>
            <strong>Usuários autorizados:</strong>{' '}
            {selectedUsuarios.length > 0
              ? `${selectedUsuarios.length} usuário${selectedUsuarios.length !== 1 ? 's' : ''}`
              : 'Nenhum'}
          </p>
          <p>
            <strong>Total de usuários com acesso:</strong>{' '}
            {selectedPerfis.length > 0
              ? `${usuarios.filter(u => selectedPerfis.includes(u.role)).length} (por perfil) + ${selectedUsuarios.length} (individuais)`
              : selectedUsuarios.length}
          </p>
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Salvar Configuração
            </>
          )}
        </button>
      </div>

      {/* Informações Adicionais */}
      <div className="bg-gray-50 rounded-lg p-6 border">
        <h4 className="font-semibold text-gray-900 mb-3">ℹ️ Informações Importantes</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>
            • <strong>Criação automática:</strong> Dossiês são criados automaticamente quando uma movimentação de desligamento é registrada
          </li>
          <li>
            • <strong>Permissões:</strong> Apenas usuários autorizados podem visualizar e editar dossiês
          </li>
          <li>
            • <strong>Auditoria:</strong> Todas as ações são registradas no histórico de auditoria
          </li>
          <li>
            • <strong>Validações:</strong> O sistema valida automaticamente a exclusividade entre ASO e Declaração de Não Realização
          </li>
          <li>
            • <strong>Status:</strong> O status do dossiê é atualizado automaticamente conforme documentos são marcados
          </li>
        </ul>
      </div>
    </div>
  );
}
