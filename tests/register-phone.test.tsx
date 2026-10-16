// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({ auth: { signUp: mocks.signUp } }),
}));

import { RegisterForm } from "@/components/auth/register-form";

describe("RegisterForm phone number", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signUp.mockResolvedValue({ data: { user: null, session: null }, error: null });
  });

  it("submits the selected country calling code with the national phone number", async () => {
    render(<RegisterForm />);

    fireEvent.change(document.getElementById("displayName")!, {
      target: { value: "Koffi Atta" },
    });
    fireEvent.change(document.getElementById("email")!, {
      target: { value: "koffi@example.ci" },
    });
    fireEvent.change(document.getElementById("phone")!, {
      target: { value: "07 00 00 00 00" },
    });
    fireEvent.change(document.getElementById("password")!, {
      target: { value: "evenement2026" },
    });
    fireEvent.change(document.getElementById("confirmPassword")!, {
      target: { value: "evenement2026" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));

    await waitFor(() => expect(mocks.signUp).toHaveBeenCalledOnce());
    expect(mocks.signUp.mock.calls[0]?.[0]?.options.data.phone).toBe("+2250700000000");
  });
});
