import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { RedeemDialog } from "../../../src/licensing/ui/RedeemDialog";

function renderWithTheme(ui: React.ReactElement) {
  return render(<FluentProvider theme={webLightTheme}>{ui}</FluentProvider>);
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify({ token: "mock.jwt.token" }), {
          status: 200,
        }),
    ),
  );
});

describe("RedeemDialog", () => {
  it("calls onSuccess with the returned token on 200", async () => {
    const onSuccess = vi.fn();
    renderWithTheme(<RedeemDialog open onClose={() => {}} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText(/license code/i), {
      target: { value: "FC-0000-0000-0001" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "a@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /activate/i }));
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith("mock.jwt.token");
    });
  });

  it("shows a format error when the code is malformed", async () => {
    renderWithTheme(<RedeemDialog open onClose={() => {}} onSuccess={() => {}} />);
    fireEvent.change(screen.getByLabelText(/license code/i), {
      target: { value: "not-a-code" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "a@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /activate/i }));
    await waitFor(() => {
      expect(screen.getByText(/invalid code format/i)).toBeInTheDocument();
    });
  });

  it("shows a helpful error when the server returns 409", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: "email mismatch" }), {
            status: 409,
          }),
      ),
    );
    renderWithTheme(<RedeemDialog open onClose={() => {}} onSuccess={() => {}} />);
    fireEvent.change(screen.getByLabelText(/license code/i), {
      target: { value: "FC-0000-0000-0001" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "a@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /activate/i }));
    await waitFor(() => {
      expect(screen.getByText(/redeemed by a different email/i)).toBeInTheDocument();
    });
  });
});
