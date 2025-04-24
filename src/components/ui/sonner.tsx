import React from "react";
// import { useTheme } from "next-themes" // Removed next-themes dependency
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  // const { theme = "system" } = useTheme() // Removed theme logic

  return (
    <Sonner
      // theme={theme as ToasterProps["theme"]} // Removed theme prop
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          // Add custom classNames for success, error, warning, info if needed
          success: "group-[.toaster]:bg-green-600 group-[.toaster]:text-white", // Example success style
          error: "group-[.toaster]:bg-destructive group-[.toaster]:text-white", // Example error style
          warning: "group-[.toaster]:bg-yellow-500 group-[.toaster]:text-black", // Example warning style
          info: "group-[.toaster]:bg-blue-500 group-[.toaster]:text-white", // Example info style
        },
      }}
      // Removed inline style block as classNames are preferred
      {...props}
    />
  );
};

export { Toaster };
