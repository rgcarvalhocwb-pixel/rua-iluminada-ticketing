# 🎄 Rua Iluminada - Sistema de Ingressos

Sistema completo de venda de ingressos online para o espetáculo natalino "Rua Iluminada - Família Moletta", desenvolvido com React, TypeScript e Supabase.

## 📋 Sumário

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação e Configuração](#instalação-e-configuração)
- [Uso do Sistema](#uso-do-sistema)
- [Painel Administrativo](#painel-administrativo)
- [Permissões de Usuário](#permissões-de-usuário)
- [Integrações](#integrações)
- [API e Banco de Dados](#api-e-banco-de-dados)
- [Deploy](#deploy)

## 🎯 Visão Geral

O sistema Rua Iluminada é uma plataforma completa de venda de ingressos que permite:
- Venda online de ingressos com pagamento via PagSeguro
- Gestão completa de eventos, horários e tipos de ingressos
- Painel administrativo com controle de vendas, relatórios e analytics
- Sistema de permissões para diferentes níveis de usuário
- Integração com multiple lojas físicas e vendas presenciais

## ✨ Funcionalidades

### Para Visitantes
- **Página Inicial**: Hero section com informações do evento e programação
- **Seleção de Ingressos**: Interface intuitiva para escolha de data, horário e tipo de ingresso
- **Formulário de Cliente**: Coleta de dados pessoais com validação
- **Pagamento Online**: Integração segura com PagSeguro
- **Meia Entrada**: Sistema automático de desconto para estudantes e idosos

### Para Administradores
- **Dashboard Analítico**: Métricas de vendas, eventos e performance
- **Gestão de Eventos**: Criação e edição de eventos e horários
- **Controle de Ingressos**: Gerenciamento de tipos, preços e disponibilidade
- **Vendas Presenciais**: Sistema de caixa para vendas físicas
- **Gestão de Lojas**: Cadastro e controle de pontos de venda físicos
- **Vendas das Lojas**: Registro diário de vendas das lojas com cálculo automático de comissões
- **Controle de Comissões**: Pagamento de comissões das lojas através do livro caixa
- **Relatórios Avançados**: Analytics detalhados incluindo performance das lojas
- **Gestão de Usuários**: Controle de permissões e aprovação de usuários
- **Configurações**: Personalização de marca, cores e integrações

## 🛠 Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e desenvolvimento
- **Tailwind CSS** - Framework de CSS utilitário
- **shadcn/ui** - Componentes de interface
- **Lucide React** - Ícones
- **React Router** - Navegação

### Backend & Banco de Dados
- **Supabase** - Backend as a Service
- **PostgreSQL** - Banco de dados principal
- **Row Level Security (RLS)** - Segurança de dados
- **Edge Functions** - Processamento serverless

### Integrações
- **PagSeguro** - Gateway de pagamento
- **Google Fonts** - Tipografia (Inter, Dancing Script)

## 📁 Estrutura do Projeto

```
src/
├── components/           # Componentes React
│   ├── admin/           # Componentes do painel admin
│   │   ├── AdminSidebar.tsx
│   │   ├── EventsManager.tsx
│   │   ├── StoresManager.tsx
│   │   ├── StoreDailySalesManager.tsx
│   │   ├── ReportsAnalytics.tsx
│   │   ├── UserManagement.tsx
│   │   └── ...
│   └── ui/              # Componentes de interface
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
├── hooks/               # Custom hooks
│   ├── use-ticket-flow.ts
│   ├── useUserPermissions.ts
│   └── ...
├── integrations/        # Integrações externas
│   └── supabase/
├── pages/               # Páginas da aplicação
│   ├── Index.tsx        # Página inicial
│   ├── Admin.tsx        # Painel administrativo
│   ├── Auth.tsx         # Autenticação
│   └── Dashboard.tsx    # Dashboard analítico
└── lib/                 # Utilitários
    └── utils.ts

supabase/
├── functions/           # Edge Functions
│   ├── create-pagseguro-payment/
│   ├── fetch-pagseguro-sales/
│   └── ...
└── migrations/          # Migrações do banco
```

## ⚙️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- Conta no PagSeguro (para pagamentos)

### Instalação

```bash
# Clone o repositório
git clone <URL_DO_REPOSITORIO>

# Entre na pasta do projeto
cd rua-iluminada-ticketing

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Configure as variáveis de ambiente no arquivo `.env`:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

3. Execute as migrações do banco de dados
4. Configure as políticas RLS conforme documentação

### Configuração do PagSeguro

1. Obtenha suas credenciais no PagSeguro
2. Configure as credenciais no painel administrativo
3. Teste a integração em ambiente sandbox

## 📖 Uso do Sistema

### Fluxo de Compra

1. **Seleção**: Cliente escolhe data, horário e tipo de ingresso
2. **Formulário**: Preenchimento de dados pessoais
3. **Pagamento**: Redirecionamento para PagSeguro
4. **Confirmação**: Recebimento do ingresso por email

### Fluxo Administrativo

1. **Login**: Autenticação no sistema
2. **Aprovação**: Admin aprova novos usuários
3. **Configuração**: Setup de eventos, horários e preços
4. **Vendas**: Acompanhamento em tempo real
5. **Relatórios**: Análise de performance

### Sistema de Lojas e Comissões

1. **Cadastro de Lojas**: Registre lojas físicas com percentual de comissão
2. **Vendas Diárias**: Registre vendas diárias de cada loja
3. **Cálculo Automático**: Sistema calcula comissões automaticamente
4. **Pagamento de Comissões**: Pague comissões através do livro caixa diário
5. **Relatórios**: Acompanhe performance e valores devidos por loja

## 🎛 Painel Administrativo

O painel administrativo é organizado em categorias:

### 🎅 Operações
- **Eventos**: Criação e gestão de eventos
- **Ingressos**: Configuração de tipos e preços
- **Gestão de Lojas**: Cadastro de pontos de venda físicos com percentuais de comissão

### 🛷 Vendas  
- **Vendas Online**: Gerenciamento de plataformas externas
- **Vendas das Lojas**: Registro diário de vendas das lojas com cálculo automático de comissões
- **Pedidos**: Visualização de todas as vendas

### 💰 Financeiro
- **Caixa Diário**: Registro de vendas presenciais e pagamento de comissões pendentes
- **Caixa Geral**: Consolidação financeira com controle de transferências
- **Pagamentos**: Configurações do PagSeguro

### ⭐ Administração
- **Relatórios**: Analytics e métricas incluindo performance das lojas
- **Backup**: Exportação e recuperação de dados
- **Marca**: Personalização visual
- **Performance**: Monitoramento do sistema
- **Analytics**: Integrações de tracking
- **Usuários**: Gestão de permissões

## 👥 Permissões de Usuário

### Master
- Acesso total ao sistema
- Gestão de usuários e permissões
- Configurações críticas

### Admin
- Acesso a todas as funcionalidades operacionais
- Relatórios e analytics
- Não pode gerenciar outros admins

### Operador
- Vendas presenciais
- Visualização de relatórios básicos
- Sem acesso a configurações

### Visualizador
- Apenas leitura de dados
- Relatórios básicos
- Sem permissões de edição

## 🔗 Integrações

### PagSeguro
- Processamento de pagamentos online
- Webhook para confirmação automática
- Suporte a PIX, cartão e boleto

### Google Analytics (Opcional)
- Tracking de conversões
- Análise de comportamento
- Métricas de performance

### Backup Automático
- Exportação diária de dados
- Recuperação de emergência
- Histórico de versões

## 🗄 API e Banco de Dados

### Principais Tabelas
- `events`: Eventos e programação
- `show_times`: Horários disponíveis
- `ticket_types`: Tipos de ingressos
- `stores`: Lojas físicas e percentuais de comissão
- `store_daily_sales`: Vendas diárias das lojas com comissões
- `orders`: Pedidos e vendas realizadas
- `tickets`: Ingressos gerados
- `user_roles`: Roles dos usuários
- `user_permissions`: Controle detalhado de acesso

### Edge Functions
- `create-pagseguro-payment`: Criação de pagamentos
- `fetch-pagseguro-sales`: Sincronização de vendas
- `realtime-notifications`: Notificações em tempo real
- `backup-export`: Exportação de dados

### Segurança
- Row Level Security (RLS) em todas as tabelas
- Políticas baseadas em roles
- Autenticação via Supabase Auth
- Validação de dados no backend

## 🚀 Deploy

### Lovable (Recomendado)
1. Acesse o [projeto no Lovable](https://lovable.dev/projects/f8e882a1-3df0-405f-9761-156eb73300cf)
2. Clique em "Share" → "Publish"
3. Configure domínio personalizado se necessário

### Outros Provedores
- Vercel
- Netlify  
- AWS Amplify
- Digital Ocean

### Variáveis de Ambiente em Produção
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

## 🐛 Troubleshooting

### Problemas Comuns

**Erro de conexão com Supabase**
- Verifique as credenciais
- Confirme se o projeto está ativo
- Verifique as políticas RLS

**Pagamentos não funcionam**
- Teste credenciais do PagSeguro
- Verifique webhook configurado
- Confirme ambiente (sandbox/produção)

**Usuário não consegue fazer login**
- Verifique se está aprovado
- Confirme permissões atribuídas
- Teste reset de senha

### Logs e Monitoramento

- Console do navegador para erros frontend
- Supabase Dashboard para logs de backend
- Edge Functions logs no Supabase
- Relatórios de performance no painel admin

## 📞 Suporte

Para suporte técnico, entre em contato através dos canais oficiais ou abra uma issue no repositório.

---

**Desenvolvido com ❤️ para a Família Moletta**

*Sistema de Ingressos Rua Iluminada - Versão 2025*