import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  // AlertDialogTrigger, // Trigger is handled by parent state
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
  errorMessage?: string | null;
}

export function DeleteConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  isPending,
  errorMessage,
}: DeleteConfirmationModalProps) {
  // Use onOpenChange to call onCancel when the dialog is closed
  // by clicking outside or pressing Escape.
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onCancel();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      {/* <AlertDialogTrigger> - We control opening externally */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Potwierdzenie usunięcia</AlertDialogTitle>
          <AlertDialogDescription>
            Czy na pewno chcesz usunąć tę fiszkę? Tej akcji nie można cofnąć.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage && <p className="text-sm font-medium text-destructive">Błąd: {errorMessage}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isPending}>
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={onConfirm} disabled={isPending} variant="destructive">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Usuń
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
