import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  ClipboardList,
  TicketPlus,
  Settings,
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface AdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/users', icon: Users, label: 'Usuarios' },
  { path: '/admin/beta-users', icon: UserCheck, label: 'Usuarios Beta' },
  { path: '/admin/invitations', icon: TicketPlus, label: 'Invitaciones Beta' },
  { path: '/admin/surveys', icon: ClipboardList, label: 'Encuestas' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
            Panel Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Blooglee</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <Link to="/dashboard">
            <Button variant="outline" className="w-full justify-start gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver a Blooglee
            </Button>
          </Link>
          <Link to="/mkpro">
            <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
              <Settings className="h-4 w-4" />
              Ir a MKPro
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
