import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react"; // Assuming lucide-react is used by shadcn

interface LoadMoreButtonProps {
  onClick: () => void;
  isDisabled: boolean; // Renamed from canLoadMore for clarity in button context
  isLoading: boolean;
}

export function LoadMoreButton({ onClick, isDisabled, isLoading }: LoadMoreButtonProps) {
  return (
    <div className="flex justify-center mt-4">
      <Button onClick={onClick} disabled={isDisabled || isLoading} variant="outline">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Ładowanie...
          </>
        ) : (
          "Załaduj więcej"
        )}
      </Button>
    </div>
  );
}
