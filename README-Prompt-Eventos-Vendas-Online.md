# PROMPT: Sistema de Gestão de Eventos e Vendas Online por Terceiros

## Visão Geral do Sistema

Desenvolva um sistema completo de gestão de eventos e vendas de ingressos por plataformas terceiras, integrado ao sistema principal de ticketing. O sistema deve permitir a criação, configuração e monitoramento de eventos, além do controle financeiro de vendas realizadas por outras plataformas.

## Módulo 1: Gerenciamento de Eventos (EventsManager)

### Funcionalidades Principais:
- ✅ Criação, edição e exclusão de eventos
- ✅ Listagem de eventos com filtros e ordenação
- ✅ Configuração integrada de tipos de ingressos e horários
- ✅ Notificação automática de atualizações para toda a aplicação

### Estrutura da Tabela `events`:
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Interface React - EventsManager:
- **Componentes utilizados**: Dialog, Table, Button, Input, Textarea
- **Estados gerenciados**: eventos, loading, dialogOpen, editingEvent, selectedEventId
- **Formulário**: nome, descrição, data de início, data de fim
- **Ações**: criar, editar, excluir, configurar (tipos de ingresso + horários)
- **Integração**: TicketTypeManager e ShowTimeManager renderizados condicionalmente

### Recursos Especiais:
- **Validação de datas**: Data de fim deve ser posterior à data de início
- **Eventos customizados**: Dispara 'eventsUpdated' para sincronização global
- **Layout responsivo**: Grid adaptativo para configurações de evento

## Módulo 2: Tipos de Ingressos (TicketTypeManager)

### Funcionalidades:
- ✅ Criação e edição de tipos de ingressos por evento
- ✅ Definição de preços, descrições e ordem de exibição
- ✅ Controle de status ativo/inativo
- ✅ Ordenação customizável

### Estrutura da Tabela `ticket_types`:
```sql
CREATE TABLE ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Interface React:
- **Formulário**: nome, descrição, preço, ordem de exibição, status ativo
- **Tabela**: exibição ordenada com ações de editar/excluir
- **Validações**: preços positivos, campos obrigatórios

## Módulo 3: Horários de Sessões (ShowTimeManager)

### Funcionalidades:
- ✅ Definição de horários de sessões por evento
- ✅ Controle de capacidade por horário
- ✅ Gestão de disponibilidade

### Estrutura da Tabela `show_times`:
```sql
CREATE TABLE show_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  time_slot TIME NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Módulo 4: Vendas Online por Terceiros (OnlineSalesManager)

### Funcionalidades Principais:
- ✅ Registro manual de vendas de plataformas terceiras
- ✅ Controle de estornos e cancelamentos
- ✅ Conciliação de repasses financeiros
- ✅ Relatórios de vendas por plataforma
- ✅ Dashboard com resumos financeiros

### Estrutura da Tabela `online_sales`:
```sql
CREATE TABLE online_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  platform_name TEXT NOT NULL,
  ticket_type TEXT NOT NULL,
  quantity_sold INTEGER NOT NULL DEFAULT 0,
  quantity_refunded INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL,
  sale_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Estrutura da Tabela `online_transfers`:
```sql
CREATE TABLE online_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name TEXT NOT NULL,
  transfer_date DATE NOT NULL,
  expected_amount NUMERIC NOT NULL,
  received_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  event_id UUID,
  received_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Interface React - OnlineSalesManager:
- **Seleção de Evento**: Dropdown para escolher evento ativo
- **Abas (Tabs)**: "Lançamento de Vendas" e "Conciliação de Repasses"

#### Aba 1: Lançamento de Vendas
- **Formulário de Venda**:
  - Plataforma (Sympla, Eventbrite, etc.)
  - Tipo de ingresso (Inteira, Meia, VIP, etc.)
  - Quantidade vendida e estornada
  - Valor unitário
  - Data da venda

- **Resumo Financeiro**:
  - Total vendido (cards coloridos)
  - Total estornado
  - Valor líquido
  - Tabela detalhada de vendas

