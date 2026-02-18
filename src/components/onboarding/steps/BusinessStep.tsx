interface BusinessStepProps {
  onNext: () => void;
  saveStepData: (key: string, data: object) => void;
}

export function BusinessStep({ onNext, saveStepData }: BusinessStepProps) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-display font-bold mb-4">Paso 1: Tu Negocio</h2>
      <p className="text-muted-foreground">Placeholder — se implementará en el siguiente prompt</p>
    </div>
  );
}
