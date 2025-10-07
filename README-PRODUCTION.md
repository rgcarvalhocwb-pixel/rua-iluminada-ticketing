# 🚀 Guia de Produção - Rua Iluminada Ticketing System

## 📋 Pré-requisitos de Hardware

### Impressoras Térmicas
- **Modelos suportados:** Epson TM-T88V, Bematech MP-4200 TH, Elgin i9, Zebra ZD220
- **Conexão:** USB ou Rede (TCP/IP)
- **Driver:** Instalar drivers do fabricante antes de usar
- **Configuração:** Detectadas automaticamente via Web USB API

### Catracas Topdata Fit
- **Modelo:** Topdata Fit QR Reader
- **Conexão:** TCP/IP (porta padrão: 9999)
- **Requisitos:** 
  - IP estático recomendado
  - Porta 9999 aberta no firewall
  - Firmware 3.x.x ou superior
- **Protocolo:** TCP/IP direto com comandos Topdata

### Pinpads
- **Modelos suportados:** 
  - Ingenico iPP350 (SDK integrado)
  - PagBank Moderninha X (API)
  - Stone Ton T2 (API)
  - Cielo LIO (SDK)
- **Conexão:** USB ou Bluetooth
- **SDKs:** Instalar SDKs dos fabricantes conforme necessário

---

## ⚙️ Configuração de Produção

### 1. Credenciais PagSeguro

Acessar: **Admin > Configurações > Pagamentos**

Configure:
- **Email de produção:** Seu email cadastrado no PagSeguro
- **Token de API:** Token de produção (nunca usar sandbox em produção!)
- **Ambiente:** Selecionar **Produção**

⚠️ **IMPORTANTE:** Teste sempre no ambiente sandbox antes de ir para produção.

### 2. Secrets no Supabase

Configurar os seguintes secrets no painel do Supabase:

```bash
PAGSEGURO_EMAIL=seu-email@producao.com
PAGSEGURO_TOKEN=seu-token-real-de-producao
PAGSEGURO_ENVIRONMENT=production  # Ou 'sandbox' para testes
```

**Como configurar:**
1. Acesse o painel do Supabase
2. Settings > Edge Functions
3. Adicione cada secret manualmente

### 2.1. Integração Compre no Zet

**Webhook URL:** `https://tzqriohyfazftfulwcuj.supabase.co/functions/v1/comprenozet-webhook`

**Configuração:**
1. Acesse o portal do Compre no Zet
2. Vá em Configurações → Webhooks
3. Adicione a URL acima
4. Selecione eventos: "Compra Confirmada" e "Estorno"

**Mapeamento de Eventos:**
- Os eventos devem ter o mesmo nome no sistema e no Compre no Zet, OU
- Adicionar `external_slug` na tabela `events`:
  ```sql
  UPDATE events SET external_slug = 'slug-comprenozet' WHERE name = 'Nome do Evento';
  ```

📖 **Documentação completa:** Ver `docs/COMPRENOZET-INTEGRATION.md`

### 3. Cadastro de Catracas

**Admin > Gerenciar Catracas > Nova Catraca**

Para cada catraca:
- **Nome:** Identificação única (ex: "Entrada Principal")
- **Localização:** Local físico da catraca
- **IP:** Endereço IP estático da catraca
- **Status:** Ativar após cadastro

Teste a conexão antes de colocar em produção.

### 4. Cadastro de Terminais

**Admin > Gerenciar Terminais**

Para cada terminal de autoatendimento:
- **ID único:** Identificador do terminal (ex: "terminal-001")
- **Localização:** Local físico
- **Hardware associado:** Selecionar impressora e pinpad

### 5. Limpeza de Dados de Teste

Antes de ir para produção:

1. Acesse **Admin > Sistema > Ferramentas de Desenvolvimento**
2. Clique em **"Limpar Dados de Teste"**
3. Confirme a remoção de todos os registros marcados como teste

Isso removerá:
- Pedidos de teste
- Eventos de teste
- Lojas de teste
- Catracas de teste
- Vendas importadas simuladas

---

## 📊 Fluxo de Operação Diária

### Início do Dia
1. **Abrir caixa diário** (Admin > Caixa Diário)
2. Verificar status dos terminais (Admin > Monitoramento)
3. Testar hardware (impressoras, pinpads, catracas)

### Durante o Evento
1. **Vendas automáticas** via terminais de autoatendimento
2. **Validação de ingressos** nas catracas
3. **Monitoramento em tempo real** via Admin ou Mobile App
4. Responder a alertas críticos imediatamente

### Fechamento do Dia
1. **Conciliar vendas** com validações
2. **Importar vendas PagSeguro** (Admin > Vendas Online)
3. **Fechar caixa diário**
4. **Gerar relatórios** para prestação de contas
5. **Consolidar no caixa geral**

---

## 🔍 Monitoramento

### Admin - Monitoramento de Terminais
**Localização:** Admin > Monitoramento

**Métricas visualizadas:**
- Status de cada terminal (online/offline)
- Vendas do dia por terminal
- Hardware conectado (impressoras, pinpads)
- Alertas ativos
- Uptime médio

**Atualização:** A cada 30 segundos + tempo real via subscriptions

### Mobile Manager
**Localização:** Mobile App > Dashboard

**Métricas visualizadas:**
- Terminais online/total
- Vendas de hoje (com tendência)
- Alertas críticos e avisos
- Status da rede

**Funcionalidade:** Validador de ingressos integrado

---

## 🛠️ Troubleshooting

### Hardware não detectado

**Sintomas:** Impressora, pinpad ou catraca aparecem como offline

