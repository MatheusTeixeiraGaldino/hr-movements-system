import React, { useState } from 'react';
import { Users, LogOut, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  can_manage_demissoes: boolean;
  can_manage_transferencias: boolean;
  team_id: string;
  team_name: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loadingLogin, setLoadingLogin] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoadingLogin(true);
      setError('');

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email.toLowerCase())
          .eq('password', password)
          .single();

        if (error || !data) {
          setError('Email ou senha incorretos');
          return;
        }

        setCurrentUser(data);
      } catch (err) {
        setError('Erro ao fazer login');
      } finally {
        setLoadingLogin(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Sistema de Movimentações</h1>
            <p className="text-gray-600 mt-2">Gestão de Colaboradores</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="seu@email.com"
                  required
                  disabled={loadingLogin}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                  disabled={loadingLogin}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loadingLogin}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
            >
              {loadingLogin ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  };

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Sistema de Movimentações</h1>
                <p className="text-sm text-gray-600">Gestão de Colaboradores</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.team_name}</p>
              </div>
              <button 
                onClick={() => setCurrentUser(null)} 
                className="text-gray-600 hover:text-gray-900"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Dashboard</h2>
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">✅ Sistema funcionando!</p>
              <p className="text-green-700 text-sm mt-1">Login realizado com sucesso</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900"><strong>Usuário:</strong> {currentUser.email}</p>
              <p className="text-sm text-blue-900"><strong>Nome:</strong> {currentUser.name}</p>
              <p className="text-sm text-blue-900"><strong>Equipe:</strong> {currentUser.team_name}</p>
              <p className="text-sm text-blue-900"><strong>Tipo:</strong> {currentUser.role === 'admin' ? 'Administrador' : 'Membro da Equipe'}</p>
            </div>

            {currentUser.role === 'admin' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-purple-800 font-medium">🔐 Permissões de Administrador</p>
                <ul className="text-sm text-purple-700 mt-2 space-y-1">
                  <li>• Gerenciar Demissões: {currentUser.can_manage_demissoes ? '✅ Sim' : '❌ Não'}</li>
                  <li>• Gerenciar Transferências: {currentUser.can_manage_transferencias ? '✅ Sim' : '❌ Não'}</li>
                </ul>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">⚠️ Sistema em desenvolvimento</p>
              <p className="text-yellow-700 text-sm mt-1">As funcionalidades completas serão adicionadas em breve.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
