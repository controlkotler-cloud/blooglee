import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useAdminSurveys, useSurveyResponses, useUpdateSurvey, type Survey, type SurveyQuestion } from '@/hooks/useAdminSurveys';
import { ClipboardList, BarChart3, Star, CheckCircle, MessageSquare, ListChecks } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminSurveys() {
  const { data: surveys = [], isLoading: loadingSurveys } = useAdminSurveys();
  const { data: responses = [], isLoading: loadingResponses } = useSurveyResponses();
  const updateSurvey = useUpdateSurvey();

  const [selectedSurvey, setSelectedSurvey] = useState<string | null>(null);

  const handleToggleActive = async (survey: Survey) => {
    try {
      await updateSurvey.mutateAsync({
        id: survey.id,
        is_active: !survey.is_active,
      });
      toast.success(survey.is_active ? 'Encuesta desactivada' : 'Encuesta activada');
    } catch (error) {
      toast.error('Error al cambiar el estado');
    }
  };

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case 'rating': return <Star className="h-4 w-4" />;
      case 'boolean': return <CheckCircle className="h-4 w-4" />;
      case 'text': return <MessageSquare className="h-4 w-4" />;
      case 'select': return <ListChecks className="h-4 w-4" />;
      default: return null;
    }
  };

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case 'wordpress_activation': return 'Post-activación WordPress';
      case 'beta_expiring': return 'Pre-expiración Beta';
      default: return type;
    }
  };

  const selectedSurveyData = surveys.find(s => s.id === selectedSurvey);
  const selectedResponses = responses.filter(r => r.survey_id === selectedSurvey);

  // Calculate stats for selected survey
  const calculateStats = (question: SurveyQuestion) => {
    const questionResponses = selectedResponses
      .map(r => r.responses[question.id])
      .filter(v => v !== undefined && v !== null);

    if (question.type === 'rating') {
      const values = questionResponses.map(Number).filter(n => !isNaN(n));
      const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      return { avg: avg.toFixed(1), count: values.length };
    }

    if (question.type === 'boolean') {
      const yesCount = questionResponses.filter(v => v === true || v === 'true' || v === 'yes').length;
      const noCount = questionResponses.filter(v => v === false || v === 'false' || v === 'no').length;
      return { yes: yesCount, no: noCount, total: yesCount + noCount };
    }

    if (question.type === 'select') {
      const counts: Record<string, number> = {};
      questionResponses.forEach(v => {
        counts[v] = (counts[v] || 0) + 1;
      });
      return { counts, total: questionResponses.length };
    }

    return { responses: questionResponses };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Encuestas</h1>
          <p className="text-muted-foreground mt-1">
            Configura y visualiza las encuestas del programa beta
          </p>
        </div>

        <Tabs defaultValue="config" className="space-y-6">
          <TabsList>
            <TabsTrigger value="config" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="responses" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Respuestas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            {loadingSurveys ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              surveys.map((survey) => (
                <Card key={survey.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {survey.name}
                          <Badge variant={survey.is_active ? 'default' : 'outline'}>
                            {survey.is_active ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Disparador: {getTriggerLabel(survey.trigger_type)} 
                          ({survey.trigger_days_offset > 0 ? '+' : ''}{survey.trigger_days_offset} días)
                        </CardDescription>
                      </div>
                      <Switch 
                        checked={survey.is_active}
                        onCheckedChange={() => handleToggleActive(survey)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Preguntas ({survey.questions.length})</h4>
                      <div className="space-y-2">
                        {survey.questions.map((q, idx) => (
                          <div 
                            key={q.id} 
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {getQuestionIcon(q.type)}
                                <span className="text-sm font-medium">{q.question}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Tipo: {q.type}
                                {q.scale && ` (1-${q.scale})`}
                                {q.options && ` (${q.options.length} opciones)`}
                                {q.conditional && ' (condicional)'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="responses" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card 
                className={`cursor-pointer transition-colors ${!selectedSurvey ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedSurvey(null)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Todas las respuestas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{responses.length}</div>
                </CardContent>
              </Card>
              
              {surveys.map((survey) => {
                const count = responses.filter(r => r.survey_id === survey.id).length;
                return (
                  <Card 
                    key={survey.id}
                    className={`cursor-pointer transition-colors ${selectedSurvey === survey.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedSurvey(survey.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg truncate">{survey.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{count}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Stats for selected survey */}
            {selectedSurveyData && selectedResponses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas: {selectedSurveyData.name}</CardTitle>
                  <CardDescription>{selectedResponses.length} respuestas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedSurveyData.questions.map((q) => {
                    const stats = calculateStats(q);
                    return (
                      <div key={q.id} className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          {getQuestionIcon(q.type)}
                          <span className="font-medium">{q.question}</span>
                        </div>
                        
                        {q.type === 'rating' && 'avg' in stats && (
                          <div className="flex items-center gap-4">
                            <div className="text-2xl font-bold text-primary">
                              {stats.avg} <span className="text-sm text-muted-foreground">/ {q.scale}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ({stats.count} respuestas)
                            </div>
                          </div>
                        )}

                        {q.type === 'boolean' && 'yes' in stats && (
                          <div className="flex gap-4">
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Sí: {stats.yes} ({stats.total > 0 ? Math.round((stats.yes / stats.total) * 100) : 0}%)
                            </Badge>
                            <Badge variant="outline">
                              No: {stats.no} ({stats.total > 0 ? Math.round((stats.no / stats.total) * 100) : 0}%)
                            </Badge>
                          </div>
                        )}

                        {q.type === 'select' && 'counts' in stats && (
                          <div className="space-y-2">
                            {Object.entries(stats.counts).map(([option, count]) => (
                              <div key={option} className="flex items-center gap-2">
                                <div className="flex-1 bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-primary rounded-full h-2"
                                    style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                                  />
                                </div>
                                <span className="text-sm min-w-[120px]">{option}: {count}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {q.type === 'text' && 'responses' in stats && stats.responses.length > 0 && (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {stats.responses.slice(0, 5).map((r, i) => (
                              <p key={i} className="text-sm italic text-muted-foreground">
                                "{r}"
                              </p>
                            ))}
                            {stats.responses.length > 5 && (
                              <p className="text-xs text-muted-foreground">
                                +{stats.responses.length - 5} más...
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Responses Table */}
            <Card>
              <CardHeader>
                <CardTitle>Respuestas Detalladas</CardTitle>
                <CardDescription>
                  {selectedSurvey ? selectedResponses.length : responses.length} respuestas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingResponses ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Encuesta</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Respuestas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedSurvey ? selectedResponses : responses).slice(0, 20).map((response) => {
                        const survey = surveys.find(s => s.id === response.survey_id);
                        return (
                          <TableRow key={response.id}>
                            <TableCell className="font-medium">
                              {response.user_email}
                            </TableCell>
                            <TableCell>
                              {survey?.name || 'Desconocida'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(response.completed_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {JSON.stringify(response.responses).substring(0, 50)}...
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