#### Aba 2: Conciliação de Repasses
- **Formulário de Repasse**:
  - Plataforma
  - Data do repasse
  - Valor esperado vs. valor recebido
  - Status (pendente/recebido)
  - Observações

- **Tabela de Repasses**:
  - Listagem com status colorido
  - Ação para marcar como recebido
  - Diferenças destacadas

### Plataformas Suportadas:
- Sympla
- Eventbrite
- Ingresse
- Zig Tickets
- Ticket360
- Outras plataformas customizáveis

## Módulo 5: Integração e Fluxo de Dados

### Relacionamentos:
```
events (1) → (N) ticket_types
events (1) → (N) show_times  
events (1) → (N) online_sales
online_transfers → events (opcional)
```

### Fluxo de Trabalho:
1. **Criação do Evento**: Nome, datas, descrição
2. **Configuração de Ingressos**: Tipos, preços, status
3. **Definição de Horários**: Sessões e capacidades
4. **Lançamento de Vendas Externas**: Registro por plataforma
5. **Conciliação Financeira**: Controle de repasses
6. **Relatórios**: Análise de performance por canal

## Políticas de Segurança (RLS)

### Tabela `events`:
- **Autenticados podem gerenciar**: CREATE, READ, UPDATE, DELETE
- **Público pode visualizar**: READ only

### Tabelas `online_sales` e `online_transfers`:
- **Apenas admin/master**: Todas as operações
- **Usuários comuns**: Sem acesso

### Auditoria:
- Log de todas as operações de vendas
- Rastreamento de usuários responsáveis
- Histórico de alterações

## Funcionalidades Especiais

### 1. Dashboard de Vendas:
- Gráficos de vendas por plataforma
- Comparativo mensal/anual
- Performance por tipo de ingresso
- Taxa de conversão por canal

### 2. Alertas Automáticos:
- Repasses em atraso
- Divergências financeiras
- Vendas acima/abaixo da média

### 3. Exportação de Dados:
- Relatórios em PDF/Excel
- Dados para conciliação contábil
- Extratos por período

### 4. Importação Automática:
- Webhooks de plataformas parceiras
- Sincronização automática de vendas
- Processamento de dados em lote

## Interface de Usuário

### Componentes Visuais:
- **Cards coloridos** para métricas financeiras
- **Tabelas responsivas** com ordenação
- **Formulários modais** para edição
- **Abas organizadas** por funcionalidade
- **Status visuais** para repasses e vendas

### Experiência do Usuário:
- **Seleção de evento** sempre visível
- **Ações rápidas** em botões destacados
- **Feedback visual** para operações
- **Validações em tempo real**
- **Navegação intuitiva** entre módulos

## Tecnologias e Padrões

### Frontend:
- **React + TypeScript**
- **Tailwind CSS** (design system)
- **Shadcn/ui** components
- **React Hook Form** para formulários
- **Date-fns** para manipulação de datas

### Backend:
- **Supabase** (PostgreSQL + Auth + RLS)
- **Edge Functions** para integrações
- **Webhooks** para sincronização
- **Backup automático** dos dados

### Integrações:
- **APIs de terceiros** (plataformas de venda)
- **Sistemas de pagamento** (PagSeguro, etc.)
- **Ferramentas de análise** (Google Analytics)
- **Exportação contábil** (padrões fiscais)

## Implementação Prioritária

### Fase 1 (Essencial):
1. CRUD de eventos completo
2. Gestão de tipos de ingressos
3. Lançamento manual de vendas externas
4. Resumos financeiros básicos

### Fase 2 (Avançada):
1. Conciliação de repasses
2. Dashboard analítico
3. Exportação de relatórios
4. Alertas automáticos

### Fase 3 (Integração):
1. Webhooks de plataformas
2. Importação automática
3. Sincronização em tempo real
4. APIs para terceiros

## Considerações de Performance

- **Paginação** para listagens grandes
- **Cache** de consultas frequentes
- **Índices** otimizados nas tabelas
- **Lazy loading** de componentes
- **Debounce** em campos de busca

Este prompt define um sistema robusto e escalável para gestão completa de eventos e vendas por terceiros, com foco na experiência do usuário e integridade dos dados financeiros.