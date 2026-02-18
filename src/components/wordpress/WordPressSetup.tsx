import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUpsertWordPressConfig } from '@/hooks/useWordPressConfigSaas';
import { WPIntro } from './WPIntro';
import { WPUrlCheck } from './WPUrlCheck';
import { WPAppPasswordGuide } from './WPAppPasswordGuide';
import { WPCredentials } from './WPCredentials';
import { WPVerification } from './WPVerification';

export type WPSubStep = 'intro' | 'url_check' | 'app_password_guide' | 'credentials' | 'verification';

interface AuthResult {
  authenticated: boolean;
  can_publish: boolean;
  user_role: string;
  site_title: string;
  error_type?: 'auth_failed' | 'no_permissions' | 'timeout';
}

interface WordPressSetupProps {
  siteId: string;
  onClose: () => void;
  onComplete: () => void;
}

export function WordPressSetup({ siteId, onClose, onComplete }: WordPressSetupProps) {
  const { user } = useAuth();
  const [currentSubStep, setCurrentSubStep] = useState<WPSubStep>('intro');
  const [verifiedUrl, setVerifiedUrl] = useState('');
  const [authResult, setAuthResult] = useState<AuthResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastCredentials, setLastCredentials] = useState<{ username: string; appPassword: string } | null>(null);
  const upsertConfig = useUpsertWordPressConfig();

  const handleCredentialsSubmit = async (username: string, appPassword: string) => {
    setIsVerifying(true);
    setLastCredentials({ username, appPassword });

    try {
      const { data, error } = await supabase.functions.invoke('test-wordpress-auth', {
        body: { url: verifiedUrl, username, app_password: appPassword },
      });

      const result: AuthResult = error
        ? { authenticated: false, can_publish: false, user_role: '', site_title: '', error_type: 'timeout' }
        : (data as AuthResult);

      setAuthResult(result);

      // Save diagnostic
      if (user?.id) {
        await supabase.from('wordpress_diagnostics').insert({
          user_id: user.id,
          site_id: siteId,
          check_type: 'auth_test',
          status: result.authenticated && result.can_publish ? 'ok' : 'error',
          message: JSON.stringify({ url: verifiedUrl, user_role: result.user_role, error_type: result.error_type }),
          raw_response: result as any,
        } as any);
      }

      // If success, save credentials
      if (result.authenticated && result.can_publish) {
        await upsertConfig.mutateAsync({
          site_id: siteId,
          site_url: verifiedUrl,
          wp_username: username,
          wp_app_password: appPassword,
        });
      }

      setCurrentSubStep('verification');
    } catch {
      setAuthResult({ authenticated: false, can_publish: false, user_role: '', site_title: '', error_type: 'timeout' });
      setCurrentSubStep('verification');
    } finally {
      setIsVerifying(false);
    }
  };

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
      {currentSubStep === 'app_password_guide' && (
        <WPAppPasswordGuide
          siteUrl={verifiedUrl}
          onBack={() => setCurrentSubStep('url_check')}
          onContinue={() => setCurrentSubStep('credentials')}
        />
      )}
      {currentSubStep === 'credentials' && (
        <WPCredentials
          onBack={() => setCurrentSubStep('app_password_guide')}
          onSubmit={handleCredentialsSubmit}
          isLoading={isVerifying}
        />
      )}
      {currentSubStep === 'verification' && authResult && (
        <WPVerification
          result={authResult}
          siteUrl={verifiedUrl}
          onContinue={onComplete}
          onRetry={() => setCurrentSubStep('credentials')}
          onSkip={onClose}
        />
      )}
    </div>
  );
}
