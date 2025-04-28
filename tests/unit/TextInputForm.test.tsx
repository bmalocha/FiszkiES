import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import TextInputForm from "../../src/components/views/TextInputForm";

const MAX_CHARS = 10000;

describe("TextInputForm", () => {
  const onSubmitMock = vi.fn();

  beforeEach(() => {
    onSubmitMock.mockClear(); // Clear mock history before each test
  });

  it("renders correctly with initial state", () => {
    render(<TextInputForm onSubmit={onSubmitMock} isGenerating={false} />);

    expect(screen.getByLabelText(/wklej tekst/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/wklej tutaj tekst/i)).toBeInTheDocument();
    expect(screen.getByText(`0 / ${MAX_CHARS} znaków`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generuj fiszki/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generuj fiszki/i })).toBeDisabled(); // Initially disabled as text is empty
  });

  it("updates text state and character count on input", async () => {
    render(<TextInputForm onSubmit={onSubmitMock} isGenerating={false} />);
    const textarea = screen.getByLabelText(/wklej tekst/i);
    const testText = "Hello world";

    await userEvent.type(textarea, testText);

    expect(textarea).toHaveValue(testText);
    expect(screen.getByText(`${testText.length} / ${MAX_CHARS} znaków`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generuj fiszki/i })).toBeEnabled(); // Button should be enabled now
  });

  it("calls onSubmit prop with the current text when form is submitted", async () => {
    const testText = "Sample input text";
    render(<TextInputForm onSubmit={onSubmitMock} isGenerating={false} />);
    const textarea = screen.getByLabelText(/wklej tekst/i);
    const submitButton = screen.getByRole("button", { name: /generuj fiszki/i });

    await userEvent.type(textarea, testText);
    await userEvent.click(submitButton);

    expect(onSubmitMock).toHaveBeenCalledTimes(1);
    expect(onSubmitMock).toHaveBeenCalledWith(testText);
  });

  it("does not call onSubmit when text is empty or only whitespace", async () => {
    render(<TextInputForm onSubmit={onSubmitMock} isGenerating={false} />);
    const textarea = screen.getByLabelText(/wklej tekst/i);
    const submitButton = screen.getByRole("button", { name: /generuj fiszki/i });

    // Test with empty text (already default)
    expect(submitButton).toBeDisabled();
    // fireEvent.submit(screen.getByRole('form')); // fireEvent won't work on disabled button

    // Test with whitespace
    await userEvent.type(textarea, "   ");
    expect(submitButton).toBeDisabled();
    // await userEvent.click(submitButton); // click won't work on disabled button

    expect(onSubmitMock).not.toHaveBeenCalled();
  });

  it("disables submit button and textarea when isGenerating is true", () => {
    render(<TextInputForm onSubmit={onSubmitMock} isGenerating={true} />);

    const submitButton = screen.getByRole("button", { name: /generowanie/i });
    const textarea = screen.getByLabelText(/wklej tekst/i);

    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(textarea).toBeDisabled();
  });

  it("disables submit button when text is empty", () => {
    render(<TextInputForm onSubmit={onSubmitMock} isGenerating={false} />);
    expect(screen.getByRole("button", { name: /generuj fiszki/i })).toBeDisabled();
  });

  it("displays correct character count and changes style when limit is reached", async () => {
    render(<TextInputForm onSubmit={onSubmitMock} isGenerating={false} />);
    const textarea = screen.getByLabelText(/wklej tekst/i);
    const longText = "a".repeat(MAX_CHARS);

    // Use fireEvent.change for large input to avoid timeout
    fireEvent.change(textarea, { target: { value: longText } });

    const updatedCounter = screen.getByText(`${MAX_CHARS} / ${MAX_CHARS} znaków - Osiągnięto limit`);
    expect(updatedCounter).toBeInTheDocument();
    expect(updatedCounter).toHaveClass("text-red-600");
    expect(textarea).toHaveValue(longText);

    // Check if button is still enabled at the limit
    expect(screen.getByRole("button", { name: /generuj fiszki/i })).toBeEnabled();

    // Try typing one more character (should be prevented by maxLength)
    // Use userEvent here to simulate actual user attempt
    await userEvent.type(textarea, "b");
    expect(textarea).toHaveValue(longText); // Value should not change
    expect(screen.getByText(`${MAX_CHARS} / ${MAX_CHARS} znaków - Osiągnięto limit`)).toBeInTheDocument(); // Counter remains the same
  });

  it("prevents typing more characters than MAX_CHARS", async () => {
    render(<TextInputForm onSubmit={onSubmitMock} isGenerating={false} />);
    const textarea = screen.getByLabelText(/wklej tekst/i) as HTMLTextAreaElement;
    const longText = "a".repeat(MAX_CHARS);

    // Use fireEvent change because userEvent.type might handle maxLength differently
    // depending on the environment or version.
    // Setting value directly also works well for this specific case.
    fireEvent.change(textarea, { target: { value: longText } });

    expect(textarea.value).toHaveLength(MAX_CHARS);
    expect(textarea).toHaveAttribute("maxLength", String(MAX_CHARS));

    // Try adding one more character via fireEvent
    fireEvent.change(textarea, { target: { value: longText + "b" } });

    // Assert that the value didn't exceed MAX_CHARS (due to component logic or maxLength attribute)
    // Note: The exact behavior depends on browser/jsdom handling of maxLength.
    // We mainly test if the component *tries* to prevent it via state and maxLength.
    // The state logic should prevent update, and maxLength should prevent typing.
    expect(textarea.value).toHaveLength(MAX_CHARS);
    expect(textarea.value).toBe(longText); // Check that the last char wasn't added
  });
});
