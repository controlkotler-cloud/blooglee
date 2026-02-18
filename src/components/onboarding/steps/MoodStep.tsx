interface MoodStepProps {
  onNext: () => void;
  onBack: () => void;
  saveStepData: (key: string, data: object) => void;
}

export function MoodStep({ onNext, onBack, saveStepData }: MoodStepProps) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-display font-bold mb-4">Paso 2b: Estilo Visual</h2>
      <p className="text-muted-foreground">Placeholder — se implementará en el siguiente prompt</p>
    </div>
  );
}
