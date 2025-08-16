# Rua Iluminada - Sistema de Bilheteria

Sistema completo de gerenciamento de ingressos e vendas para eventos, com terminal de autoatendimento e gestão administrativa.

## 🚀 Funcionalidades Principais

### 🎫 **Sistema de Bilheteria**
- Gestão completa de eventos e sessões
- Múltiplos tipos de ingressos por evento
- Controle de capacidade e disponibilidade
- Integração com PagSeguro para pagamentos online

### 💻 **Terminal de Autoatendimento**
- Interface touch-screen otimizada
- Processo de compra guiado e intuitivo
- Pagamento via PagSeguro integrado
- Impressão automática de ingressos
- Monitoramento de hardware (impressoras, pinpads)
- Modo offline com sincronização automática

### 📱 **App Mobile para Gestores**
- Monitoramento em tempo real
- Notificações push para alertas críticos
- Dashboard executivo móvel
- Gestão remota dos terminais

### 🛡️ **Sistema de Segurança**
- Detecção automática de fraudes
- Validação avançada de CPF e dados
- Auditoria completa de ações
- Criptografia end-to-end
- Políticas RLS no banco de dados

### 📊 **Analytics e Relatórios**
- Análise preditiva de vendas
- Métricas de performance em tempo real
- Relatórios financeiros detalhados
- Monitoramento de comportamento do usuário

### ⚙️ **Administração Completa**
- Gestão de usuários e permissões
- Configuração de eventos e preços
- Controle de caixa diário e geral
- Gestão de lojas e comissões
- Backup automático e recuperação

## 🧪 **Sistema de Testes**
- Suite de testes automatizados
- Validação de segurança e performance
- Testes de integração com PagSeguro
- Verificação de preparação para produção

## 🔧 **Tecnologias**

### Frontend
- **React 18** com TypeScript
- **Vite** para build otimizado
- **Tailwind CSS** para styling
- **Shadcn/ui** para componentes
- **React Query** para gerenciamento de estado
- **Capacitor** para app mobile

### Backend
- **Supabase** para banco de dados e autenticação
- **Edge Functions** para lógica de negócio
- **Row Level Security (RLS)** para segurança
- **Realtime** para atualizações em tempo real

### Integrações
- **PagSeguro** para processamento de pagamentos
- **Impressoras térmicas** para tickets
- **Pinpads** para pagamentos presenciais

## 📋 **Preparação para Produção**

### ✅ **Verificações de Segurança**
- [x] Políticas RLS configuradas
- [x] Validação de entrada implementada
- [x] Sistema de auditoria ativo
- [x] Detecção de fraudes funcionando

### ✅ **Performance**
- [x] Cache inteligente implementado
- [x] Otimização de imagens
- [x] Lazy loading configurado
- [x] Compressão de dados ativa

### ✅ **Infraestrutura**
- [x] Backup automático configurado
- [x] Monitoramento em tempo real
- [x] Tratamento de erros robusto
- [x] Sistema de logs completo

## 🚀 **Deploy**

### Configuração do Ambiente
1. Configure as variáveis de ambiente no Supabase
2. Adicione as credenciais do PagSeguro
3. Configure os domínios de produção
4. Ative as notificações push (se usando mobile)

### App Mobile
Para executar o app mobile:
```bash
# Instalar dependências
npm install

# Inicializar Capacitor
npx cap init

# Adicionar plataformas
npx cap add ios
npx cap add android

# Build e sync
npm run build
npx cap sync

# Executar no dispositivo
npx cap run ios    # Para iOS (requer Mac + Xcode)
npx cap run android # Para Android (requer Android Studio)
```

## 📖 **Documentação**

### Estrutura do Projeto
```
src/
├── components/          # Componentes React
│   ├── admin/          # Painel administrativo
│   └── ui/             # Componentes de interface
├── hooks/              # Custom hooks
├── pages/              # Páginas da aplicação
├── integrations/       # Integrações (Supabase)
└── lib/               # Utilitários

supabase/
├── functions/          # Edge Functions
└── migrations/        # Migrações do banco
```

### Edge Functions Principais
- `terminal-payment` - Processamento de pagamentos
- `terminal-hardware-status` - Status do hardware
- `terminal-print-ticket` - Impressão de ingressos
- `system-backup` - Backup automático
- `advanced-analytics` - Analytics avançados

## 🔐 **Segurança**

### Autenticação e Autorização
- Sistema de roles (admin, user, terminal, master)
- Permissões granulares por funcionalidade
- Sessões seguras com JWT

### Proteção de Dados
- Todas as tabelas com RLS habilitado
- Validação rigorosa de entrada
- Logs de auditoria para todas as ações
- Criptografia de dados sensíveis

### Monitoramento
- Detecção de atividades suspeitas
- Alertas automáticos para anomalias
- Métricas de segurança em tempo real

## 📞 **Suporte**

Para suporte técnico ou dúvidas sobre implementação, consulte:
- Documentação do Supabase: https://supabase.com/docs
- Documentação do PagSeguro: https://dev.pagseguro.uol.com.br/
- Documentação do Capacitor: https://capacitorjs.com/docs

---

**Desenvolvido com ❤️ para eventos inesquecíveis**