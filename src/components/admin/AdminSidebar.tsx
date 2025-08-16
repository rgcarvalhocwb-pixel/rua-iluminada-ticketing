import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Calendar,
  Ticket,
  DollarSign,
  Banknote,
  Store,
  Globe,
  ShoppingCart,
  CreditCard,
  Users,
  BarChart3,
  Database,
  Palette,
  Activity,
  TrendingUp,
  LogOut,
  ChevronRight,
  Building2,
  Sun,
  Moon,
  Monitor,
  FileText,
  Shield,
  Computer
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserPermissions, hasPermission } from "@/hooks/useUserPermissions";
import christmasAvatar from "@/assets/christmas-avatar.png";
import logoRuaIluminada from "@/assets/logo-rua-iluminada.webp";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
  userEmail?: string;
  userRole?: string;
}

export function AdminSidebar({
  activeTab,
  onTabChange,
  onSignOut,
  userEmail,
  userRole,
}: AdminSidebarProps) {
  const { state, isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  const userPermissions = useUserPermissions();

  // No mobile, garantimos que o conteúdo esteja sempre expandido
  const isExpanded = isMobile ? true : state === "expanded";
  const collapsed = !isExpanded;

  const sidebarItems = [];

  // Principais módulos operacionais
  if (hasPermission(userPermissions, "events_manage")) {
    sidebarItems.push({
      id: "events",
      title: "Eventos",
      icon: Calendar,
      category: "operations",
    });
  }

  if (hasPermission(userPermissions, "tickets_manage")) {
    sidebarItems.push({
      id: "tickets",
      title: "Ingressos",
      icon: Ticket,
      category: "operations",
    });
  }

  if (hasPermission(userPermissions, "cash_daily")) {
    sidebarItems.push({
      id: "cash-register",
      title: "Caixa Diário",
      icon: DollarSign,
      category: "financial",
    });
  }

  if (hasPermission(userPermissions, "cash_general")) {
    sidebarItems.push({
      id: "general-cash",
      title: "Caixa Geral",
      icon: Banknote,
      category: "financial",
    });
  }

  if (hasPermission(userPermissions, "cash_daily")) {
    sidebarItems.push({
      id: "cash-closures",
      title: "Fechamentos",
      icon: FileText,
      category: "financial",
    });
  }

  if (hasPermission(userPermissions, "stores_manage")) {
    sidebarItems.push({
      id: "stores",
      title: "Gestão de Lojas",
      icon: Store,
      category: "operations",
    });
  }

  if (hasPermission(userPermissions, "stores_manage")) {
    sidebarItems.push({
      id: "store-sales",
      title: "Vendas das Lojas",
      icon: Building2,
      category: "operations",
    });
  }

  if (hasPermission(userPermissions, "online_sales")) {
    sidebarItems.push({
      id: "online",
      title: "Vendas Online",
      icon: Globe,
      category: "sales",
    });
  }

  if (hasPermission(userPermissions, "orders_view")) {
    sidebarItems.push({
      id: "orders",
      title: "Pedidos",
      icon: ShoppingCart,
      category: "sales",
    });
  }

  // Terminal de autoatendimento (apenas admins/masters)
  if (userPermissions.role === "master" || userPermissions.role === "admin") {
    sidebarItems.push({
      id: "terminal",
      title: "Terminal",
      icon: Computer,
      category: "sales",
    });
  }

  if (hasPermission(userPermissions, "payments_config")) {
    sidebarItems.push({
      id: "payments",
      title: "Pagamentos",
      icon: CreditCard,
      category: "financial",
    });
  }

  // Módulos administrativos (apenas para Masters e Admins)
  if (userPermissions.role === "master" || userPermissions.role === "admin") {
    sidebarItems.push(
      {
        id: "reports",
        title: "Relatórios",
        icon: BarChart3,
        category: "admin",
      },
      {
        id: "backup",
        title: "Backup",
        icon: Database,
        category: "admin",
      },
      {
        id: "branding",
        title: "Marca",
        icon: Palette,
        category: "admin",
      },
      {
        id: "performance",
        title: "Performance",
        icon: Activity,
        category: "admin",
      },
      {
        id: "analytics",
        title: "Analytics",
        icon: TrendingUp,
        category: "admin",
      },
      {
        id: "system-health",
        title: "Saúde do Sistema",
        icon: Activity,
        category: "admin",
      }
    );
  }

  if (hasPermission(userPermissions, "users_manage")) {
    sidebarItems.push({
      id: "users",
      title: "Usuários",
      icon: Users,
      category: "admin",
    });
  }

  if (hasPermission(userPermissions, "users_manage")) {
    sidebarItems.push({
      id: "audit",
      title: "Auditoria",
      icon: Shield,
      category: "admin",
    });
  }

  // Agrupar itens por categoria
  const operationsItems = sidebarItems.filter((item) => item.category === "operations");
  const salesItems = sidebarItems.filter((item) => item.category === "sales");
  const financialItems = sidebarItems.filter((item) => item.category === "financial");
  const adminItems = sidebarItems.filter((item) => item.category === "admin");

  const isActive = (id: string) => activeTab === id;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <SidebarHeader className="border-b border-border/40 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg overflow-hidden bg-white shadow-sm">
            <img 
              src={logoRuaIluminada} 
              alt="Rua Iluminada" 
              className="h-10 w-10 object-contain"
            />
          </div>
          {isExpanded && (
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-foreground">
                Rua Iluminada
              </span>
              <span className="text-xs text-muted-foreground">
                Sistema de Gestão
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        {/* Operações */}
        {operationsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Operações
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {operationsItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={isActive(item.id)}
                      tooltip={collapsed ? item.title : undefined}
                      className={`
                        mx-2 rounded-lg transition-all duration-200
                        ${isActive(item.id) 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "hover:bg-accent hover:text-accent-foreground"
                        }
                      `}
                    >
                       <item.icon className="h-5 w-5" />
                       <span className="font-medium">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Vendas */}
        {salesItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Vendas
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {salesItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={isActive(item.id)}
                      tooltip={collapsed ? item.title : undefined}
                      className={`
                        mx-2 rounded-lg transition-all duration-200
                        ${isActive(item.id) 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "hover:bg-accent hover:text-accent-foreground"
                        }
                      `}
                    >
                       <item.icon className="h-5 w-5" />
                       <span className="font-medium">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Financeiro */}
        {financialItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Financeiro
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {financialItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={isActive(item.id)}
                      tooltip={collapsed ? item.title : undefined}
                      className={`
                        mx-2 rounded-lg transition-all duration-200
                        ${isActive(item.id) 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "hover:bg-accent hover:text-accent-foreground"
                        }
                      `}
                    >
                       <item.icon className="h-5 w-5" />
                       <span className="font-medium">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Administração */}
        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={isActive(item.id)}
                      tooltip={collapsed ? item.title : undefined}
                      className={`
                        mx-2 rounded-lg transition-all duration-200
                        ${isActive(item.id) 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "hover:bg-accent hover:text-accent-foreground"
                        }
                      `}
                    >
                       <item.icon className="h-5 w-5" />
                       <span className="font-medium">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex flex-col gap-3">
              {/* User Profile Section */}
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={christmasAvatar} alt="Avatar" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {userEmail?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isExpanded && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      {userEmail}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {userRole}
                    </span>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              {isExpanded && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 w-full"
                    >
                      {theme === "light" ? (
                        <Sun className="h-4 w-4" />
                      ) : theme === "dark" ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Monitor className="h-4 w-4" />
                      )}
                      <span className="text-sm">
                        {theme === "light" ? "Claro" : theme === "dark" ? "Escuro" : "Sistema"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-48"
                    sideOffset={4}
                  >
                    <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
                      <Sun className="mr-2 h-4 w-4" />
                      Claro
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                      <Moon className="mr-2 h-4 w-4" />
                      Escuro
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
                      <Monitor className="mr-2 h-4 w-4" />
                      Sistema
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onSignOut}
                className="justify-start gap-2 w-full hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                {isExpanded && <span className="text-sm font-medium">Sair</span>}
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}