**Soluções:**
1. Verificar conexão física (USB, Ethernet, energia)
2. Verificar drivers instalados
3. Testar manualmente: Admin > Hardware Status > Testar Conexão
4. Verificar logs: Admin > Logs do Sistema
5. Reiniciar terminal se necessário

### PagSeguro não importa vendas

**Sintomas:** Vendas não aparecem no sistema após importação

**Soluções:**
1. Verificar credenciais: Admin > Configurações > Pagamentos > Testar Conexão
2. Verificar se está usando ambiente correto (produção vs sandbox)
3. Verificar logs da edge function `fetch-pagseguro-sales`
4. Verificar se vendas já foram importadas anteriormente (duplicatas são filtradas)
5. Contatar suporte do PagSeguro se API estiver fora do ar

### Catraca não valida ingressos

**Sintomas:** Catraca não responde ou sempre retorna "Acesso Negado"

**Soluções:**
1. **Testar conectividade:**
   ```bash
   ping [IP_DA_CATRACA]
   telnet [IP_DA_CATRACA] 9999
   ```
2. Verificar se catraca está cadastrada: Admin > Catracas
3. Verificar se porta 9999 está aberta no firewall
4. Testar QR code manualmente com app validador
5. Verificar se ingresso já foi validado anteriormente
6. Verificar logs: Admin > Logs > Validações

### Terminal offline há muito tempo

**Sintomas:** Terminal não envia heartbeat há mais de 10 minutos

**Soluções:**
1. Verificar conexão com internet
2. Reiniciar aplicação do terminal
3. Verificar logs do navegador (F12)
4. Verificar se há erros de autenticação
5. Re-configurar terminal se necessário

### Performance lenta

**Sintomas:** Queries demoram muito, interface trava

**Soluções:**
1. Verificar índices do banco: Admin > Sistema > Production Readiness
2. Limpar dados de teste acumulados
3. Otimizar queries lentas identificadas
4. Escalar recursos do Supabase se necessário
5. Implementar cache quando apropriado

---

## 🔐 Segurança

### Pontos Críticos
- ✅ RLS (Row-Level Security) ativado em todas as tabelas sensíveis
- ✅ Políticas de acesso configuradas para cada role
- ✅ Rate limiting implementado nas edge functions críticas
- ✅ Secrets nunca expostos no código frontend
- ✅ HTTPS obrigatório em produção
- ✅ Backup automatizado diário

### Verificação de Segurança
Execute periodicamente: **Admin > Sistema > Production Readiness**

Isso verifica:
- RLS policies
- SSL/HTTPS
- Tempo de resposta da API
- Status de backups
- Variáveis de ambiente

---

## 📦 Backup e Recuperação

### Backup Automático
- **Frequência:** Diário às 3:00 AM
- **Retenção:** 30 dias
- **Localização:** Supabase Storage bucket `backups`

### Backup Manual
1. Admin > Sistema > Backup & Recovery
2. Clicar em "Criar Backup Agora"
3. Aguardar confirmação

### Recuperação
1. Admin > Sistema > Backup & Recovery
2. Selecionar backup desejado
3. Clicar em "Restaurar"
4. **CUIDADO:** Isso substituirá dados atuais!

---

## ✅ Checklist de Validação Pré-Produção

Antes de considerar o sistema pronto para produção:

### Configuração
- [ ] Credenciais PagSeguro de produção configuradas
- [ ] Secret `PAGSEGURO_ENVIRONMENT` = `production`
- [ ] Todas as catracas cadastradas e testadas
- [ ] Todos os terminais cadastrados
- [ ] Dados de teste removidos via "Limpar Dados de Teste"

### Funcionalidade
- [ ] Venda via terminal funciona end-to-end
- [ ] Pagamento PagSeguro processa corretamente
- [ ] Ingressos são gerados com QR code único
- [ ] Catracas validam ingressos corretamente
- [ ] Impressão de ingressos funciona
- [ ] Monitoramento em tempo real atualiza

### Segurança
- [ ] RLS ativado em todas as tabelas (verificar via Production Readiness)
- [ ] HTTPS habilitado
- [ ] Secrets não expostos no código
- [ ] Rate limiting testado
- [ ] Backup automatizado configurado

### Performance
- [ ] Índices criados (verificar logs da migration)
- [ ] Queries rápidas (<2 segundos)
- [ ] Terminal responde em menos de 1 segundo
- [ ] Monitoramento atualiza em tempo real

### Testes
- [ ] Fluxo completo testado em ambiente staging
- [ ] Hardware testado (impressoras, pinpads, catracas)
- [ ] Importação PagSeguro testada
- [ ] Validação de ingressos testada
- [ ] Fechamento de caixa testado

---

## 📞 Suporte

### Em caso de problemas críticos:

1. **Verificar logs do sistema:** Admin > Logs
2. **Verificar status dos serviços:** Admin > System Health
3. **Verificar alertas:** Admin > Monitoramento > Alertas
4. **Consultar este guia:** Seção Troubleshooting

### Contatos de Suporte
- **Supabase:** https://supabase.com/support
- **PagSeguro:** https://dev.pagseguro.uol.com.br/
- **Topdata Fit:** Suporte técnico do fabricante

---

## 📚 Recursos Adicionais

- [Documentação PagSeguro API V4](https://dev.pagseguro.uol.com.br/)
- [Supabase Documentation](https://supabase.com/docs)
- [Topdata Fit - Manual Técnico](http://topdata.com.br/)

---

**Versão do Documento:** 1.0.0  
**Última Atualização:** 2025-01-07  
**Desenvolvido por:** Equipe Rua Iluminada
