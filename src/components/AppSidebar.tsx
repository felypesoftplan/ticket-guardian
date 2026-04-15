import { LayoutDashboard, Ticket, Kanban, Building2, AlertTriangle, ListChecks, Tag, Shield, Users } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';

const mainItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Chamados', url: '/chamados', icon: Ticket },
  { title: 'Kanban', url: '/kanban', icon: Kanban, roles: ['admin', 'suporte'] },
];

const adminItems = [
  { title: 'Setores', url: '/admin/setores', icon: Building2 },
  { title: 'Prioridades', url: '/admin/prioridades', icon: AlertTriangle },
  { title: 'Status', url: '/admin/status', icon: ListChecks },
  { title: 'Tipos de Suporte', url: '/admin/tipos-suporte', icon: Tag },
  { title: 'Classes de Suporte', url: '/admin/classes-suporte', icon: Shield },
  { title: 'Usuários', url: '/admin/usuarios', icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { profile } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const isAdmin = profile?.role === 'admin';

  const visibleMainItems = mainItems.filter(item => {
    if (!item.roles) return true;
    return profile && item.roles.includes(profile.role);
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
            HD
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base text-sidebar-foreground leading-tight">Help DER</span>
              <span className="text-xs text-sidebar-foreground/60 leading-tight">DER-PE</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
