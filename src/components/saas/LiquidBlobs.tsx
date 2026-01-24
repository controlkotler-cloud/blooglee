import { useEffect, useRef } from 'react';

interface LiquidBlobsProps {
  variant?: 'hero' | 'section' | 'minimal';
  className?: string;
}

export const LiquidBlobs = ({ variant = 'hero', className = '' }: LiquidBlobsProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Añadir pequeñas variaciones aleatorias a la animación
    const blobs = svgRef.current?.querySelectorAll('.liquid-blob');
    blobs?.forEach((blob, i) => {
      const delay = i * 0.5;
      (blob as SVGElement).style.animationDelay = `${delay}s`;
    });
  }, []);

  if (variant === 'minimal') {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Gradientes líquidos */}
            <linearGradient id="liquid-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(265, 89%, 58%)" />
              <stop offset="50%" stopColor="hsl(330, 85%, 60%)" />
              <stop offset="100%" stopColor="hsl(25, 95%, 60%)" />
            </linearGradient>
            <filter id="liquid-blur-sm" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            </filter>
          </defs>
          
          <ellipse 
            className="liquid-blob animate-[blob-morph-1_12s_ease-in-out_infinite]"
            cx="200" cy="150" rx="80" ry="60"
            fill="url(#liquid-grad-1)" opacity="0.3"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Gradientes principales - Violeta a Naranja pasando por Rosa */}
          <linearGradient id="liquid-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(265, 89%, 65%)" />
            <stop offset="30%" stopColor="hsl(290, 85%, 60%)" />
            <stop offset="60%" stopColor="hsl(330, 85%, 65%)" />
            <stop offset="100%" stopColor="hsl(25, 95%, 65%)" />
          </linearGradient>

          <linearGradient id="liquid-grad-pink" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(330, 90%, 70%)" />
            <stop offset="50%" stopColor="hsl(300, 80%, 65%)" />
            <stop offset="100%" stopColor="hsl(265, 85%, 60%)" />
          </linearGradient>

          <linearGradient id="liquid-grad-orange" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(40, 95%, 70%)" />
            <stop offset="40%" stopColor="hsl(25, 95%, 65%)" />
            <stop offset="100%" stopColor="hsl(330, 85%, 65%)" />
          </linearGradient>

          <linearGradient id="liquid-grad-cyan" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(185, 90%, 60%)" />
            <stop offset="100%" stopColor="hsl(200, 85%, 55%)" />
          </linearGradient>

          {/* Filtros para efecto 3D/cristal */}
          <filter id="liquid-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="20" result="blur" />
            <feColorMatrix in="blur" type="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.4 0" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="liquid-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
          </filter>

          {/* Filtro de sombra interna para efecto 3D */}
          <filter id="inner-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="15" result="blur" />
            <feOffset in="blur" dx="10" dy="15" result="offsetBlur" />
            <feComposite in="SourceGraphic" in2="offsetBlur" operator="over" />
          </filter>

          {/* Gradiente radial para reflexión */}
          <radialGradient id="reflection" cx="30%" cy="30%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Capa de fondo con gradiente suave */}
        <rect 
          x="0" y="0" 
          width="100%" height="100%" 
          fill="url(#bg-gradient)" 
          opacity="0"
        />

        {/* BLOB PRINCIPAL GRANDE - Centro */}
        <g className="liquid-blob" style={{ transformOrigin: 'center' }}>
          <path
            className="animate-[blob-morph-1_15s_ease-in-out_infinite]"
            d="M650,350 
               C750,280 850,320 900,400 
               C950,480 920,560 850,600 
               C780,640 700,620 620,580 
               C540,540 480,480 500,400 
               C520,320 550,420 650,350Z"
            fill="url(#liquid-grad-main)"
            filter="url(#liquid-glow)"
            opacity="0.9"
          />
          {/* Reflexión del blob principal */}
          <ellipse
            className="animate-[reflection-shift_8s_ease-in-out_infinite]"
            cx="680" cy="380" rx="80" ry="50"
            fill="url(#reflection)"
            opacity="0.5"
          />
        </g>

        {/* BLOB SECUNDARIO - Derecha arriba */}
        <g className="liquid-blob">
          <path
            className="animate-[blob-morph-2_12s_ease-in-out_infinite]"
            d="M1050,200 
               C1120,150 1200,180 1220,250 
               C1240,320 1200,380 1130,400 
               C1060,420 1000,380 980,310 
               C960,240 980,250 1050,200Z"
            fill="url(#liquid-grad-orange)"
            filter="url(#liquid-glow)"
            opacity="0.85"
          />
          <ellipse
            className="animate-[reflection-shift_6s_ease-in-out_infinite]"
            cx="1080" cy="240" rx="40" ry="25"
            fill="url(#reflection)"
            opacity="0.4"
          />
        </g>

        {/* BLOB TERCIARIO - Izquierda */}
        <g className="liquid-blob">
          <path
            className="animate-[blob-morph-3_18s_ease-in-out_infinite]"
            d="M200,400 
               C280,340 360,380 380,460 
               C400,540 350,620 270,640 
               C190,660 120,600 100,520 
               C80,440 120,460 200,400Z"
            fill="url(#liquid-grad-pink)"
            filter="url(#liquid-glow)"
            opacity="0.8"
          />
          <ellipse
            className="animate-[reflection-shift_10s_ease-in-out_infinite]"
            cx="240" cy="450" rx="50" ry="30"
            fill="url(#reflection)"
            opacity="0.45"
          />
        </g>

        {/* BLOB PEQUEÑO - Arriba izquierda */}
        <g className="liquid-blob">
          <path
            className="animate-[blob-morph-2_10s_ease-in-out_infinite]"
            d="M300,150 
               C360,110 420,140 440,200 
               C460,260 420,300 360,310 
               C300,320 250,280 240,220 
               C230,160 240,190 300,150Z"
            fill="url(#liquid-grad-main)"
            filter="url(#liquid-glow)"
            opacity="0.7"
          />
        </g>

        {/* BLOB PEQUEÑO - Abajo derecha */}
        <g className="liquid-blob">
          <path
            className="animate-[blob-morph-1_14s_ease-in-out_infinite]"
            d="M950,650 
               C1010,620 1080,660 1100,720 
               C1120,780 1080,830 1010,850 
               C940,870 880,830 860,770 
               C840,710 890,680 950,650Z"
            fill="url(#liquid-grad-pink)"
            filter="url(#liquid-glow)"
            opacity="0.65"
          />
        </g>

        {/* Mini blobs decorativos */}
        <ellipse
          className="liquid-blob animate-[float-blob_8s_ease-in-out_infinite]"
          cx="500" cy="200" rx="30" ry="25"
          fill="url(#liquid-grad-cyan)"
          filter="url(#liquid-blur)"
          opacity="0.5"
        />
        
        <ellipse
          className="liquid-blob animate-[float-blob_10s_ease-in-out_infinite]"
          cx="1200" cy="500" rx="25" ry="20"
          fill="url(#liquid-grad-orange)"
          filter="url(#liquid-blur)"
          opacity="0.4"
        />

        <ellipse
          className="liquid-blob animate-[float-blob_7s_ease-in-out_infinite]"
          cx="150" cy="250" rx="20" ry="18"
          fill="url(#liquid-grad-pink)"
          filter="url(#liquid-blur)"
          opacity="0.45"
        />

        {/* Elementos geométricos decorativos */}
        <g className="animate-[float-geo_6s_ease-in-out_infinite]" opacity="0.3">
          <polygon points="80,150 90,170 70,170" fill="none" stroke="hsl(265, 70%, 50%)" strokeWidth="1.5"/>
          <polygon points="100,160 110,180 90,180" fill="none" stroke="hsl(265, 70%, 50%)" strokeWidth="1.5"/>
          <polygon points="120,170 130,190 110,190" fill="none" stroke="hsl(265, 70%, 50%)" strokeWidth="1.5"/>
        </g>

        <g className="animate-[float-geo_8s_ease-in-out_infinite]" opacity="0.25" transform="translate(1200, 400)">
          <polygon points="0,0 10,20 -10,20" fill="hsl(25, 90%, 60%)" />
          <polygon points="30,10 40,30 20,30" fill="hsl(25, 90%, 60%)" />
          <polygon points="60,0 70,20 50,20" fill="hsl(25, 90%, 60%)" />
        </g>
      </svg>

      {/* Capa de overlay con gradiente para transición suave */}
      {variant === 'hero' && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80 pointer-events-none" />
      )}
    </div>
  );
};

export default LiquidBlobs;
