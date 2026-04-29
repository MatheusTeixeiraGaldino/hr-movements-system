import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
AcompanhamentoDossie,
ItemChecklist,
TipoDesligamento,
TipoDocumento,
StatusDossie,
getDocumentosObrigatorios,
todosMarcados,
AuditoriaItem,
} from '../types/dossie';

function normalizarDossie(d: any): AcompanhamentoDossie {
return {
...d,
status: (d.status || '').toLowerCase(),
tipo_desligamento: (d.tipo_desligamento || '').toLowerCase(),
checklist: Array.isArray(d.checklist) ? d.checklist : [],
historico_auditoria: Array.isArray(d.historico_auditoria)
? d.historico_auditoria
: [],
};
}

/**

* 🔥 TIPAGEM EXPLÍCITA DO RETORNO (CORREÇÃO PRINCIPAL)
  */
  interface UseDossieReturn {
  dossies: AcompanhamentoDossie[];
  loading: boolean;
  error: string | null;
  loadDossies: () => Promise<void>;
  loadDossieById: (id: string) => Promise<AcompanhamentoDossie | null>;
  loadDossieByMovimentoId: (movimentoId: string) => Promise<AcompanhamentoDossie | null>;
  criarDossieAutomatico: (
  movimentoId: string,
  tipoDesligamento: TipoDesligamento,
  employeeName: string,
  usuario: string,
  email: string,
  cpf?: string,
  chapa?: string
  ) => Promise<AcompanhamentoDossie | null>;
  toggleDocumento: (
  id: string,
  documento: TipoDocumento,
  user: string,
  email: string
  ) => Promise<void>;
  atualizarObservacao: (
  id: string,
  observacao: string,
  user: string,
  email: string
  ) => Promise<void>;
  atualizarPastaDesligado: (
  id: string,
  pasta: string,
  user: string,
  email: string
  ) => Promise<void>;
  }

