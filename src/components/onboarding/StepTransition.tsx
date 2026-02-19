import { ReactNode, useEffect, useState, useRef } from 'react';

interface StepTransitionProps {
  stepKey: number;
  direction: 'forward' | 'backward';
  children: ReactNode;
}

/**
 * Wraps each onboarding step with a directional slide+fade transition.
 * Uses CSS animations triggered by key changes.
 */
export function StepTransition({ stepKey, direction, children }: StepTransitionProps) {
  const [displayedKey, setDisplayedKey] = useState(stepKey);
  const [phase, setPhase] = useState<'enter' | 'idle'>('enter');
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setPhase('enter');
      return;
    }
    // When stepKey changes, trigger enter animation
    setDisplayedKey(stepKey);
    setPhase('enter');
  }, [stepKey]);

  const enterClass =
    direction === 'forward'
      ? 'animate-step-enter-right'
      : 'animate-step-enter-left';

  return (
    <div
      key={displayedKey}
      className={phase === 'enter' ? enterClass : ''}
      onAnimationEnd={() => setPhase('idle')}
    >
      {children}
    </div>
  );
}
