import { ReactNode } from 'react';
import { BloogleeLogo } from '@/components/saas/BloogleeLogo';

interface OnboardingLayoutProps {
  children: ReactNode;
}

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50 to-orange-50 dark:from-background dark:to-muted">
      {/* Logo */}
      <div className="absolute top-6 left-6 z-10">
        <BloogleeLogo size="sm" showText={false} />
      </div>

      {/* Centered content */}
      <div className="min-h-screen flex items-start justify-center px-6 py-20">
        <div className="w-full max-w-[600px]">
          {children}
        </div>
      </div>
    </div>
  );
}
