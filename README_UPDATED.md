# Sistema de RH - Movimentações Trabalhistas

Sistema completo para gerenciamento de movimentações trabalhistas, incluindo análise automática de fichas de abono de ponto com IA.

## 🎯 Funcionalidades Principais

### 1. Dashboard de Movimentações
- Visualização de todas as movimentações (demissão, transferência, alteração, promoção)
- Filtro por equipe
- Status de cada movimentação
- Prazos e deadlines

### 2. Relatórios
- Relatórios consolidados de movimentações
- Filtros avançados
- Exportação de dados

### 3. Acompanhamento de Dossiê
- Checklist de documentos para desligamentos
- Rastreamento de status
- Histórico de auditoria

### 4. **NOVO** - Análise de Fichas de Abono de Ponto
- Upload de imagens de fichas
- Análise automática com IA (OpenAI Vision)
- Extração de dados estruturados
- Salvamento no Google Drive
- Histórico de fichas processadas
- Download em CSV

## 🚀 Quick Start

### 1. Clonar o Repositório
```bash
git clone https://github.com/MatheusTeixeiraGaldino/hr-movements-system.git
cd hr-movements-system
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
```bash
cp .env.example .env.local
# Edite .env.local com suas credenciais
```

### 4. Configurar Banco de Dados
Execute o script SQL em `sql/create_attendance_records_table.sql` no Supabase Dashboard.

### 5. Iniciar Desenvolvimento
```bash
npm run dev
```

## 📦 Stack Tecnológico

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS
- **Backend:** Vercel Functions (Node.js)
- **Banco de Dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth
- **IA:** OpenAI Vision API
- **Cloud Storage:** Google Drive API
- **Deployment:** Vercel

## 📁 Estrutura do Projeto

```
hr-movements-system/
├── src/
│   ├── components/
│   │   ├── AttendanceAnalysisView.tsx      # NOVO - Interface de análise
│   │   ├── DashboardView.tsx
│   │   ├── DossieView.tsx
│   │   └── RelatorioView.tsx
│   ├── hooks/
│   │   ├── useAttendanceAnalysis.ts        # NOVO - Hook para análise
│   │   └── useDossie.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── emailService.ts
│   ├── types/
│   │   ├── attendance-record.ts            # NOVO - Tipos de ficha
│   │   └── dossie.ts
│   ├── App.tsx
│   └── main.tsx
├── api/
│   ├── analyze-attendance.ts               # NOVO - API de análise
│   └── check-deadlines.ts
├── sql/
│   └── create_attendance_records_table.sql # NOVO - Schema do banco
├── ATTENDANCE_ANALYSIS_SETUP.md            # NOVO - Guia de configuração
├── TESTING_GUIDE.md                        # NOVO - Guia de testes
├── .env.example                            # NOVO - Exemplo de env
├── package.json
├── vite.config.ts
└── vercel.json
```

## 🔧 Configuração Detalhada

### OpenAI API
1. Acesse [OpenAI Platform](https://platform.openai.com/)
2. Crie uma chave de API
3. Adicione a `OPENAI_API_KEY` ao `.env.local`

### Google Drive API
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto e ative Google Drive API
3. Crie credenciais (API Key)
4. Crie uma pasta no Google Drive
5. Adicione `GOOGLE_DRIVE_API_KEY` e `GOOGLE_DRIVE_FOLDER_ID` ao `.env.local`

### Supabase
1. Crie um projeto em [Supabase](https://supabase.com/)
2. Copie as credenciais para `.env.local`
3. Execute o script SQL para criar a tabela `attendance_records`

## 📊 Como Usar - Análise de Fichas

### Para o Líder
1. Acesse a seção "Fichas de Abono" no menu
2. Clique para enviar uma imagem da ficha
3. Clique em "Analisar Imagem"
4. Aguarde a análise (5-10 segundos)
5. Verifique os dados extraídos
6. Opcionalmente, baixe em CSV

### Dados Extraídos Automaticamente
- Nome do funcionário
- Função/cargo
- Setor/departamento
- Data do abono
- Horários (entrada, saída, referências)
- Motivo da ocorrência
- Status de assinaturas

## 🔐 Segurança

- **RLS (Row Level Security):** Usuários veem apenas seus registros
- **Autenticação:** Via Supabase Auth
- **Autorização:** Roles (admin, responsavel, team_member)
- **Dados Sensíveis:** Não armazenados em texto plano
- **HTTPS:** Obrigatório em produção

## 📈 Performance

- Análise de imagem: ~5-10 segundos
- Upload para Google Drive: ~2-3 segundos
- Carregamento do histórico: ~1-2 segundos
- Limite de arquivo: 10MB

## 🧪 Testes

Consulte `TESTING_GUIDE.md` para:
- Checklist de configuração
- Testes funcionais
- Testes de segurança
- Testes de performance

## 🐛 Troubleshooting

### Erro: "Google Drive credentials not configured"
- Verifique `GOOGLE_DRIVE_API_KEY` e `GOOGLE_DRIVE_FOLDER_ID`
- Confirme que a API do Google Drive está ativada

### Erro: "OpenAI API key not configured"
- Verifique `OPENAI_API_KEY`
- Confirme que a chave é válida e tem saldo

### Erro: "Database error"
- Verifique se a tabela `attendance_records` foi criada
- Confirme as credenciais do Supabase

Para mais detalhes, consulte `ATTENDANCE_ANALYSIS_SETUP.md`.

## 🚀 Deployment

### Vercel
```bash
vercel
```

### Variáveis de Ambiente em Produção
Adicione todas as variáveis do `.env.local` no Vercel Dashboard:
- Settings → Environment Variables

### Cron Jobs
O arquivo `vercel.json` configura jobs automáticos:
- Check deadlines: 9:00 AM todos os dias

## 📝 Changelog

### v1.1.0 - Análise de Fichas de Abono
- ✨ Novo módulo de análise de fichas de abono de ponto
- ✨ Integração com OpenAI Vision para OCR/IA
- ✨ Salvamento automático no Google Drive
- ✨ Histórico de fichas processadas
- ✨ Download em CSV

### v1.0.0 - Versão Inicial
- Sistema de movimentações trabalhistas
- Dashboard e relatórios
- Acompanhamento de dossiê

## 🤝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
2. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
3. Push para a branch (`git push origin feature/AmazingFeature`)
4. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com o time de desenvolvimento.

## 📄 Licença

Este projeto é privado e pertence à empresa.

---

**Última Atualização:** Junho 2026
