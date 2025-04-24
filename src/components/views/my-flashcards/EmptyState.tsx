import React from "react";
import { FileText } from "lucide-react"; // Example icon

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-lg mt-8">
      <FileText className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-muted-foreground">Brak fiszek</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Nie masz jeszcze żadnych zapisanych fiszek.
        <br />
        Możesz je wygenerować z dowolnego tekstu na stronie głównej.
        {/* TODO: Add a link/button to the generation page */}
      </p>
    </div>
  );
}
