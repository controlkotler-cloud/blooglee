interface TopicStepProps {
  onNext: () => void;
  onBack: () => void;
  saveStepData: (key: string, data: object) => void;
}

export function TopicStep({ onNext, onBack, saveStepData }: TopicStepProps) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-display font-bold mb-4">Paso 3: Elige un Tema</h2>
      <p className="text-muted-foreground">Placeholder — se implementará en el siguiente prompt</p>
    </div>
  );
}
