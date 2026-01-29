import { useEffect, useRef } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

interface OnboardingTourProps {
  hasWordPressConfigured: boolean;
  onComplete: () => void;
  onConfigureWordPress?: () => void;
}

function getTourSteps(hasWordPressConfigured: boolean): DriveStep[] {
  const steps: DriveStep[] = [
    {
      element: '[data-tour="welcome"]',
      popover: {
        title: '¡Bienvenido a Blooglee! 🎉',
        description: 'Tu sitio está listo. Te guío para generar tu primer artículo en menos de 2 minutos.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="site-card"]',
      popover: {
        title: 'Este es tu sitio',
        description: 'Aquí verás el resumen de tu sitio, el número de artículos y el estado de WordPress.',
        side: 'bottom',
        align: 'start',
      },
    },
  ];

  if (!hasWordPressConfigured) {
    steps.push({
      element: '[data-tour="wordpress-config"]',
      popover: {
        title: '⚡ Configura WordPress primero',
        description: 'Para publicar artículos automáticamente, necesitas conectar tu WordPress. Haz clic aquí cuando termines el tour.',
        side: 'left',
        align: 'start',
      },
    });
  } else {
    steps.push({
      element: '[data-tour="generate-button"]',
      popover: {
        title: '✨ Genera tu primer artículo',
        description: '¡WordPress está conectado! Haz clic aquí para generar tu primer artículo automáticamente.',
        side: 'bottom',
        align: 'start',
      },
    });
  }

  steps.push({
    element: '[data-tour="view-articles"]',
    popover: {
      title: 'Aquí verás tus artículos',
      description: 'Una vez generados, podrás ver, editar y publicar tus artículos desde aquí.',
      side: 'bottom',
      align: 'start',
    },
  });

  return steps;
}

export function OnboardingTour({ 
  hasWordPressConfigured, 
  onComplete,
  onConfigureWordPress,
}: OnboardingTourProps) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Small delay to ensure DOM elements are rendered
    const timeoutId = setTimeout(() => {
      const steps = getTourSteps(hasWordPressConfigured);
      
      driverRef.current = driver({
        showProgress: true,
        progressText: 'Paso {{current}} de {{total}}',
        nextBtnText: 'Siguiente →',
        prevBtnText: '← Anterior',
        doneBtnText: '¡Empezar! 🚀',
        popoverClass: 'blooglee-tour-popover',
        overlayColor: 'rgba(0, 0, 0, 0.75)',
        stagePadding: 10,
        stageRadius: 8,
        allowClose: true,
        onDestroyStarted: () => {
          onComplete();
          driverRef.current?.destroy();
        },
        onCloseClick: () => {
          onComplete();
          driverRef.current?.destroy();
        },
        steps,
      });

      driverRef.current.drive();
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, [hasWordPressConfigured, onComplete]);

  return null;
}
