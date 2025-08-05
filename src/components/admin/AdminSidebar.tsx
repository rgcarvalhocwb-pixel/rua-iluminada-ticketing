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
  Monitor
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
  const { state } = useSidebar();
  const { theme, setTheme } = useTheme();
  const userPermissions = useUserPermissions();

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

  // Agrupar itens por categoria
  const operationsItems = sidebarItems.filter((item) => item.category === "operations");
  const salesItems = sidebarItems.filter((item) => item.category === "sales");
  const financialItems = sidebarItems.filter((item) => item.category === "financial");
  const adminItems = sidebarItems.filter((item) => item.category === "admin");

  const isActive = (id: string) => activeTab === id;

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b bg-gradient-to-r from-red-900 to-red-800 shadow-red-glow/20">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 text-white shadow-soft">
            <Building2 className="h-8 w-8" />
          </div>
          {state === "expanded" && (
            <div className="flex flex-col">
              <span className="text-lg font-bold font-dancing text-white">
                🎄 Rua Iluminada
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {/* Operações */}
        {operationsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-red-900 font-bold font-inter text-xs">
              🎅 Operações
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {operationsItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={isActive(item.id)}
                      tooltip={state === "collapsed" ? item.title : undefined}
                      className={`
                        transition-all duration-300 
                        ${isActive(item.id) 
                          ? "bg-red-800 text-white shadow-red-glow border border-red-700/50" 
                          : "hover:bg-accent hover:text-accent-foreground hover:shadow-green-glow/30"
                        }
                      `}
                    >
                       <item.icon className="h-4 w-4" />
                       <span className={`font-inter ${isActive(item.id) ? "text-white" : "text-black"}`}>{item.title}</span>
                      {isActive(item.id) && (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
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
            <SidebarGroupLabel className="text-red-900 font-bold font-inter text-xs">
              🛷 Vendas
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {salesItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={isActive(item.id)}
                      tooltip={state === "collapsed" ? item.title : undefined}
                      className={`
                        transition-all duration-300 
                        ${isActive(item.id) 
                          ? "bg-gradient-secondary text-secondary-foreground shadow-red-glow border border-secondary/20" 
                          : "hover:bg-gradient-accent hover:text-accent-foreground hover:shadow-green-glow/30"
                        }
                      `}
                    >
                       <item.icon className="h-4 w-4" />
                       <span className={`font-inter ${isActive(item.id) ? "text-white" : "text-black"}`}>{item.title}</span>
                      {isActive(item.id) && (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
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
            <SidebarGroupLabel className="text-red-900 font-bold font-inter text-xs">
              💰 Financeiro
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {financialItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={isActive(item.id)}
                      tooltip={state === "collapsed" ? item.title : undefined}
                      className={`
                        transition-all duration-300 
                        ${isActive(item.id) 
                          ? "bg-gradient-accent text-accent-foreground shadow-green-glow border border-accent/20" 
                          : "hover:bg-gradient-primary hover:text-primary-foreground hover:shadow-glow/30"
                        }
                      `}
                    >
                       <item.icon className="h-4 w-4" />
                       <span className={`font-inter ${isActive(item.id) ? "text-white" : "text-black"}`}>{item.title}</span>
                      {isActive(item.id) && (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
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
            <SidebarGroupLabel className="text-red-900 font-bold font-inter text-xs">
              ⭐ Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={isActive(item.id)}
                      tooltip={state === "collapsed" ? item.title : undefined}
                      className={`
                        transition-all duration-300 
                        ${isActive(item.id) 
                          ? "bg-gradient-christmas text-primary-foreground shadow-glow border border-primary/20" 
                          : "hover:bg-gradient-primary hover:text-primary-foreground hover:shadow-glow/30"
                        }
                      `}
                    >
                       <item.icon className="h-4 w-4" />
                       <span className={`font-inter ${isActive(item.id) ? "text-white" : "text-black"}`}>{item.title}</span>
                      {isActive(item.id) && (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t bg-gradient-christmas/20 shadow-soft">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex flex-col gap-3 p-3">
              {/* User Profile Section */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarImage src={christmasAvatar} alt="Avatar" />
                  <AvatarFallback className="bg-gradient-christmas text-white font-bold">
                    🎅
                  </AvatarFallback>
                </Avatar>
                {state === "expanded" && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium font-inter truncate">
                      {userEmail}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize font-inter">
                      🎄 {userRole}
                    </span>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              {state === "expanded" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 hover:bg-accent transition-all duration-300"
                    >
                      {theme === "light" ? (
                        <Sun className="h-4 w-4" />
                      ) : theme === "dark" ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Monitor className="h-4 w-4" />
                      )}
                      <span className="font-inter">Tema</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      <Sun className="mr-2 h-4 w-4" />
                      Claro
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      <Moon className="mr-2 h-4 w-4" />
                      Escuro
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
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
                className="justify-start gap-2 hover:bg-destructive hover:text-destructive-foreground transition-all duration-300"
              >
                <LogOut className="h-4 w-4" />
                {state === "expanded" && <span className="font-inter font-medium">🎅 Sair</span>}
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}