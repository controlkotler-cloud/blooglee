import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  ClipboardList,
  TicketPlus,
  Settings,
  ArrowLeft,
  LogOut,
  Menu,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/users', icon: Users, label: 'Usuarios' },
  { path: '/admin/beta-users', icon: UserCheck, label: 'Usuarios Beta' },
  { path: '/admin/invitations', icon: TicketPlus, label: 'Invitaciones' },
  { path: '/admin/surveys', icon: ClipboardList, label: 'Encuestas' },
  { path: '/admin/prompts', icon: Settings, label: 'Prompts' },
  { path: '/admin/social', icon: Share2, label: 'Social Media' },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <>
      <div className="p-4 sm:p-6 border-b border-border">
        <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
          Panel Admin
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Blooglee</p>
      </div>

      <nav className="flex-1 p-3 sm:p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = item.exact 
            ? location.pathname === item.path 
            : location.pathname.startsWith(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 sm:py-2 rounded-lg text-sm transition-colors",
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

      <div className="p-3 sm:p-4 border-t border-border space-y-1.5 sm:space-y-2">
        <Link to="/dashboard" onClick={onNavigate}>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-9 sm:h-10">
            <ArrowLeft className="h-4 w-4" />
            Volver a Blooglee
          </Button>
        </Link>
        <Link to="/mkpro" onClick={onNavigate}>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground h-9 sm:h-10">
            <Settings className="h-4 w-4" />
            Ir a MKPro
          </Button>
        </Link>
        <Button 
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground h-9 sm:h-10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <header className="sticky top-0 z-40 h-14 border-b bg-card flex items-center px-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col">
              <NavContent onNavigate={() => setIsOpen(false)} />
            </SheetContent>
          </Sheet>
          <h1 className="ml-3 font-bold text-sm bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
            Panel Admin
          </h1>
        </header>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="w-64 bg-card border-r border-border flex flex-col sticky top-0 h-screen">
            <NavContent />
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
