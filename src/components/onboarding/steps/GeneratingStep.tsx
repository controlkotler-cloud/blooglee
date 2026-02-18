interface GeneratingStepProps {
  onNext: () => void;
}

export function GeneratingStep({ onNext }: GeneratingStepProps) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-display font-bold mb-4">Paso 4: Generando tu artículo...</h2>
      <p className="text-muted-foreground">Placeholder — se implementará en el siguiente prompt</p>
    </div>
  );
}
