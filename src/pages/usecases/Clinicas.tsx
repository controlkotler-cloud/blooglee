import { UseCasePage } from "@/components/marketing/UseCasePage";
import { clinicasUseCase } from "@/data/useCases";

export default function Clinicas() {
  return <UseCasePage {...clinicasUseCase} />;
}
