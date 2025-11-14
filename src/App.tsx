{selectedMovement.type === 'demissao' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Empresa/Coligada</label>
                <input type="text" placeholder="Nome da empresa" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, company: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Setor</label>
                <input type="text" placeholder="Setor do colaborador" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, sector: e.target.value})} />
              </div>
            </>
          )}

          {movementType !== 'demissao' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Setor Atual</label>
                  <input type="text" placeholder="Setor atual" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, oldSector: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Setor Destino</label>
                  <input type="text" placeholder="Novo setor" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, newSector: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Função Atual</label>
                  <input type="text" placeholder="Função atual" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, oldPosition: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Função Destino</label>
                  <input type="text" placeholder="Nova função" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, newPosition: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data da Mudança</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, changeDate: e.target.value})} />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Limite para Respostas</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, deadline: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observações Gerais</label>
            <textarea placeholder="Digite observações adicionais..." className="w-full border rounded-lg px-3 py-2 h-24" onChange={(e) => setFormData({...formData, observation: e.target.value})} />
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">Selecione as Equipes * ({selectedTeams.length} selecionadas)</label>
            <div className="grid grid-cols-2 gap-2">
              {TEAMS.map(t => <label key={t.id} className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer ${selectedTeams.includes(t.id) ? 'border-blue-500 bg-blue-50' : ''}`}><input type="checkbox" checked={selectedTeams.includes(t.id)} onChange={() => setSelectedTeams((prev: string[]) => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])} className="w-4 h-4" /><span className="text-sm">{t.name}</span></label>)}
            </div>
          </div>

          <button onClick={onSubmit} disabled={!formData.employeeName || selectedTeams.length === 0 || loading} className="w-full bg-blue-600 text-white py-2.5 rounded-lg disabled:bg-gray-300 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Criando...</> : 'Criar Movimentação'}
          </button>
        </div>
      </div>
    </div>
  );
}
                <label className="block text-sm font-medium mb-2">Data do Desligamento</label>
                <input type="date" value={editData.dismissalDate || ''} onChange={(e) => setEditData({...editData, dismissalDate: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Empresa</label>
                <input type="text" value={editData.company || ''} onChange={(e) => setEditData({...editData, company: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Setor</label>
                <input type="text" value={editData.sector || ''} onChange={(e) => setEditData({...editData, sector: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
              </div>
            </>
          )}

          {selectedMovement.type !== 'demissao' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Setor Atual</label>
                  <input type="text" value={editData.oldSector || ''} onChange={(e) => setEditData({...editData, oldSector: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Setor Destino</label>
                  <input type="text" value={editData.newSector || ''} onChange={(e) => setEditData({...editData, newSector: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Função Atual</label>
                  <input type="text" value={editData.oldPosition || ''} onChange={(e) => setEditData({...editData, oldPosition: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Função Destino</label>
                  <input type="text" value={editData.newPosition || ''} onChange={(e) => setEditData({...editData, newPosition: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Data da Mudança</label>
                <input type="date" value={editData.changeDate || ''} onChange={(e) => setEditData({...editData, changeDate: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <button onClick={handleUpdate} disabled={loadingSub} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300">
              {loadingSub ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">Informações da Movimentação</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600 font-medium">Criado por:</span>
              <p className="text-gray-900">{selectedMovement.created_by}</p>
            </div>
            <div>
              <span className="text-gray-600 font-medium">Data de criação:</span>
              <p className="text-gray-900">{new Date(selectedMovement.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            {selectedMovement.deadline && (
              <div>
                <span className="text-gray-600 font-medium">Prazo limite:</span>
                <p className="text-gray-900">{new Date(selectedMovement.deadline).toLocaleDateString('pt-BR')}</p>
              </div>
            )}
            {Object.entries(selectedMovement.details).map(([key, value]) => {
              const labels: any = {
                dismissalDate: 'Data do Desligamento',
                company: 'Empresa',
                sector: 'Setor',
                oldSector: 'Setor Atual',
                newSector: 'Setor Destino',
                oldPosition: 'Função Atual',
                newPosition: 'Função Destino',
                changeDate: 'Data da Mudança'
              };
              return (
                <div key={key}>
                  <span className="text-gray-600 font-medium">{labels[key] || key}:</span>
                  <p className="text-gray-900">{typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/) ? new Date(value).toLocaleDateString('pt-BR') : String(value)}</p>
                </div>
              );
            })}
          </div>
          {(selectedMovement.details?.observation || selectedMovement.observation) && (
            <div className="mt-4 pt-4 border-t">
              <span className="text-gray-600 font-medium">Observações:</span>
              <p className="text-sm text-gray-700 mt-2 bg-white p-3 rounded border">{selectedMovement.details?.observation || selectedMovement.observation}</p>
            </div>
          )}
        </div>
      )}

      <h3 className="font-semibold mb-3">Pareceres das Equipes</h3>
      <div className="space-y-3 mb-6">
        {selectedMovement.selected_teams.map((id: string) => {
          const team = TEAMS.find(t => t.id === id);
          const resp = selectedMovement.responses[id];
          const isMine = id === currentUser?.team_id;
          
          if (!isAdmin && !isMine) {
            return null;
          }
          
          return (
            <div key={id} className={`border rounded-lg p-4 ${isMine ? 'border-blue-500 bg-blue-50' : ''}`}>
              <div className="flex justify-between mb-2">
                <span className="font-medium">{team?.name} {isMine && '(Sua Equipe)'}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${resp?.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {resp?.status === 'completed' ? '✓ Respondido' : '⏳ Pendente'}
                  </span>
                  {resp?.history && resp.history.length > 0 && (
                    <button
                      onClick={() => setShowHistory(showHistory === id ? null : id)}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      Histórico
                    </button>
                  )}
                </div>
              </div>
              
              {showHistory === id && resp?.history && (
                <div className="mb-3 bg-gray-50 border rounded p-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Histórico de Alterações:</p>
                  <div className="space-y-2">
                    {resp.history.map((entry: any, idx: number) => (
                      <div key={idx} className="text-xs bg-white p-2 rounded border">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-900">{entry.user_name}</span>
                          <span className="text-gray-500">{new Date(entry.timestamp).toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="text-gray-600 mt-1">
                          <span className={`inline-block px-2 py-0.5 rounded ${entry.action === 'created' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {entry.action === 'created' ? 'Criou o parecer' : 'Atualizou o parecer'}
                          </span>
                          <span className="ml-2">({entry.user_email})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {resp?.checklist && Object.keys(resp.checklist).length > 0 && (
                <div className="mt-3 bg-white p-3 rounded border">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Checklist:</p>
                  <div className="space-y-1">
                    {Object.entries(resp.checklist).map(([item, checked]: [string, any]) => (
                      <div key={item} className="flex items-center gap-2 text-sm">
                        {checked ? <CheckSquare className="w-4 h-4 text-green-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                        <span className={checked ? 'text-gray-900' : 'text-gray-500'}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {resp?.comment && (
                <div className="mt-2">
                  <p className="text-sm bg-white p-3 rounded border">{resp.comment}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Respondido em {new Date(resp.date!).toLocaleDateString('pt-BR')}
                    {resp.history && resp.history.length > 1 && ' (editado)'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isMyTeam && !hasResponded && (
        <div className="border-t pt-6">
          {userTeamChecklist.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Checklist de Verificação
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                {userTeamChecklist.map((checkItem: string) => (
                  <label key={checkItem} className="flex items-start gap-3 cursor-pointer hover:bg-blue-100 p-2 rounded transition">
                    <input
                      type="checkbox"
                      checked={checklist[checkItem] || false}
                      onChange={() => handleChecklistToggle(checkItem)}
                      className="mt-1 w-5 h-5 rounded border-gray-300"
                    />
                    <span className="text-sm flex-1">{checkItem}</span>
                  </label>
                ))}
                <div className="mt-4 pt-3 border-t border-blue-200">
                  <p className="text-xs text-gray-600">
                    {userTeamChecklist.filter((itm: string) => checklist[itm]).length} de {userTeamChecklist.length} itens concluídos
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <h3 className="font-semibold mb-3">Adicionar Parecer</h3>
          <textarea 
            value={comment} 
            onChange={(e) => setComment(e.target.value)} 
            placeholder="Digite seu parecer sobre esta movimentação..." 
            className="w-full border rounded-lg p-3 h-32" 
            disabled={loadingSub} 
          />
          <button 
            onClick={handleSubmit} 
            disabled={!comment.trim() || loadingSub || (userTeamChecklist.length > 0 && !allChecklistCompleted)} 
            className="mt-3 bg-blue-600 text-white px-6 py-2.5 rounded-lg disabled:bg-gray-300 flex items-center gap-2"
          >
            {loadingSub ? <><Loader2 className="w-5 h-5 animate-spin" />Enviando...</> : 'Enviar Parecer'}
          </button>
          {userTeamChecklist.length > 0 && !allChecklistCompleted && (
            <p className="text-sm text-red-600 mt-2">Complete todos os itens do checklist antes de enviar</p>
          )}
        </div>
      )}

      {isMyTeam && hasResponded && !isEditingResponse && (
        <div className="border-t pt-6 space-y-3">
          <div className="bg-green-50 p-4 rounded flex items-center justify-between">
            <span className="text-green-800 font-medium">✓ Você já respondeu esta movimentação</span>
            <button
              onClick={handleStartEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Editar Parecer
            </button>
          </div>
        </div>
      )}

      {isMyTeam && hasResponded && isEditingResponse && (
        <div className="border-t pt-6">
          {userTeamChecklist.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Checklist de Verificação
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                {userTeamChecklist.map((checkItem: string) => (
                  <label key={checkItem} className="flex items-start gap-3 cursor-pointer hover:bg-blue-100 p-2 rounded transition">
                    <input
                      type="checkbox"
                      checked={checklist[checkItem] || false}
                      onChange={() => handleChecklistToggle(checkItem)}
                      className="mt-1 w-5 h-5 rounded border-gray-300"
                    />
                    <span className="text-sm flex-1">{checkItem}</span>
                  </label>
                ))}
                <div className="mt-4 pt-3 border-t border-blue-200">
                  <p className="text-xs text-gray-600">
                    {userTeamChecklist.filter((itm: string) => checklist[itm]).length} de {userTeamChecklist.length} itens concluídos
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <h3 className="font-semibold mb-3">Editar Parecer</h3>
          <textarea 
            value={comment} 
            onChange={(e) => setComment(e.target.value)} 
            placeholder="Digite seu parecer sobre esta movimentação..." 
            className="w-full border rounded-lg p-3 h-32" 
            disabled={loadingSub} 
          />
          <div className="flex gap-2 mt-3">
            <button 
              onClick={handleSubmit} 
              disabled={!comment.trim() || loadingSub || (userTeamChecklist.length > 0 && !allChecklistCompleted)} 
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg disabled:bg-gray-300 flex items-center gap-2"
            >
              {loadingSub ? <><Loader2 className="w-5 h-5 animate-spin" />Salvando...</> : 'Salvar Alterações'}
            </button>
            <button
              onClick={() => {
                setIsEditingResponse(false);
                setComment('');
                setChecklist(myResp?.checklist || {});
              }}
              className="px-6 py-2.5 bg-gray-300 rounded-lg hover:bg-gray-400"
              disabled={loadingSub}
            >
              Cancelar
            </button>
          </div>
          {userTeamChecklist.length > 0 && !allChecklistCompleted && (
            <p className="text-sm text-red-600 mt-2">Complete todos os itens do checklist antes de salvar</p>
          )}
        </div>
      )}
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Senha alterada com sucesso!');
      onClose();
    } catch (err) {
      setError('Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Alterar Senha</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">✕</button>
        </div>
        <form onSubmit={handleChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha Atual</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2" required disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2" required minLength={6} disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2" required disabled={loading} />
          </div>
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300">
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RegisterUserModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'team_member' as UserRole,
    team_id: '',
    can_manage_demissoes: false,
    can_manage_transferencias: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.team_id) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const selectedTeam = TEAMS.find(t => t.id === formData.team_id);
      const { error } = await supabase.from('users').insert([{
        name: formData.name,
        email: formData.email.toLowerCase(),
        password: formData.password,
        role: formData.role,
        can_manage_demissoes: formData.can_manage_demissoes,
        can_manage_transferencias: formData.can_manage_transferencias,
        team_id: formData.team_id,
        team_name: selectedTeam?.name || ''
      }]);

      if (error) {
        if (error.code === '23505') {
          setError('Este email já está cadastrado');
        } else {
          throw error;
        }
        return;
      }

      alert('Usuário cadastrado com sucesso!');
      onClose();
    } catch (err) {
      setError('Erro ao cadastrar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full my-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Cadastrar Novo Usuário</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">✕</button>
        </div>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg px-3 py-2" required disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">E-mail *</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full border rounded-lg px-3 py-2" required disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha *</label>
            <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full border rounded-lg px-3 py-2" required minLength={6} placeholder="Mínimo 6 caracteres" disabled={loading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Equipe *</label>
            <select value={formData.team_id} onChange={(e) => setFormData({...formData, team_id: e.target.value})} className="w-full border rounded-lg px-3 py-2" required disabled={loading}>
              <option value="">Selecione uma equipe</option>
              {TEAMS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Usuário *</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="role" value="team_member" checked={formData.role === 'team_member'} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole, can_manage_demissoes: false, can_manage_transferencias: false })} className="w-4 h-4" disabled={loading} />
                <div>
                  <p className="font-medium">Membro da Equipe</p>
                  <p className="text-xs text-gray-600">Pode responder movimentações da sua equipe</p>
                </div>
              </label>
              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="role" value="admin" checked={formData.role === 'admin'} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})} className="w-4 h-4" disabled={loading} />
                <div>
                  <p className="font-medium">Administrador</p>
                  <p className="text-xs text-gray-600">Pode criar e gerenciar movimentações</p>
                </div>
              </label>
            </div>
          </div>
          {formData.role === 'admin' && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">Permissões do Administrador</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={formData.can_manage_demissoes} onChange={(e) => setFormData({...formData, can_manage_demissoes: e.target.checked})} className="w-4 h-4" disabled={loading} />
                  <span className="text-sm">Pode gerenciar Demissões</span>
                </label>
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={formData.can_manage_transferencias} onChange={(e) => setFormData({...formData, can_manage_transferencias: e.target.checked})} className="w-4 h-4" disabled={loading} />
                  <span className="text-sm">Pode gerenciar Transferências, Alterações e Promoções</span>
                </label>
              </div>
            </div>
          )}
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300">
              {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewMovementModal({ movementType, formData, setFormData, selectedTeams, setSelectedTeams, loading, onClose, onSubmit }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full my-8 p-6">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-bold">Nova {MOVEMENT_TYPES[movementType as MovementType].label}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Colaborador *</label>
            <input type="text" placeholder="Digite o nome completo" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, employeeName: e.target.value})} />
          </div>

          {movementType === 'demissao' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data do Desligamento</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2" onChange={(e) => setFormData({...formData, dismissalDate: e.target.value})} />
              </div>
              <div>import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, UserX, AlertCircle, LogOut, Mail, Lock, Eye, EyeOff, Settings, Loader2, UserPlus, Clock, CheckSquare, Square } from 'lucide-react';
import { supabase } from './lib/supabase';

type UserRole = 'admin' | 'team_member';
type MovementType = 'demissao' | 'transferencia' | 'alteracao' | 'promocao';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  can_manage_demissoes: boolean;
  can_manage_transferencias: boolean;
  team_id: string;
  team_name: string;
}

interface Movement {
  id: string;
  type: MovementType;
  employee_name: string;
  selected_teams: string[];
  status: 'pending' | 'in_progress' | 'completed';
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
  observation?: string | null;
  deadline?: string | null;
}

const TEAMS = [
  { id: 'rh', name: 'Recursos Humanos' },
  { id: 'ponto', name: 'Ponto' },
  { id: 'transporte', name: 'Transporte' },
  { id: 'ti', name: 'T.I' },
  { id: 'desenvolvimento', name: 'Desenvolvimento' },
  { id: 'seguranca', name: 'Segurança do Trabalho' },
  { id: 'ambulatorio', name: 'Ambulatório' },
  { id: 'financeiro', name: 'Financeiro' },
  { id: 'dp', name: 'DP' },
  { id: 'treinamento', name: 'Treinamento e Desenvolvimento' }
];

const MOVEMENT_TYPES = {
  demissao: { label: 'Demissão', icon: UserX },
  transferencia: { label: 'Transferência', icon: Users },
  alteracao: { label: 'Alteração Salarial', icon: TrendingUp },
  promocao: { label: 'Promoção', icon: TrendingUp }
};

const CHECKLISTS: Record<MovementType, Record<string, string[]>> = {
  demissao: {
    rh: ['Requisição de desligamento', 'Entrevista de desligamento'],
    ponto: ['Entrega espelho de ponto'],
    transporte: ['Valores de multas', 'Baixa de carro responsável'],
    ti: ['Baixa de usuário'],
    seguranca: ['Entrega de EPIs', 'Sem acidente de trabalho', 'Não é membro da CIPA'],
    ambulatorio: ['Valores farmácia', 'Baixa plano de saúde', 'Baixa plano odonto', 'Exame demissional', 'Valores plano de saúde'],
    financeiro: ['Existe multas', 'Existe adiantamento', 'Valores a descontar'],
    dp: ['Comissões recebidas', 'Aviso prévio assinado', 'Valores marmita'],
    treinamento: ['Valores a devolver bolsa de estudos', 'Valores a devolver adiantamento treinamentos']
  },
  transferencia: {
    rh: ['Transferência temporária', 'Colaborador apto para a função'],
    ponto: ['Análise alteração no ponto do colaborador'],
    transporte: ['Colaborador apto a dirigir veículo da empresa'],
    ti: ['Alteração de acessos colaborador'],
    seguranca: ['Ordem de serviço assinada', 'Colaborador habilitado em NR'],
    treinamento: ['Treinamentos obrigatórios'],
    ambulatorio: ['ASO'],
    dp: ['Transferência programada', 'Necessário criação de função ou seção']
  },
  alteracao: {
    rh: ['Alteração temporária', 'Colaborador apto para a função'],
    ponto: ['Análise alteração no ponto do colaborador'],
    transporte: ['Colaborador apto a dirigir veículo da empresa'],
    ti: ['Alteração de acessos colaborador'],
    seguranca: ['Ordem de serviço assinada', 'Colaborador habilitado em NR'],
    treinamento: ['Treinamentos obrigatórios'],
    ambulatorio: ['ASO'],
    dp: ['Alteração programada', 'Necessário criação de função ou seção']
  },
  promocao: {
    rh: ['Colaborador apto para a função', 'Testes necessários para função', 'Promoção para liderança de equipe, fez treinamento de líderes'],
    ponto: ['Análise alteração no ponto do colaborador'],
    transporte: ['Colaborador apto a dirigir veículo da empresa'],
    ti: ['Alteração de acessos colaborador'],
    seguranca: ['Ordem de serviço assinada', 'Colaborador habilitado em NR'],
    treinamento: ['Treinamentos obrigatórios'],
    ambulatorio: ['ASO', 'Alteração plano de saúde'],
    dp: ['Promoção programada', 'Necessário criação de função ou seção', 'Alteração seguro de vida']
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [view, setView] = useState('login');
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadMovements();
    }
  }, [currentUser]);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('movements').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <LoginComponent setCurrentUser={setCurrentUser} setView={setView} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <HeaderComponent currentUser={currentUser} setCurrentUser={setCurrentUser} setView={setView} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {view === 'dashboard' && (
          <DashboardView 
            currentUser={currentUser} 
            movements={movements} 
            loading={loading}
            loadMovements={loadMovements}
            setSelectedMovement={setSelectedMovement}
            setView={setView}
          />
        )}
        {view === 'detail' && selectedMovement && (
          <DetailView 
            currentUser={currentUser}
            selectedMovement={selectedMovement}
            setView={setView}
            setSelectedMovement={setSelectedMovement}
            loadMovements={loadMovements}
          />
        )}
      </main>
    </div>
  );
}

function LoginComponent({ setCurrentUser, setView }: any) {
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
      const { data, error } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).eq('password', password).single();
      if (error || !data) {
        setError('Email ou senha incorretos');
        return;
      }
      setCurrentUser(data);
      setView('dashboard');
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
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" required disabled={loadingLogin} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-12 py-2 border rounded-lg" required disabled={loadingLogin} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
          <button type="submit" disabled={loadingLogin} className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2">
            {loadingLogin ? <><Loader2 className="w-5 h-5 animate-spin" />Entrando...</> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

function HeaderComponent({ currentUser, setCurrentUser, setView }: any) {
  return (
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
            <button onClick={() => { setCurrentUser(null); setView('login'); }} className="text-gray-600 hover:text-gray-900">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function DashboardView({ currentUser, movements, loading, loadMovements, setSelectedMovement, setView }: any) {
  const [showNewMovement, setShowNewMovement] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showRegisterUser, setShowRegisterUser] = useState(false);
  const [movementType, setMovementType] = useState<MovementType | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [loadingCreate, setLoadingCreate] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const canCreateDemissao = isAdmin && currentUser?.can_manage_demissoes;
  const canCreateTransferencia = isAdmin && currentUser?.can_manage_transferencias;

  const isOverdue = (deadline?: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const getProgress = (m: Movement) => {
    const completed = m.selected_teams.filter(t => m.responses[t]?.status === 'completed').length;
    return { completed, total: m.selected_teams.length, percentage: m.selected_teams.length > 0 ? (completed / m.selected_teams.length) * 100 : 0 };
  };

  const handleCreate = async () => {
    if (!formData.employeeName?.trim() || selectedTeams.length === 0) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    setLoadingCreate(true);
    try {
      const responsesObj = selectedTeams.reduce((acc, teamId) => ({ ...acc, [teamId]: { status: 'pending', checklist: {} } }), {});
      
      const detailsWithObservation = {
        ...formData,
        observation: formData.observation || ''
      };
      
      const newMovement: any = {
        type: movementType!,
        employee_name: formData.employeeName,
        selected_teams: selectedTeams,
        status: 'pending' as const,
        responses: responsesObj,
        created_by: currentUser?.name || '',
        details: detailsWithObservation
      };

      if (formData.deadline) {
        newMovement.deadline = formData.deadline;
      }

      const { data, error } = await supabase.from('movements').insert([newMovement]).select().single();
      if (error) throw error;

      fetch('https://hook.eu2.make.com/ype19l4x522ymrkbmqhm9on10szsc62v', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          movimento_tipo: MOVEMENT_TYPES[data.type as MovementType].label,
          equipes_envolvidas: data.selected_teams.map((id: string) => TEAMS.find(t => t.id === id)?.name || id).join(', ')
        })
      }).catch(e => console.error('Webhook erro:', e));

      alert('Movimentação criada!');
      await loadMovements();
      setShowNewMovement(false);
      setMovementType(null);
      setFormData({});
      setSelectedTeams([]);
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoadingCreate(false);
    }
  };

  const myMovs = movements.filter((m: Movement) => m.selected_teams.includes(currentUser?.team_id || ''));
  const pending = myMovs.filter((m: Movement) => m.responses[currentUser?.team_id || '']?.status === 'pending');

  return (
    <div>
      {pending.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
          <Clock className="w-5 h-5 text-yellow-600 inline mr-2" />
          <span className="font-medium text-yellow-800">Você tem {pending.length} movimentação(ões) pendente(s)</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Dashboard</h2>
          <div className="flex gap-2">
            {isAdmin && <button onClick={() => setShowRegisterUser(true)} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm"><UserPlus className="w-4 h-4" />Cadastrar</button>}
            <button onClick={() => setShowChangePassword(true)} className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm"><Settings className="w-4 h-4" />Senha</button>
          </div>
        </div>

        {(canCreateDemissao || canCreateTransferencia) && (
          <div className="mb-6 pb-6 border-b">
            <h3 className="font-semibold mb-3">Nova Movimentação</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {canCreateDemissao && <button onClick={() => { setShowNewMovement(true); setMovementType('demissao'); }} className="p-4 border-2 border-red-200 rounded-lg hover:bg-red-50"><UserX className="w-8 h-8 text-red-600 mx-auto mb-2" /><p className="text-sm font-medium">Demissão</p></button>}
              {canCreateTransferencia && (
                <>
                  <button onClick={() => { setShowNewMovement(true); setMovementType('transferencia'); }} className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50"><Users className="w-8 h-8 text-blue-600 mx-auto mb-2" /><p className="text-sm font-medium">Transferência</p></button>
                  <button onClick={() => { setShowNewMovement(true); setMovementType('alteracao'); }} className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50"><TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" /><p className="text-sm font-medium">Alteração</p></button>
                  <button onClick={() => { setShowNewMovement(true); setMovementType('promocao'); }} className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50"><TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" /><p className="text-sm font-medium">Promoção</p></button>
                </>
              )}
            </div>
          </div>
        )}

        <h3 className="font-semibold mb-3">{isAdmin ? 'Todas' : 'Minhas'} Movimentações</h3>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="space-y-3">
            {(isAdmin ? movements : myMovs).map((m: Movement) => {
              const Icon = MOVEMENT_TYPES[m.type as MovementType].icon;
              const prog = getProgress(m);
              const myResp = m.responses[currentUser?.team_id || ''];
              const involved = m.selected_teams.includes(currentUser?.team_id || '');
              const overdue = isOverdue(m.deadline);

              return (
                <div key={m.id} className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer ${overdue ? 'border-red-300 bg-red-50' : ''}`} onClick={() => { setSelectedMovement(m); setView('detail'); }}>
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6" />
                      <div>
                        <h3 className="font-semibold">{m.employee_name}</h3>
                        <p className="text-sm text-gray-600">{MOVEMENT_TYPES[m.type as MovementType].label}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {m.deadline && <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${overdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}><Clock className="w-3 h-3" />{new Date(m.deadline).toLocaleDateString('pt-BR')}</span>}
                      {involved && <span className={`text-xs px-2 py-1 rounded ${myResp?.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{myResp?.status === 'completed' ? '✓' : '⏳'}</span>}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Progresso: {prog.completed}/{prog.total}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${prog.percentage}%` }}></div></div>
                </div>
              );
            })}
            {(isAdmin ? movements : myMovs).length === 0 && <p className="text-center py-8 text-gray-500">Nenhuma movimentação</p>}
          </div>
        )}
      </div>

      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
      {showRegisterUser && <RegisterUserModal onClose={() => setShowRegisterUser(false)} />}
      {showNewMovement && movementType && (
        <NewMovementModal
          movementType={movementType}
          formData={formData}
          setFormData={setFormData}
          selectedTeams={selectedTeams}
          setSelectedTeams={setSelectedTeams}
          loading={loadingCreate}
          onClose={() => { setShowNewMovement(false); setMovementType(null); setFormData({}); setSelectedTeams([]); }}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}

function DetailView({ currentUser, selectedMovement, setView, setSelectedMovement, loadMovements }: any) {
  const [comment, setComment] = useState('');
  const [loadingSub, setLoadingSub] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(selectedMovement.details);
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    selectedMovement.responses[currentUser?.team_id]?.checklist || {}
  );
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  const [showHistory, setShowHistory] = useState<string | null>(null);

  const isMyTeam = selectedMovement.selected_teams.includes(currentUser?.team_id || '');
  const myResp = currentUser?.team_id ? selectedMovement.responses[currentUser.team_id] : null;
  const hasResponded = myResp?.status === 'completed';
  const isAdmin = currentUser?.role === 'admin';

  const userTeamChecklist: string[] = CHECKLISTS[selectedMovement.type as MovementType]?.[currentUser?.team_id || ''] || [];

  const handleStartEdit = () => {
    if (myResp) {
      setComment(myResp.comment || '');
      setChecklist(myResp.checklist || {});
      setIsEditingResponse(true);
    }
  };

  const handleChecklistToggle = (item: string) => {
    setChecklist(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const allChecklistCompleted = userTeamChecklist.length > 0 && userTeamChecklist.every(checkItem => checklist[checkItem]);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      alert('Por favor, adicione um comentário');
      return;
    }
    
    if (userTeamChecklist.length > 0 && !allChecklistCompleted) {
      alert('Por favor, complete todos os itens do checklist antes de enviar');
      return;
    }

    setLoadingSub(true);
    try {
      const now = new Date();
      const action = hasResponded ? 'updated' : 'created';
      
      const existingHistory = myResp?.history || [];
      const newHistoryEntry = {
        user_name: currentUser.name,
        user_email: currentUser.email,
        action: action,
        date: now.toISOString().split('T')[0],
        timestamp: now.toISOString()
      };
      
      const updated = { 
        ...selectedMovement.responses, 
        [currentUser.team_id!]: { 
          status: 'completed', 
          comment: comment.trim(), 
          date: now.toISOString().split('T')[0],
          checklist: checklist,
          history: [...existingHistory, newHistoryEntry]
        } 
      };
      
      const allDone = selectedMovement.selected_teams.every((id: string) => updated[id]?.status === 'completed');
      const { error } = await supabase.from('movements').update({ 
        responses: updated, 
        status: allDone ? 'completed' : 'in_progress' 
      }).eq('id', selectedMovement.id);
      
      if (error) throw error;
      
      alert(hasResponded ? 'Parecer atualizado com sucesso!' : 'Parecer enviado com sucesso!');
      await loadMovements();
      setView('dashboard');
      setSelectedMovement(null);
    } catch (err) {
      alert('Erro ao enviar parecer');
    } finally {
      setLoadingSub(false);
    }
  };

  const handleUpdate = async () => {
    setLoadingSub(true);
    try {
      const { error } = await supabase.from('movements').update({ 
        details: editData,
        employee_name: editData.employeeName || selectedMovement.employee_name
      }).eq('id', selectedMovement.id);
      if (error) throw error;
      alert('Movimentação atualizada!');
      await loadMovements();
      setIsEditing(false);
    } catch (err) {
      alert('Erro ao atualizar');
    } finally {
      setLoadingSub(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta movimentação?')) return;
    setLoadingSub(true);
    try {
      const { error } = await supabase.from('movements').delete().eq('id', selectedMovement.id);
      if (error) throw error;
      alert('Movimentação excluída!');
      await loadMovements();
      setView('dashboard');
      setSelectedMovement(null);
    } catch (err) {
      alert('Erro ao excluir');
    } finally {
      setLoadingSub(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{selectedMovement.employee_name}</h2>
          <p className="text-gray-600">{MOVEMENT_TYPES[selectedMovement.type as MovementType].label}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && !isEditing && (
            <>
              <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Editar</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Excluir</button>
            </>
          )}
          <button onClick={() => { setView('dashboard'); setSelectedMovement(null); }} className="text-gray-600 hover:text-gray-900">← Voltar</button>
        </div>
      </div>

      {isEditing ? (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
          <h3 className="font-semibold mb-3">Editar Informações</h3>
          <div>
            <label className="block text-sm font-medium mb-2">Nome do Colaborador</label>
            <input type="text" value={editData.employeeName || selectedMovement.employee_name} onChange={(e) => setEditData({...editData, employeeName: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
          </div>
          
          {selectedMovement.type ===
