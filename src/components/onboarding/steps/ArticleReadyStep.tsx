interface ArticleReadyStepProps {
  onFinish: () => void;
}

export function ArticleReadyStep({ onFinish }: ArticleReadyStepProps) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-display font-bold mb-4">Paso 5: ¡Tu artículo está listo!</h2>
      <p className="text-muted-foreground">Placeholder — se implementará en el siguiente prompt</p>
    </div>
  );
}
