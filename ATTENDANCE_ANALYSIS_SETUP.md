# Sistema de Análise de Fichas de Abono de Ponto

## 📋 Visão Geral

Este módulo permite que líderes enviem imagens de fichas de abono de ponto para análise automática. O sistema utiliza IA (OCR/LLM) para extrair dados estruturados e salva as imagens no Google Drive.

## 🎯 Funcionalidades

- ✅ Upload de imagens de fichas de abono
- ✅ Análise automática com IA (OpenAI Vision)
- ✅ Extração de dados: Nome, Data, Entrada, Saída Ref., Ent. Ref., Saída, Motivo
- ✅ Salvamento automático no Google Drive
- ✅ Armazenamento de dados no Supabase
- ✅ Histórico de fichas processadas
- ✅ Download dos dados em CSV

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```env
# OpenAI (para análise de imagem com IA)
OPENAI_API_KEY=sk-...

# Google Drive (para armazenar imagens)
GOOGLE_DRIVE_API_KEY=...
GOOGLE_DRIVE_FOLDER_ID=...

# Supabase (já configurado)
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

### 2. Configurar Google Drive

#### Passo 1: Criar um Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto
3. Ative a API do Google Drive:
   - Vá para "APIs e Serviços" → "Biblioteca"
   - Procure por "Google Drive API"
   - Clique em "Ativar"

#### Passo 2: Criar Credenciais

1. Vá para "APIs e Serviços" → "Credenciais"
2. Clique em "Criar Credenciais" → "Chave de API"
3. Copie a chave de API (será usada como `GOOGLE_DRIVE_API_KEY`)

#### Passo 3: Criar Pasta no Google Drive

1. Acesse [Google Drive](https://drive.google.com/)
2. Crie uma nova pasta chamada "Fichas de Abono de Ponto"
3. Copie o ID da pasta da URL (será usado como `GOOGLE_DRIVE_FOLDER_ID`)
   - URL exemplo: `https://drive.google.com/drive/folders/1ABC2DEF3GHI4JKL5MNO6PQR7STU8VWX`
   - ID: `1ABC2DEF3GHI4JKL5MNO6PQR7STU8VWX`

### 3. Configurar OpenAI

1. Acesse [OpenAI Platform](https://platform.openai.com/)
2. Vá para "API keys"
3. Crie uma nova chave de API
4. Copie e adicione ao `.env.local` como `OPENAI_API_KEY`

### 4. Criar Tabela no Supabase

Execute o script SQL fornecido em `sql/create_attendance_records_table.sql`:

1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Vá para "SQL Editor"
3. Crie uma nova query
4. Cole o conteúdo do arquivo `sql/create_attendance_records_table.sql`
5. Execute a query

## 📱 Como Usar

### Para o Líder

1. Acesse a seção "Análise de Fichas de Abono"
2. Clique em "Clique para enviar uma imagem" ou arraste uma imagem
3. Clique em "Analisar Imagem"
4. Aguarde a análise (geralmente 5-10 segundos)
5. Verifique os dados extraídos
6. Opcionalmente, baixe os dados em CSV

### Dados Extraídos

O sistema extrai automaticamente:

| Campo | Descrição |
|-------|-----------|
| **Nome** | Nome do funcionário |
| **Função** | Cargo/função do funcionário |
| **Setor** | Departamento/setor |
| **Data** | Data do abono (DD/MM/YYYY) |
| **Entrada** | Horário de entrada (HH:MM) |
| **Saída Ref.** | Saída de referência (HH:MM) |
| **Ent. Ref.** | Entrada de referência (HH:MM) |
| **Saída** | Horário de saída (HH:MM) |
| **Motivo da Ocorrência** | Razão do abono (ex: Viagem a Trabalho) |

## 🗂️ Estrutura de Arquivos

```
src/
├── components/
│   └── AttendanceAnalysisView.tsx    # Interface principal
├── hooks/
│   └── useAttendanceAnalysis.ts      # Hook para gerenciar análise
├── types/
│   └── attendance-record.ts          # Tipos TypeScript
│
api/
└── analyze-attendance.ts             # API para análise

sql/
└── create_attendance_records_table.sql # Schema do banco
```

## 🔐 Segurança

- As imagens são armazenadas no Google Drive (não no servidor)
- Os dados extraídos são salvos no Supabase com RLS (Row Level Security)
- Cada usuário pode ver apenas seus próprios registros
- Admins podem visualizar todos os registros

## 📊 API Endpoints

### POST `/api/analyze-attendance`

Analisa uma imagem de ficha de abono.

**Request:**
```json
{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAAAAUA...",
  "file_name": "ficha_abono.jpg",
  "user_id": "uuid-do-usuario"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-do-registro",
    "extracted_data": {
      "nome": "João Silva",
      "funcao": "Motorista",
      "setor": "Transporte",
      "data": "19/06/2026",
      "entrada": "08:00",
      "saida_ref": "12:00",
      "ent_ref": "13:00",
      "saida": "17:00",
      "motivo_ocorrencia": "Viagem a Trabalho",
      "assinatura_gerente": "Sim",
      "assinatura_funcionario": "Sim"
    },
    "google_drive_id": "1ABC2DEF3GHI4JKL5MNO6PQR7STU8VWX",
    "image_url": "data:image/jpeg;base64,..."
  }
}
```

## 🐛 Troubleshooting

### Erro: "Google Drive credentials not configured"
- Verifique se `GOOGLE_DRIVE_API_KEY` e `GOOGLE_DRIVE_FOLDER_ID` estão definidos
- Confirme que a API do Google Drive está ativada

### Erro: "OpenAI API key not configured"
- Verifique se `OPENAI_API_KEY` está definido
- Confirme que a chave é válida e tem saldo

### Erro: "Failed to analyze image"
- Verifique se a imagem está clara e legível
- Tente com uma imagem de melhor qualidade
- Confirme que a imagem contém todos os campos esperados

### Erro: "Database error"
- Verifique se a tabela `attendance_records` foi criada
- Confirme que as variáveis do Supabase estão corretas

## 📝 Notas

- O sistema utiliza `gpt-4-vision-preview` do OpenAI para análise
- Imagens são limitadas a 10MB
- O histórico mantém os últimos 50 registros por usuário
- As imagens no Google Drive são organizadas por data

## 🚀 Próximas Melhorias

- [ ] Integração com sistema de ponto existente
- [ ] Validação automática de dados
- [ ] Notificações por email
- [ ] Relatórios consolidados
- [ ] Suporte a múltiplas idiomas
- [ ] API para integração com sistemas terceiros

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com o time de desenvolvimento.
