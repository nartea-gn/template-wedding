import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { LocalizationProvider } from "../../app/providers/LocalizationProvider";
import { esMessages, type WeddingLocale } from "../../invitations/wedding";
import { LoginForm } from "./LoginForm";

function renderWithLocalization(component: ReactNode) {
  return render(
    <LocalizationProvider<WeddingLocale>
      invitationId="admin-login-test"
      definition={{
        defaultLocale: "es",
        supportedLocales: ["es"],
        selector: { visible: false },
      }}
      defaultCatalog={esMessages}
      loaders={{}}
      timeZone="Europe/Madrid"
    >
      {component}
    </LocalizationProvider>,
  );
}

describe("LoginForm", () => {
  it("requests an OTP from the authorized email", async () => {
    const user = userEvent.setup();
    const onRequestCode = vi.fn().mockResolvedValue(true);

    renderWithLocalization(
      <LoginForm
        title="Panel de invitados"
        method="otp"
        phase="email"
        requestedEmail=""
        error={null}
        submitting={false}
        onRequestCode={onRequestCode}
        onVerifyCode={vi.fn().mockResolvedValue(true)}
        onChangeEmail={vi.fn()}
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: "Correo electrónico" }),
      "Admin@Example.com",
    );
    await user.click(screen.getByRole("button", { name: "Enviar código" }));

    expect(onRequestCode).toHaveBeenCalledWith("Admin@Example.com");
    expect(screen.queryByLabelText("Contraseña")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mostrar contraseña" }),
    ).not.toBeInTheDocument();
  });

  it("authenticates the password variant without exposing the OTP controls", async () => {
    const user = userEvent.setup();
    const onAuthenticate = vi.fn().mockResolvedValue(true);

    renderWithLocalization(
      <LoginForm
        title="Panel de invitados"
        method="password"
        error={null}
        submitting={false}
        onAuthenticate={onAuthenticate}
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: "Correo electrónico" }),
      "admin@example.com",
    );
    const passwordInput = screen.getByLabelText("Contraseña");
    const showPasswordButton = screen.getByRole("button", {
      name: "Mostrar contraseña",
    });

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(showPasswordButton).toHaveAttribute("aria-pressed", "false");

    await user.type(passwordInput, "private-password");
    await user.click(showPasswordButton);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Ocultar contraseña" }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(
      screen.getByRole("button", { name: "Ocultar contraseña" }),
    );

    expect(passwordInput).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Entrar al panel" }));

    expect(onAuthenticate).toHaveBeenCalledWith(
      "admin@example.com",
      "private-password",
    );
    expect(
      screen.queryByText("Código de seis dígitos"),
    ).not.toBeInTheDocument();
  });

  it("announces a generic credentials error", () => {
    renderWithLocalization(
      <LoginForm
        title="Panel de invitados"
        method="password"
        error="credentials"
        submitting={false}
        onAuthenticate={vi.fn().mockResolvedValue(false)}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No hemos podido iniciar sesión. Revisa los datos e inténtalo de nuevo.",
    );
  });
});
