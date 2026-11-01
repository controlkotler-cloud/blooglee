import { Navigate } from "react-router-dom";

// Las altas nuevas están cerradas: los enlaces de invitación beta ya no dan de alta.
export default function BetaSignup() {
  return <Navigate to="/auth" replace />;
}