export function useDossie(): UseDossieReturn {
const [dossies, setDossies] = useState<AcompanhamentoDossie[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const loadDossies = useCallback(async () => {
setLoading(true);
setError(null);
try {
const { data, error } = await supabase
.from('acompanhamento_dossie')
.select('*')
.order('data_criacao', { ascending: false });

```
  if (error) throw error;

  const normalizados = (data || []).map(normalizarDossie);
  setDossies(normalizados);
} catch (err: any) {
  setError(err.message);
  console.error(err);
} finally {
  setLoading(false);
}
```

}, []);

const loadDossieById = useCallback(async (id: string) => {
try {
const { data, error } = await supabase
.from('acompanhamento_dossie')
.select('*')
.eq('id', id)
.maybeSingle();

```
  if (error) throw error;
  return data ? normalizarDossie(data) : null;
} catch (err: any) {
  console.error(err);
  return null;
}
```

}, []);

const loadDossieByMovimentoId = useCallback(async (movimentoId: string) => {
try {
const { data, error } = await supabase
.from('acompanhamento_dossie')
.select('*')
.eq('movimento_id', movimentoId)
.maybeSingle();

```
  if (error) throw error;
  return data ? normalizarDossie(data) : null;
} catch (err: any) {
  console.error(err);
  return null;
}
```

}, []);

const criarDossieAutomatico = useCallback(
async (
movimentoId: string,
tipoDesligamento: TipoDesligamento,
employeeName: string,
usuario: string,
email: string,
cpf?: string,
chapa?: string
) => {
setLoading(true);
setError(null);
try {
const documentos = getDocumentosObrigatorios(tipoDesligamento);

```
    const checklist: ItemChecklist[] = documentos.map(doc => ({
      documento: doc,
      marcado: false,
    }));

    const auditoria: AuditoriaItem = {
      usuario,
      email_usuario: email,
      acao: 'criacao',
      data_hora: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('acompanhamento_dossie')
      .insert([
        {
          movimento_id: movimentoId,
          tipo_desligamento: tipoDesligamento,
          employee_name: employeeName,
          cpf: cpf || null,
          chapa: chapa || null,
          status: StatusDossie.PENDENTE,
          checklist,
          historico_auditoria: [auditoria],
          data_criacao: new Date().toISOString(),
          usuario_criacao: usuario,
          email_usuario_criacao: email,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await loadDossies();
    return data ? normalizarDossie(data) : null;
  } catch (err: any) {
    setError(err.message);
    console.error(err);
    return null;
  } finally {
    setLoading(false);
  }
},
[loadDossies]
```

);

const toggleDocumento = useCallback(
async (id: string, documento: TipoDocumento, user: string, email: string) => {
setLoading(true);
setError(null);
try {
const dossie = await loadDossieById(id);
if (!dossie) throw new Error('Dossiê não encontrado');

```
    const checklist = [...dossie.checklist];
    const index = checklist.findIndex(i => i.documento === documento);
    if (index === -1) throw new Error('Documento não encontrado');

    checklist[index].marcado = !checklist[index].marcado;

    const historico = [
      ...(dossie.historico_auditoria || []),
      {
        usuario: user,
        email_usuario: email,
        acao: checklist[index].marcado ? 'marcacao' : 'desmarcacao',
        documento,
        data_hora: new Date().toISOString(),
      },
    ];

    let status = StatusDossie.PENDENTE;
    if (todosMarcados(checklist)) status = StatusDossie.CONCLUIDO;
    else if (checklist.some(i => i.marcado)) status = StatusDossie.EM_ANDAMENTO;

    const { error } = await supabase
      .from('acompanhamento_dossie')
      .update({
        checklist,
        status,
        historico_auditoria: historico,
      })
      .eq('id', id);

    if (error) throw error;

    await loadDossies();
  } catch (err: any) {
    setError(err.message);
    console.error(err);
  } finally {
    setLoading(false);
  }
},
[loadDossieById, loadDossies]
```

);

const atualizarObservacao = useCallback(
async (id: string, observacao: string, user: string, email: string) => {
setLoading(true);
setError(null);
try {
const dossie = await loadDossieById(id);
if (!dossie) throw new Error('Dossiê não encontrado');

```
    const historico = [
      ...(dossie.historico_auditoria || []),
      {
        usuario: user,
        email_usuario: email,
        acao: 'edicao_observacao',
        data_hora: new Date().toISOString(),
        detalhes: observacao,
      },
    ];

    const { error } = await supabase
      .from('acompanhamento_dossie')
      .update({
        observacao,
        historico_auditoria: historico,
      })
      .eq('id', id);

    if (error) throw error;

    await loadDossies();
  } catch (err: any) {
    setError(err.message);
    console.error(err);
  } finally {
    setLoading(false);
  }
},
[loadDossieById, loadDossies]
```

);

const atualizarPastaDesligado = useCallback(
async (id: string, pasta: string, user: string, email: string) => {
setLoading(true);
setError(null);
try {
const dossie = await loadDossieById(id);
if (!dossie) throw new Error('Dossiê não encontrado');

```
    const historico = [
      ...(dossie.historico_auditoria || []),
      {
        usuario: user,
        email_usuario: email,
        acao: 'edicao_observacao',
        data_hora: new Date().toISOString(),
        detalhes: pasta,
      },
    ];

    const { error } = await supabase
      .from('acompanhamento_dossie')
      .update({
        pasta_desligado: pasta,
        historico_auditoria: historico,
      })
      .eq('id', id);

    if (error) throw error;

    await loadDossies();
  } catch (err: any) {
    setError(err.message);
    console.error(err);
  } finally {
    setLoading(false);
  }
},
[loadDossieById, loadDossies]
```

);

return {
dossies,
loading,
error,
loadDossies,
loadDossieById,
loadDossieByMovimentoId,
criarDossieAutomatico,
toggleDocumento,
atualizarObservacao,
atualizarPastaDesligado,
};
}
