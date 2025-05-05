# Plan: Responsive Card Layout for Flashcard Suggestions (Mobile)

**Goal:** Adapt the flashcard suggestions list (`SuggestionsList.tsx` and `SuggestionItem.tsx`) to display as individual cards on mobile screens (below `md` breakpoint) while retaining the existing table layout on larger screens (desktop).

**Tech Stack Considerations:**

*   **Astro/React:** Utilize React functional components (`SuggestionItem`, `SuggestionsList`) within the Astro project.
*   **Tailwind CSS:** Leverage responsive utility classes (e.g., `md:`, `flex`, `grid`) to conditionally apply styles for mobile and desktop views.
*   **Shadcn/ui:** Use the `Card` component from `@/components/ui/card` for the mobile view structure.

**High-Level Steps:**

1.  **Adapt `SuggestionsList.tsx`:**
    *   Modify the root element to be a `div` instead of `Table`. Apply Tailwind classes to make it function visually as a `table` only on `md:` screens and larger (`md:table md:w-full`).
    *   Conditionally render `TableHeader` using responsive classes (`hidden md:table-header-group`).
    *   Modify `TableBody` similarly (`md:table-row-group`).

2.  **Refactor `SuggestionItem.tsx`:**
    *   Change the root `TableRow` element to a `div`.
    *   **Mobile View (Default - below `md`):**
        *   Wrap the item content within a Shadcn `Card` component.
        *   Structure the content (Polish, Spanish, Example) inside the `Card` using `CardHeader`, `CardContent`, etc., or simple `div`s with appropriate Tailwind classes for vertical flow or a compact layout.
        *   Place the action buttons (`Accept`/`Reject`) within the `CardFooter` or a dedicated `div` at the bottom of the card, potentially styled for better touch targets (e.g., full-width or clear separation). Use flexbox/grid for layout.
    *   **Desktop View (`md:` screens and up):**
        *   Apply `md:table-row` to the root `div`.
        *   Change `TableCell` elements to `div`s and apply `md:table-cell` classes to them, ensuring they maintain their original column structure and alignment within the desktop table layout.
        *   Ensure action buttons revert to their original inline layout within the last "cell" (`md:table-cell`).

3.  **Styling & Refinement:**
    *   Apply necessary Tailwind padding, margins, and layout classes (`flex`, `grid`, `gap`) to ensure readability and usability in both card (mobile) and table-cell (desktop) contexts.
    *   Verify alignment, spacing, and text wrapping across different screen sizes.
    *   Ensure interactive states (hover, focus) and status badges (`SuggestionStatus`) are displayed correctly in both layouts.

**Constraint:** No changes should affect the visual appearance or functionality on screens `md` width and larger (desktop view must remain a table). 