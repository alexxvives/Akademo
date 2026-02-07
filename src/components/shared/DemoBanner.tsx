"use client";

import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle } from "lucide-react";

export function DemoBanner() {
  const { user } = useAuth();

  // Only show for demo accounts
  if (!user?.email?.toLowerCase().includes("demo")) {
    return null;
  }

  return (
    <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
      <AlertCircle className="h-4 w-4" />
      <span>
        Esta es una cuenta de demostración con datos de prueba. Los cambios no son permanentes.
      </span>
    </div>
  );
}
