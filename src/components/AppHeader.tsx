import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { LogOut, Moon, Sun, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NotificationBell } from '@/components/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  suporte: 'Suporte',
  gestor: 'Gestor',
  usuario: 'Usuário',
};

export function AppHeader() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const initials = profile?.name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-7 w-7">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.name} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium leading-none">{profile?.name}</span>
                <span className="text-xs text-muted-foreground leading-none mt-0.5">{roleLabels[profile?.role || 'usuario']}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 sm:hidden">
              <p className="text-sm font-medium">{profile?.name}</p>
              <p className="text-xs text-muted-foreground">{roleLabels[profile?.role || 'usuario']}</p>
            </div>
            <DropdownMenuSeparator className="sm:hidden" />
            <DropdownMenuItem asChild>
              <Link to="/perfil">
                <UserIcon className="mr-2 h-4 w-4" />
                Meu Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
