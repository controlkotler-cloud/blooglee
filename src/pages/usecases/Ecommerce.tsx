import { UseCasePage } from "@/components/marketing/UseCasePage";
import { ecommerceUseCase } from "@/data/useCases";

export default function Ecommerce() {
  return <UseCasePage {...ecommerceUseCase} />;
}
