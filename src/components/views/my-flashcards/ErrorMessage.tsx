import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react"; // Icons
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({ message, onRetry, className }: ErrorMessageProps) {
  return (
    <Alert variant="destructive" className={`mt-4 ${className}`}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Wystąpił błąd</AlertTitle>
      <AlertDescription>{message || "Napotkano nieoczekiwany problem."}</AlertDescription>
      {onRetry && (
        <div className="mt-4 flex justify-end">
          <Button onClick={onRetry} variant="destructive">
            <RotateCcw className="mr-2 h-4 w-4" />
            Spróbuj ponownie
          </Button>
        </div>
      )}
    </Alert>
  );
}
