import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Modal lives in ui.tsx alongside DashboardLayout, which transitively pulls in
// the Sidebar/CommandPalette (and next-intl navigation). Those are irrelevant
// to the Modal, so stub them to keep this a focused unit test.
vi.mock("@/components/Sidebar", () => ({ Sidebar: () => null }));
vi.mock("@/components/CommandPalette", () => ({ CommandPalette: () => null }));
vi.mock("@/hooks/useExport", () => ({ useExport: () => ({ exportCsv: () => {} }) }));

import { Modal } from "./ui";

describe("Modal accessibility", () => {
  it("does not render when closed", () => {
    render(<Modal open={false} onClose={() => {}} title="Hidden">body</Modal>);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders as an accessible dialog with a labelled title", () => {
    render(<Modal open onClose={() => {}} title="My Dialog">body</Modal>);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("My Dialog")).toBeInTheDocument();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Esc test">body</Modal>);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("has an accessible close button", () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Close test">body</Modal>);
    fireEvent.click(screen.getByLabelText("Close dialog"));
    expect(onClose).toHaveBeenCalled();
  });
});
