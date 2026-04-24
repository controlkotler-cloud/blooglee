import { UseCasePage } from "@/components/marketing/UseCasePage";
import { autonomosUseCase } from "@/data/useCases";

export default function Autonomos() {
  return <UseCasePage {...autonomosUseCase} />;
}
