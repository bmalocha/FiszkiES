import React, { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface TextInputFormProps {
  onSubmit: (text: string) => void;
  isGenerating: boolean;
}

const MAX_CHARS = 10000;

const TextInputForm: React.FC<TextInputFormProps> = ({ onSubmit, isGenerating }) => {
  const [text, setText] = useState("");
  const [charCount, setCharCount] = useState(0);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value;
    if (newText.length <= MAX_CHARS) {
      setText(newText);
      setCharCount(newText.length);
    }
    // Prevent further input beyond MAX_CHARS handled by maxLength attribute
  }, []);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (text.trim().length > 0 && !isGenerating) {
        onSubmit(text);
      }
    },
    [text, isGenerating, onSubmit]
  );

  const isSubmitDisabled = isGenerating || text.trim().length === 0 || charCount > MAX_CHARS;
  const isLimitReached = charCount >= MAX_CHARS;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid w-full gap-1.5">
        <Label htmlFor="text-input">Wklej tekst w dowolnym języku</Label>
        <Textarea
          id="text-input"
          placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki..."
          value={text}
          onChange={handleChange}
          maxLength={MAX_CHARS} // HTML5 attribute to prevent typing beyond limit
          rows={5} // Set default rows to 5
          className="max-h-[7.5rem]" // Add max height constraint for roughly 5 lines
          disabled={isGenerating}
          aria-describedby="char-counter-help"
        />
        <p id="char-counter-help" className={`text-sm ${isLimitReached ? "text-red-600" : "text-muted-foreground"}`}>
          {charCount} / {MAX_CHARS} znaków{isLimitReached ? " - Osiągnięto limit" : ""}
        </p>
      </div>
      <Button type="submit" variant="destructive" disabled={isSubmitDisabled}>
        {isGenerating ? "Generowanie..." : "Generuj fiszki"}
      </Button>
    </form>
  );
};

export default TextInputForm;
