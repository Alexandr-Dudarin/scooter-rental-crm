import { Bike } from "lucide-react";

export function LoadingScreen() {
  return (
    <main className="loading-screen">
      <span className="loading-logo">
        <Bike size={30} />
      </span>
      <strong>SAMO CRM</strong>
      <span className="loading-line" />
    </main>
  );
}
