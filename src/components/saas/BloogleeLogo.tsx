import bloogleeLogo from '@/assets/blooglee-logo.png';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface BloogleeLogoProps {
  size?: LogoSize;
  showText?: boolean;
  className?: string;
}

const sizeClasses: Record<LogoSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
};

const textSizeClasses: Record<LogoSize, string> = {
  xs: 'text-sm',
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl'
};

export function BloogleeLogo({ 
  size = 'md', 
  showText = true, 
  className = '' 
}: BloogleeLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={bloogleeLogo} 
        alt="Blooglee" 
        className={`${sizeClasses[size]} object-contain`}
      />
      {showText && (
        <span className={`font-display font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 bg-clip-text text-transparent ${textSizeClasses[size]}`}>
          Blooglee
        </span>
      )}
    </div>
  );
}
