import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertTriangle, XCircle, RefreshCw, ExternalLink, Stethoscope } from 'lucide-react';
import { useWordPressHealthCheck, HealthCheck, HealthCheckResult } from '@/hooks/useWordPressHealthCheck';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface WordPressHealthCheckProps {
  siteUrl: string;
  wpUsername?: string;
  wpAppPassword?: string;
  onComplete?: (result: HealthCheckResult) => void;
}

function CheckItem({ check }: { check: HealthCheck }) {
  const getIcon = () => {
    switch (check.status) {
      case 'ok':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium",
          check.status === 'ok' && "text-green-700",
          check.status === 'warning' && "text-amber-700",
          check.status === 'error' && "text-red-700",
        )}>
          {check.message}
        </p>
        {check.action && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {check.action}
          </p>
        )}
        {check.solution_slug && (
          <Link
            to={`/help/article/${check.solution_slug}`}
            className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
          >
            Ver solución
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function WordPressHealthCheck({ siteUrl, wpUsername, wpAppPassword, onComplete }: WordPressHealthCheckProps) {
  const { isChecking, result, error, runHealthCheck, resetHealthCheck } = useWordPressHealthCheck();
  const [hasRun, setHasRun] = useState(false);

  const handleRunCheck = async () => {
    // Determine which phase to run based on available credentials
    const phase = wpUsername && wpAppPassword ? 3 : 1;
    const healthResult = await runHealthCheck(siteUrl, wpUsername, wpAppPassword, phase);
    setHasRun(true);
    if (healthResult && onComplete) {
      onComplete(healthResult);
    }
  };

  const getOverallStatusBadge = () => {
    if (!result) return null;
    
    switch (result.overall_status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">✓ Todo correcto</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">⚠ Con advertencias</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">✗ Problemas detectados</Badge>;
    }
  };

  if (!hasRun && !isChecking) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" />
            Diagnóstico de conexión
          </CardTitle>
          <CardDescription>
            Verifica que tu WordPress está correctamente configurado para Blooglee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleRunCheck}
            variant="outline"
            className="w-full"
            disabled={!siteUrl}
          >
            <Stethoscope className="w-4 h-4 mr-2" />
            Ejecutar diagnóstico
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" />
            Diagnóstico de conexión
          </CardTitle>
          {getOverallStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        {isChecking ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span>Ejecutando diagnóstico...</span>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button
              onClick={handleRunCheck}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        ) : result ? (
          <div className="space-y-4">
            {/* Checks list */}
            <div className="divide-y">
              {result.checks.map((check, index) => (
                <CheckItem key={`${check.id}-${index}`} check={check} />
              ))}
            </div>

            {/* Detected plugins */}
            {result.detected_plugins.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Plugins detectados:
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.detected_plugins.map(plugin => (
                    <Badge key={plugin} variant="secondary" className="text-xs">
                      {plugin}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Recomendaciones:
                </p>
                <div className="space-y-1">
                  {result.recommendations.map(rec => (
                    <Link
                      key={rec.slug}
                      to={`/help/article/${rec.slug}`}
                      className="block text-xs text-primary hover:underline"
                    >
                      → {rec.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Refresh button */}
            <Button
              onClick={handleRunCheck}
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Ejecutar de nuevo
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
