import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// Optional: import { Loader2 } from "lucide-react";

export function RegisterForm() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError("Hasła nie są zgodne.");
      setIsLoading(false);
      return;
    }

    if (!email || !password) {
      setError("Proszę wypełnić wszystkie pola.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || "Rejestracja zakończona sukcesem! Możesz się teraz zalogować.");
        // Clear form on success
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        // Handle errors (4xx, 5xx)
        // Check for specific validation errors if details are provided
        if (data.details && typeof data.details === "object") {
          const firstErrorKey = Object.keys(data.details)[0];
          const firstErrorMessage = data.details[firstErrorKey]?.[0];
          setError(firstErrorMessage || data.error || `Błąd rejestracji (status: ${response.status})`);
        } else {
          setError(data.error || `Błąd rejestracji (status: ${response.status})`);
        }
      }
    } catch (networkError) {
      console.error("Registration network error:", networkError);
      setError("Nie można połączyć się z serwerem. Spróbuj ponownie później.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Rejestracja</CardTitle>
        <CardDescription>Wprowadź swój email i hasło, aby utworzyć konto.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Potwierdź Hasło</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                {/* Optional: <Loader2 className="mr-2 h-4 w-4 animate-spin" /> */}
                Rejestrowanie...
              </>
            ) : (
              "Zarejestruj się"
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            Masz już konto?{" "}
            <a href="/login" className="text-primary hover:underline">
              Zaloguj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default RegisterForm;
