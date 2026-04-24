import { UseCasePage } from "@/components/marketing/UseCasePage";
import { agenciasUseCase } from "@/data/useCases";

export default function Agencias() {
  return <UseCasePage {...agenciasUseCase} />;
}
