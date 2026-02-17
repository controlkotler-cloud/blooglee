import { ReactNode } from 'react';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { LiquidBlobs } from '@/components/saas/LiquidBlobs';

interface PublicLayoutProps {
  children: ReactNode;
  showBlobs?: boolean;
}

export const PublicLayout = ({ children, showBlobs = true }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50/50 to-orange-50/30 overflow-hidden">
      {showBlobs && <LiquidBlobs variant="hero" />}
      <PublicNavbar />
      <main id="main-content" className="relative z-10 pt-24 sm:pt-28">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
};
