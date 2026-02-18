import { useState } from 'react';
import { WPIntro } from './WPIntro';
import { WPUrlCheck } from './WPUrlCheck';

export type WPSubStep = 'intro' | 'url_check' | 'app_password_guide' | 'credentials' | 'verification';

interface WordPressSetupProps {
  siteId: string;
  onClose: () => void;
  onComplete: () => void;
}

export function WordPressSetup({ siteId, onClose, onComplete }: WordPressSetupProps) {
  const [currentSubStep, setCurrentSubStep] = useState<WPSubStep>('intro');
  const [verifiedUrl, setVerifiedUrl] = useState('');

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {currentSubStep === 'intro' && (
        <WPIntro
          onHasWordPress={() => setCurrentSubStep('url_check')}
          onSkip={onClose}
        />
      )}
      {currentSubStep === 'url_check' && (
        <WPUrlCheck
          siteId={siteId}
          onBack={() => setCurrentSubStep('intro')}
          onContinue={(url) => {
            setVerifiedUrl(url);
            setCurrentSubStep('app_password_guide');
          }}
          onSkip={onClose}
        />
      )}
      {/* Future sub-steps: app_password_guide, credentials, verification */}
      {(currentSubStep === 'app_password_guide' || currentSubStep === 'credentials' || currentSubStep === 'verification') && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Próximo paso: configuración de credenciales (próximamente)</p>
        </div>
      )}
    </div>
  );
}
