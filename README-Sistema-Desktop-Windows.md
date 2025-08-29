# PROMPT COMPLETO PARA SISTEMA DESKTOP WINDOWS - "RUA ILUMINADA"
================================================================================

## 1. VISÃO GERAL DO SISTEMA DESKTOP

Criar um sistema completo de venda de ingressos para instalação em rede local Windows, incluindo:
- Aplicação desktop principal (WPF/C# ou Electron)
- Setup.exe para instalação automatizada
- Servidor local para comunicação entre terminais
- Base de dados local (SQLite/SQL Server Express)
- Sistema de terminais de autoatendimento
- Interface de configuração de rede e hardware
- Sistema de backup local e sincronização em nuvem
- Aplicativo mobile para validação (Android/iOS)

## 2. ARQUITETURA TÉCNICA

### Stack Principal:
- **Desktop App**: C# WPF + .NET 8 ou Electron + React + TypeScript
- **Banco Local**: SQL Server Express LocalDB ou SQLite
- **Servidor Local**: ASP.NET Core Web API ou Node.js/Express
- **Comunicação**: SignalR para tempo real
- **Mobile**: React Native ou Flutter
- **Instalador**: WiX Toolset ou Inno Setup
- **Hardware**: Integração via USB/Serial/TCP

### Comunicação de Rede:
```
[Servidor Principal] ←→ [Terminal 1, 2, 3...] ←→ [App Mobile] ←→ [Hardware]
     ↓
[Banco de Dados Local] ←→ [Backup/Sync Nuvem]
```

## 3. ESTRUTURA DO BANCO DE DADOS LOCAL

### Tabelas Principais (SQL Server/SQLite):
```sql
-- Configuração do sistema
SystemConfig (
  id INT PRIMARY KEY,
  company_name NVARCHAR(200),
  installation_key NVARCHAR(100),
  server_ip NVARCHAR(50),
  server_port INT,
  backup_path NVARCHAR(500),
  cloud_sync_enabled BIT
)

-- Eventos e sessões
Events (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  name NVARCHAR(200) NOT NULL,
  description NTEXT,
  start_date DATETIME2,
  end_date DATETIME2,
  location NVARCHAR(300),
  max_capacity INT,
  active BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETDATE()
)

ShowTimes (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  event_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Events(id),
  show_date DATE,
  show_time TIME,
  capacity INT,
  available_tickets INT
)

TicketTypes (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  event_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Events(id),
  name NVARCHAR(100),
  price DECIMAL(10,2),
  half_price DECIMAL(10,2),
  description NTEXT,
  max_quantity INT,
  color NVARCHAR(20),
  visible BIT DEFAULT 1
)

-- Sistema de vendas
Orders (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  order_number NVARCHAR(20) UNIQUE,
  customer_name NVARCHAR(200),
  customer_email NVARCHAR(200),
  customer_cpf NVARCHAR(14),
  total_amount DECIMAL(10,2),
  payment_method NVARCHAR(20), -- cash, card, pix
  payment_status NVARCHAR(20), -- pending, confirmed, cancelled
  terminal_id NVARCHAR(50),
  created_by NVARCHAR(100),
  created_at DATETIME2 DEFAULT GETDATE()
)

OrderItems (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  order_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Orders(id),
  ticket_type_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES TicketTypes(id),
  quantity INT,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2)
)

Tickets (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  order_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Orders(id),
  ticket_type_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES TicketTypes(id),
  ticket_number NVARCHAR(20) UNIQUE,
  qr_code NVARCHAR(200),
  validation_status NVARCHAR(20) DEFAULT 'valid',
  validated_at DATETIME2,
  validator_user NVARCHAR(100),
  print_count INT DEFAULT 0
)

-- Gestão financeira local
DailyClosures (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  closure_date DATE,
  terminal_id NVARCHAR(50),
  operator_name NVARCHAR(100),
  total_sales DECIMAL(10,2),
  total_tickets INT,
  cash_amount DECIMAL(10,2),
  card_amount DECIMAL(10,2),
  pix_amount DECIMAL(10,2),
  opening_balance DECIMAL(10,2),
  closing_balance DECIMAL(10,2),
  status NVARCHAR(20), -- open, closed
  created_at DATETIME2 DEFAULT GETDATE()
)

-- Terminais e hardware
Terminals (
  id NVARCHAR(50) PRIMARY KEY,
  name NVARCHAR(100),
  ip_address NVARCHAR(50),
  mac_address NVARCHAR(50),
  terminal_type NVARCHAR(20), -- kiosk, cashier, validator
  location NVARCHAR(200),
  printer_model NVARCHAR(100),
  printer_port NVARCHAR(50),
  pinpad_model NVARCHAR(100),
  pinpad_port NVARCHAR(50),
  status NVARCHAR(20), -- online, offline, error
  last_heartbeat DATETIME2,
  version NVARCHAR(20)
)

-- Hardware e periféricos
Printers (
  id NVARCHAR(50) PRIMARY KEY,
  terminal_id NVARCHAR(50) FOREIGN KEY REFERENCES Terminals(id),
  model NVARCHAR(100),
  port NVARCHAR(50), -- USB, COM1, TCP
  paper_width INT, -- 58mm, 80mm
  status NVARCHAR(20), -- ready, error, no_paper
  last_test DATETIME2
)

Turnstiles (
  id NVARCHAR(50) PRIMARY KEY,
  name NVARCHAR(100),
  model NVARCHAR(100), -- TopData FIT, Custom
  ip_address NVARCHAR(50),
  port INT,
  location NVARCHAR(200),
  direction NVARCHAR(10), -- entry, exit
  status NVARCHAR(20), -- online, offline, blocked
  total_validations INT DEFAULT 0
)

-- Validações e acessos
Validations (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  ticket_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Tickets(id),
  turnstile_id NVARCHAR(50) FOREIGN KEY REFERENCES Turnstiles(id),
  validation_time DATETIME2 DEFAULT GETDATE(),
  validator_user NVARCHAR(100),
  validation_method NVARCHAR(20), -- qr_code, card, manual
  device_type NVARCHAR(20), -- turnstile, mobile, manual
  status NVARCHAR(20) -- success, error, duplicate
)

-- Usuários e permissões
Users (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  username NVARCHAR(100) UNIQUE,
  password_hash NVARCHAR(500),
  full_name NVARCHAR(200),
  email NVARCHAR(200),
  role NVARCHAR(50), -- master, admin, cashier, validator
  terminal_access NTEXT, -- JSON array of allowed terminals
  active BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETDATE(),
  last_login DATETIME2
)

UserSessions (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  user_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(id),
  terminal_id NVARCHAR(50),
  login_time DATETIME2,
  logout_time DATETIME2,
  ip_address NVARCHAR(50),
  session_token NVARCHAR(200)
)

-- Auditoria e logs
AuditLogs (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  user_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(id),
  action NVARCHAR(100),
  entity_type NVARCHAR(100),
  entity_id NVARCHAR(100),
  old_values NTEXT,
  new_values NTEXT,
  ip_address NVARCHAR(50),
  terminal_id NVARCHAR(50),
  timestamp DATETIME2 DEFAULT GETDATE()
)

SystemLogs (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  level NVARCHAR(20), -- info, warning, error, critical
  message NTEXT,
  component NVARCHAR(100),
  terminal_id NVARCHAR(50),
  exception_details NTEXT,
  timestamp DATETIME2 DEFAULT GETDATE()
)

-- Backup e sincronização
BackupHistory (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  backup_type NVARCHAR(20), -- full, incremental, cloud
  file_path NVARCHAR(500),
  file_size BIGINT,
  status NVARCHAR(20), -- success, error, in_progress
  started_at DATETIME2,
  completed_at DATETIME2,
  error_message NTEXT
)
```

## 4. ESTRUTURA DA APLICAÇÃO DESKTOP

### Aplicação Principal (C# WPF):
```csharp
// Estrutura de pastas
RuaIluminada.Desktop/
├── Views/
│   ├── MainWindow.xaml               // Tela principal
│   ├── LoginWindow.xaml              // Login do sistema
│   ├── EventsManagement.xaml         // Gestão de eventos
│   ├── TicketSales.xaml              // Vendas de ingressos
│   ├── CashierModule.xaml            // Módulo do caixa
│   ├── ReportsModule.xaml            // Relatórios
│   ├── SettingsWindow.xaml           // Configurações
│   └── TerminalConfig.xaml           // Config. terminais
├── ViewModels/
│   ├── MainViewModel.cs
│   ├── EventsViewModel.cs
│   ├── SalesViewModel.cs
│   └── SettingsViewModel.cs
├── Models/
│   ├── Event.cs
│   ├── Ticket.cs
│   ├── Order.cs
│   └── Terminal.cs
├── Services/
│   ├── DatabaseService.cs            // Acesso ao banco
│   ├── PrinterService.cs             // Controle impressoras
│   ├── PaymentService.cs             // Pagamentos
│   ├── NetworkService.cs             // Comunicação rede
│   ├── BackupService.cs              // Backup automático
│   └── HardwareService.cs            // Hardware geral
├── Hardware/
│   ├── PrinterDrivers/               // Drivers impressoras
│   ├── PinpadIntegration/            // Integração pinpads
│   └── TurnstileProtocols/           // Protocolos catracas
└── Utils/
    ├── QRCodeGenerator.cs
    ├── EncryptionHelper.cs
    └── LoggingService.cs
```

### Servidor Local (ASP.NET Core):
```csharp
// RuaIluminada.LocalServer/
├── Controllers/
│   ├── SalesController.cs            // API vendas
│   ├── TerminalsController.cs        // Gerenciamento terminais
│   ├── HardwareController.cs         // Status hardware
│   └── SyncController.cs             // Sincronização
├── Services/
│   ├── TerminalManager.cs            // Gestão terminais
│   ├── HardwareMonitor.cs            // Monitor hardware
│   ├── PaymentProcessor.cs           // Processamento pagamentos
│   └── CloudSyncService.cs           // Sync nuvem
├── Hubs/
│   ├── TerminalHub.cs                // SignalR terminals
│   └── NotificationHub.cs            // Notificações
└── Data/
    └── LocalDbContext.cs             // EF Core context
```

## 5. TERMINAL DE AUTOATENDIMENTO

### Interface Kiosk (WPF Fullscreen):
```csharp
// RuaIluminada.Kiosk/
├── Views/
│   ├── WelcomeScreen.xaml            // Tela inicial
│   ├── EventSelection.xaml           // Seleção eventos
│   ├── TicketSelection.xaml          // Seleção ingressos
│   ├── CustomerForm.xaml             // Dados cliente
│   ├── PaymentScreen.xaml            // Pagamento
│   ├── PrintingScreen.xaml           // Impressão
│   └── ThankYouScreen.xaml           // Finalização
├── Services/
│   ├── KioskService.cs               // Comunicação servidor
│   ├── LocalPrinterService.cs        // Impressão local
│   ├── PinpadService.cs              // Integração pinpad
│   └── ScreensaverService.cs         // Proteção de tela
└── Hardware/
    ├── SerialPortManager.cs          // Comunicação serial
    ├── USBDeviceManager.cs           // Dispositivos USB
    └── TCPDeviceManager.cs           // Dispositivos rede
```

## 6. APLICATIVO MOBILE VALIDADOR

### App React Native/Flutter:
```
RuaIluminada.Mobile/
├── screens/
│   ├── LoginScreen                   // Login validador
│   ├── QRScannerScreen               // Scanner QR Code
│   ├── ManualValidation              // Validação manual
│   ├── OfflineMode                   // Modo offline
│   └── ReportsScreen                 // Relatórios do dia
├── services/
│   ├── QRScannerService              // Scanner nativo
│   ├── OfflineStorage                // Armazenamento local
│   ├── ServerSync                    // Sincronização
│   └── BluetoothPrinter              // Impressora Bluetooth
├── components/
│   ├── TicketDisplay                 // Exibição ingresso
│   ├── ValidationStatus              // Status validação
│   └── NetworkStatus                 // Status conexão
└── utils/
    ├── CameraPermissions
    ├── StorageManager
    └── NetworkMonitor
```

## 7. SISTEMA DE INSTALAÇÃO

### Setup.exe (WiX Toolset):
```xml
<!-- RuaIluminada.Installer/Product.wxs -->
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product Id="*" 
           Name="Rua Iluminada - Sistema de Ingressos" 
           Language="1046" 
           Version="1.0.0" 
           Manufacturer="Rua Iluminada">
    
    <!-- Componentes principais -->
    <ComponentGroup Id="MainApplication">
      <Component Directory="INSTALLFOLDER">
        <File Source="RuaIluminada.Desktop.exe" />
        <File Source="RuaIluminada.LocalServer.exe" />
        <!-- Dependências .NET -->
      </Component>
    </ComponentGroup>
    
    <!-- Banco de dados -->
    <ComponentGroup Id="Database">
      <Component Directory="DatabaseFolder">
        <File Source="InitialDatabase.sql" />
        <File Source="DatabaseSetup.exe" />
      </Component>
    </ComponentGroup>
    
    <!-- Drivers de hardware -->
    <ComponentGroup Id="HardwareDrivers">
      <Component Directory="DriversFolder">
        <File Source="PrinterDrivers\*.dll" />
        <File Source="PinpadDrivers\*.dll" />
      </Component>
    </ComponentGroup>
    
    <!-- Configuração automática -->
    <CustomAction Id="ConfigureNetwork" 
                  BinaryKey="NetworkConfig"
                  ExeCommand="[INSTALLFOLDER]NetworkSetup.exe" />
    
    <CustomAction Id="InstallDatabase"
                  BinaryKey="DatabaseInstaller"
                  ExeCommand="[DatabaseFolder]DatabaseSetup.exe" />
  </Product>
</Wix>
```

### Assistente de Configuração:
```csharp
// NetworkSetupWizard.cs
public class NetworkSetupWizard
{
    public void ConfigureNetwork()
    {
        // 1. Detectar adaptadores de rede
        // 2. Configurar IP do servidor principal
        // 3. Configurar firewall (portas 8080, 8443)
        // 4. Testar conectividade entre terminais
        // 5. Configurar backup automático
    }
    
    public void SetupDatabase()
    {
        // 1. Instalar SQL Server Express LocalDB
        // 2. Criar banco de dados inicial
        // 3. Executar migrations
        // 4. Configurar backup automático
    }
    
    public void ConfigureHardware()
    {
        // 1. Detectar impressoras conectadas
        // 2. Configurar drivers
        // 3. Testar impressão
        // 4. Configurar catracas de rede
    }
}
```

## 8. INTEGRAÇÃO COM HARDWARE

### Impressoras Térmicas:
```csharp
// PrinterService.cs
public class PrinterService
{
    // Suporte múltiplos modelos
    public enum PrinterType
    {
        Bematech_MP4200TH,
        Elgin_I7,
        Daruma_DR800,
        Epson_TM_T20,
        Generic_ESC_POS
    }
    
    public async Task<bool> PrintTicket(Ticket ticket)
    {
        // ESC/POS commands para impressão
        var commands = GenerateESCPOSCommands(ticket);
        return await SendToPrinter(commands);
    }
    
    public bool TestPrinter()
    {
        // Teste de impressão
    }
}
```

### Pinpads (TEF):
```csharp
// PinpadService.cs
public class PinpadService
{
    public enum PinpadModel
    {
        Ingenico_iWL250,
        Verifone_VX520,
        Gertec_PPC920,
        PagSeguro_Moderninha
    }
    
    public async Task<PaymentResult> ProcessPayment(decimal amount, PaymentType type)
    {
        // Integração via DLL do fabricante
        // Protocolo específico de cada modelo
    }
}
```

### Catracas Topdata:
```csharp
// TurnstileService.cs
public class TurnstileService
{
    public async Task<bool> ValidateTicket(string qrCode, string turnstileId)
    {
        // Protocolo TCP específico Topdata
        // Comando de liberação catraca
    }
    
    public async Task<TurnstileStatus> GetStatus(string turnstileId)
    {
        // Monitoramento em tempo real
    }
}
```

## 9. COMUNICAÇÃO ENTRE TERMINAIS

### SignalR Hub:
```csharp
// TerminalHub.cs
public class TerminalHub : Hub
{
    public async Task JoinTerminalGroup(string terminalId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Terminal_{terminalId}");
    }
    
    public async Task NotifyTerminals(string message, object data)
    {
        await Clients.All.SendAsync("ReceiveNotification", message, data);
    }
    
    public async Task SyncData(string terminalId, object syncData)
    {
        // Sincronização de dados entre terminais
    }
}
```

### Protocolo de Comunicação:
```json
{
  "messageType": "SALE_COMPLETED",
  "terminalId": "TERMINAL_001",
  "timestamp": "2024-12-20T15:30:00",
  "data": {
    "orderId": "uuid",
    "ticketCount": 2,
    "totalAmount": 100.00,
    "paymentMethod": "card"
  }
}
```

## 10. SISTEMA DE BACKUP E SINCRONIZAÇÃO

### Backup Local Automático:
```csharp
// BackupService.cs
public class BackupService
{
    public async Task CreateDailyBackup()
    {
        // 1. Backup completo do banco de dados
        // 2. Backup de arquivos de configuração
        // 3. Backup de logs do sistema
        // 4. Compactação e armazenamento local
    }
    
    public async Task SyncToCloud()
    {
        // Sincronização com serviços em nuvem
        // Suporte: Google Drive, OneDrive, Dropbox
    }
}
```

### Recuperação de Desastres:
```csharp
// DisasterRecoveryService.cs
public class DisasterRecoveryService
{
    public async Task RestoreFromBackup(string backupFilePath)
    {
        // 1. Validar integridade do backup
        // 2. Restaurar banco de dados
        // 3. Restaurar configurações
        // 4. Reinicializar serviços
    }
    
    public async Task CreateSystemImage()
    {
        // Imagem completa do sistema para recuperação rápida
    }
}
```

## 11. CONFIGURAÇÃO DE REDE E SEGURANÇA

### Firewall e Portas:
```
Portas necessárias:
- 8080: HTTP API Local
- 8443: HTTPS API Local
- 5000: SignalR Hub
- 1433: SQL Server (apenas local)
- 9100-9200: Impressoras de rede
- 3001-3010: Catracas Topdata
```

### Criptografia Local:
```csharp
// SecurityService.cs
public class SecurityService
{
    public string EncryptSensitiveData(string data)
    {
        // AES-256 encryption para dados sensíveis
    }
    
    public bool ValidateUserAccess(string username, string terminalId)
    {
        // Validação de acesso por terminal
    }
    
    public void GenerateInstallationKey()
    {
        // Chave única por instalação
    }
}
```

## 12. RELATÓRIOS E ANALYTICS

### Relatórios Locais:
```csharp
// ReportsService.cs
public class ReportsService
{
    public DailySalesReport GetDailySales(DateTime date)
    {
        // Relatório de vendas do dia
    }
    
    public TerminalPerformanceReport GetTerminalPerformance()
    {
        // Performance de cada terminal
    }
    
    public HardwareStatusReport GetHardwareStatus()
    {
        // Status de todo hardware conectado
    }
    
    public void ExportToExcel(object reportData, string fileName)
    {
        // Exportação para Excel/PDF
    }
}
```

## 13. MONITORAMENTO E ALERTAS

### Sistema de Alertas:
```csharp
// AlertingService.cs
public class AlertingService
{
    public enum AlertType
    {
        HardwareFailure,
        NetworkDisconnection,
        PrinterOutOfPaper,
        DatabaseError,
        SecurityBreach,
        LowDiskSpace
    }
    
    public void SendAlert(AlertType type, string message, string component)
    {
        // Notificações via email, SMS, sistema
    }
    
    public void MonitorSystemHealth()
    {
        // Monitoramento contínuo do sistema
    }
}
```

## 14. CONFIGURAÇÃO INICIAL DO SISTEMA

### Wizard de Primeira Configuração:
```csharp
// FirstRunWizard.cs
public class FirstRunWizard
{
    public void RunInitialSetup()
    {
        // 1. Configuração básica da empresa
        // 2. Configuração de rede
        // 3. Configuração de hardware
        // 4. Criação do usuário master
        // 5. Teste de conectividade
        // 6. Configuração de backup
        // 7. Importação de dados iniciais
    }
}
```

### Configurações do Sistema:
```json
{
  "company": {
    "name": "Rua Iluminada",
    "cnpj": "00.000.000/0001-00",
    "address": "Endereço completo",
    "logo": "path/to/logo.png"
  },
  "network": {
    "serverIP": "192.168.1.100",
    "serverPort": 8080,
    "terminals": [
      {"id": "TERM001", "ip": "192.168.1.101", "type": "kiosk"},
      {"id": "TERM002", "ip": "192.168.1.102", "type": "cashier"}
    ]
  },
  "hardware": {
    "printers": [
      {"id": "PRT001", "model": "Bematech MP4200", "port": "COM1"}
    ],
    "pinpads": [
      {"id": "PIN001", "model": "Ingenico iWL250", "port": "COM2"}
    ],
    "turnstiles": [
      {"id": "TRN001", "model": "Topdata FIT", "ip": "192.168.1.200"}
    ]
  },
  "backup": {
    "localPath": "C:\\Backups\\RuaIluminada",
    "cloudEnabled": true,
    "cloudProvider": "GoogleDrive",
    "scheduleTime": "02:00"
  }
}
```

## 15. PASSOS DE IMPLEMENTAÇÃO

1. **Estrutura Base** (2-3 semanas):
   - Criar projetos C# WPF/Electron
   - Configurar banco de dados local
   - Implementar autenticação básica
   - Sistema de logs e auditoria

2. **Interface Principal** (2 semanas):
   - Tela principal com módulos
   - Gestão de eventos e ingressos
   - Sistema de vendas básico
   - Relatórios simples

3. **Terminal de Autoatendimento** (2 semanas):
   - Interface kiosk fullscreen
   - Integração com servidor local
   - Sistema de pagamentos
   - Impressão de ingressos

4. **Integração Hardware** (3 semanas):
   - Drivers de impressoras
   - Integração com pinpads
   - Protocolo catracas Topdata
   - Sistema de monitoramento

5. **App Mobile Validador** (2 semanas):
   - Scanner QR Code nativo
   - Modo offline
   - Sincronização automática
   - Interface otimizada

6. **Sistema de Instalação** (1 semana):
   - Setup.exe com WiX
   - Wizard de configuração
   - Instalação de dependências
   - Testes automáticos

7. **Backup e Sincronização** (1 semana):
   - Backup automático local
   - Sincronização em nuvem
   - Recuperação de desastres
   - Monitoramento de saúde

8. **Testes e Otimização** (2 semanas):
   - Testes de carga
   - Otimização de performance
   - Testes de hardware
   - Documentação final

## 16. REQUISITOS DO SISTEMA

### Servidor Principal:
- Windows 10/11 Pro ou Windows Server 2019+
- Intel Core i5 ou superior
- 8GB RAM mínimo (16GB recomendado)
- 500GB HD (SSD recomendado)
- Placa de rede Gigabit
- Conexão com internet (para sincronização)

### Terminais:
- Windows 10/11
- Intel Core i3 ou superior
- 4GB RAM
- 128GB SSD
- Monitor touch (para kiosk)
- Impressora térmica
- Pinpad (opcional)

### Rede Local:
- Switch gerenciável
- Roteador com QoS
- Cabo de rede Cat 5e ou superior
- Velocidade mínima 100Mbps entre dispositivos

Este prompt contém TODAS as especificações necessárias para criar um sistema completo de vendas de ingressos para Windows, com instalação local, integração de hardware e funcionamento em rede.

=== FIM DO PROMPT ===
Gerado em: ${new Date().toLocaleString('pt-BR')}
Sistema: Rua Iluminada - Versão Desktop Windows
Versão: 1.0
Plataforma: .NET 8 + WPF + SQL Server Express