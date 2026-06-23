# Guia de Testes - Sistema de Análise de Fichas de Abono de Ponto

## 📋 Checklist de Configuração

### 1. Variáveis de Ambiente
- [ ] `OPENAI_API_KEY` configurada
- [ ] `GOOGLE_DRIVE_API_KEY` configurada
- [ ] `GOOGLE_DRIVE_FOLDER_ID` configurada
- [ ] `VITE_SUPABASE_URL` configurada
- [ ] `VITE_SUPABASE_ANON_KEY` configurada

### 2. Banco de Dados
- [ ] Tabela `attendance_records` criada
- [ ] RLS (Row Level Security) ativado
- [ ] Índices criados
- [ ] Trigger para `updated_at` funcionando

### 3. Dependências
- [ ] `npm install` executado
- [ ] Todas as dependências instaladas sem erros

## 🧪 Testes Funcionais

### Teste 1: Upload de Imagem
**Objetivo:** Verificar se a imagem é enviada corretamente

1. Acesse a aplicação
2. Navegue para "Fichas de Abono"
3. Clique em "Clique para enviar uma imagem"
4. Selecione a imagem de teste fornecida
5. **Esperado:** Imagem aparece em preview

**Status:** [ ] Passou [ ] Falhou

### Teste 2: Análise com IA
**Objetivo:** Verificar se a IA consegue extrair os dados corretamente

1. Com a imagem carregada, clique em "Analisar Imagem"
2. Aguarde 5-10 segundos
3. **Esperado:** Dados aparecem na seção de resultados

**Status:** [ ] Passou [ ] Falhou

**Dados Esperados:**
- Nome: Coriolano Maciel Da Abreu
- Função: Motorista
- Setor: BAND Serviços
- Data: 19/06/2026
- Entrada: 08:00 (ou similar)
- Saída Ref.: 12:00 (ou similar)
- Ent. Ref.: 13:00 (ou similar)
- Saída: 17:00 (ou similar)
- Motivo: Esquecimento do Funcionário (ou similar)

### Teste 3: Google Drive Upload
**Objetivo:** Verificar se a imagem foi salva no Google Drive

1. Após análise bem-sucedida, acesse Google Drive
2. Navegue até a pasta "Fichas de Abono de Ponto"
3. **Esperado:** A imagem aparece na pasta com nome contendo timestamp

**Status:** [ ] Passou [ ] Falhou

### Teste 4: Supabase Storage
**Objetivo:** Verificar se os dados foram salvos no banco

1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Vá para "SQL Editor"
3. Execute: `SELECT * FROM attendance_records ORDER BY created_at DESC LIMIT 1;`
4. **Esperado:** Um registro com os dados extraídos

**Status:** [ ] Passou [ ] Falhou

### Teste 5: Download CSV
**Objetivo:** Verificar se o CSV é gerado corretamente

1. Com dados extraídos visíveis, clique em "Baixar CSV"
2. Abra o arquivo baixado
3. **Esperado:** CSV contém todos os campos com os dados corretos

**Status:** [ ] Passou [ ] Falhou

### Teste 6: Histórico
**Objetivo:** Verificar se o histórico de fichas é exibido

1. Na coluna lateral, clique no ícone de olho
2. **Esperado:** Lista de fichas processadas aparece
3. Clique em uma ficha anterior
4. **Esperado:** Detalhes da ficha aparecem

**Status:** [ ] Passou [ ] Falhou

### Teste 7: Limpeza de Formulário
**Objetivo:** Verificar se o botão "Limpar" funciona

1. Com dados extraídos, clique em "Limpar"
2. **Esperado:** Formulário volta ao estado inicial

**Status:** [ ] Passou [ ] Falhou

### Teste 8: Validação de Arquivo
**Objetivo:** Verificar validações de arquivo

1. Tente enviar um arquivo que não é imagem
2. **Esperado:** Mensagem de erro "O arquivo deve ser uma imagem"
3. Tente enviar uma imagem > 10MB
4. **Esperado:** Mensagem de erro "A imagem não pode ter mais de 10MB"

**Status:** [ ] Passou [ ] Falhou

## 🔒 Testes de Segurança

### Teste 9: RLS - Usuário Vê Apenas Seus Registros
**Objetivo:** Verificar isolamento de dados

1. Faça login com Usuário A
2. Processe uma ficha
3. Faça logout
4. Faça login com Usuário B
5. Vá para "Fichas de Abono"
6. **Esperado:** Histórico vazio ou com apenas registros do Usuário B

**Status:** [ ] Passou [ ] Falhou

### Teste 10: Admin Vê Todos os Registros
**Objetivo:** Verificar permissões de admin

1. Faça login com conta admin
2. Vá para "Fichas de Abono"
3. **Esperado:** Histórico mostra fichas de todos os usuários

**Status:** [ ] Passou [ ] Falhou

## 🚨 Testes de Erro

### Teste 11: API Indisponível
**Objetivo:** Verificar tratamento de erro quando OpenAI está indisponível

1. Remova temporariamente `OPENAI_API_KEY`
2. Tente analisar uma imagem
3. **Esperado:** Mensagem de erro clara

**Status:** [ ] Passou [ ] Falhou

### Teste 12: Google Drive Indisponível
**Objetivo:** Verificar se análise funciona sem Google Drive

1. Remova temporariamente `GOOGLE_DRIVE_API_KEY`
2. Tente analisar uma imagem
3. **Esperado:** Análise funciona, mas sem salvar no Google Drive

**Status:** [ ] Passou [ ] Falhou

## 📊 Testes de Performance

### Teste 13: Tempo de Análise
**Objetivo:** Verificar tempo de resposta

1. Processe uma ficha
2. Meça o tempo total (upload + análise + salvamento)
3. **Esperado:** < 15 segundos

**Tempo Medido:** _____ segundos

**Status:** [ ] Passou [ ] Falhou

### Teste 14: Carregamento do Histórico
**Objetivo:** Verificar performance do histórico

1. Processe 10+ fichas
2. Abra o histórico
3. **Esperado:** Carrega em < 2 segundos

**Tempo Medido:** _____ segundos

**Status:** [ ] Passou [ ] Falhou

## 📝 Notas de Teste

Use este espaço para anotar observações, bugs encontrados ou melhorias sugeridas:

```
[Adicione suas notas aqui]
```

## ✅ Resultado Final

- [ ] Todos os testes funcionais passaram
- [ ] Todos os testes de segurança passaram
- [ ] Todos os testes de erro passaram
- [ ] Todos os testes de performance passaram

**Data do Teste:** _______________

**Testador:** _______________

**Aprovado para Produção:** [ ] Sim [ ] Não

## 🐛 Bugs Encontrados

| ID | Descrição | Severidade | Status |
|----|-----------|-----------|--------|
| B01 | | | |
| B02 | | | |
| B03 | | | |

## 📞 Próximos Passos

- [ ] Corrigir bugs críticos
- [ ] Fazer deploy em staging
- [ ] Fazer deploy em produção
- [ ] Monitorar logs
- [ ] Coletar feedback dos usuários
