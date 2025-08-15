import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserPermissions {
  role: 'user' | 'admin' | 'master' | 'terminal' | null;
  permissions: string[];
  loading: boolean;
}

export const useUserPermissions = (): UserPermissions => {
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({
    role: null,
    permissions: [],
    loading: true
  });

  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user.user) {
          setUserPermissions({ role: null, permissions: [], loading: false });
          return;
        }

        // Buscar role do usuário
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role, status')
          .eq('user_id', user.user.id)
          .single();

        if (roleError || !userRole || userRole.status !== 'approved') {
          setUserPermissions({ role: null, permissions: [], loading: false });
          return;
        }

        // Se for admin ou master, tem todas as permissões
        if (userRole.role === 'admin' || userRole.role === 'master') {
          setUserPermissions({
            role: userRole.role,
            permissions: [
              'events_manage',
              'tickets_manage', 
              'cash_daily',
              'cash_general',
              'stores_manage',
              'online_sales',
              'orders_view',
              'payments_config',
              'users_manage',
              'dashboard_view'
            ],
            loading: false
          });
          return;
        }

        // Se for terminal, tem permissões específicas para o terminal
        if (userRole.role === 'terminal') {
          setUserPermissions({
            role: userRole.role,
            permissions: [
              'terminal_access',
              'orders_create',
              'tickets_create'
            ],
            loading: false
          });
          return;
        }

        // Buscar permissões específicas para usuários normais
        const { data: permissions, error: permError } = await supabase
          .from('user_permissions')
          .select('permission')
          .eq('user_id', user.user.id);

        if (permError) {
          console.error('Erro ao buscar permissões:', permError);
          setUserPermissions({ role: userRole.role, permissions: [], loading: false });
          return;
        }

        setUserPermissions({
          role: userRole.role,
          permissions: permissions?.map(p => p.permission) || [],
          loading: false
        });

      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        setUserPermissions({ role: null, permissions: [], loading: false });
      }
    };

    fetchUserPermissions();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserPermissions();
    });

    return () => subscription.unsubscribe();
  }, []);

  return userPermissions;
};

// Função helper para verificar se tem uma permissão específica
export const hasPermission = (userPermissions: UserPermissions, permission: string): boolean => {
  if (userPermissions.loading) return false;
  if (!userPermissions.role) return false;
  
  // Masters e admins têm acesso total
  if (userPermissions.role === 'master' || userPermissions.role === 'admin') {
    return true;
  }
  
  // Verificar permissão específica
  return userPermissions.permissions.includes(permission);
};