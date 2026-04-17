import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { LicenseProvider, useLicense } from "../../src/licensing/context";
import { setStoredToken, clearStoredToken } from "../../src/licensing/storage";
import { generateKeyPair, exportPKCS8, exportSPKI, SignJWT, importPKCS8 } from "jose";

async function makeValidToken(publicPem: string, privatePem: string) {
  const privateKey = await importPKCS8(privatePem, "EdDSA");
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({
    email: "u@example.com",
    role: "paying",
    features: ["fair-copy"],
  })
    .setProtectedHeader({ alg: "EdDSA", typ: "JWT" })
    .setIssuer("fair-copy.blackletter.studio")
    .setSubject("lic_ctx")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .setJti("tok_x")
    .sign(privateKey);
}

function Consumer() {
  const { licensed, role, email } = useLicense();
  return (
    <div>
      <span data-testid="licensed">{licensed ? "yes" : "no"}</span>
      <span data-testid="role">{role ?? "none"}</span>
      <span data-testid="email">{email ?? "none"}</span>
    </div>
  );
}

describe("LicenseProvider", () => {
  let publicPem: string;
  let privatePem: string;

  beforeEach(async () => {
    clearStoredToken();
    const kp = await generateKeyPair("EdDSA", {
      crv: "Ed25519",
      extractable: true,
    });
    publicPem = await exportSPKI(kp.publicKey);
    privatePem = await exportPKCS8(kp.privateKey);
  });

  it("starts unlicensed when no token is stored", async () => {
    render(
      <LicenseProvider publicKeyPem={publicPem}>
        <Consumer />
      </LicenseProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("licensed").textContent).toBe("no");
    });
  });

  it("becomes licensed when a valid token is present", async () => {
    const token = await makeValidToken(publicPem, privatePem);
    setStoredToken(token);
    render(
      <LicenseProvider publicKeyPem={publicPem}>
        <Consumer />
      </LicenseProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("licensed").textContent).toBe("yes");
    });
    expect(screen.getByTestId("role").textContent).toBe("paying");
    expect(screen.getByTestId("email").textContent).toBe("u@example.com");
  });

  it("refresh() re-reads storage and updates state", async () => {
    let refresh: () => void = () => {};
    function Harness() {
      const ctx = useLicense();
      refresh = ctx.refresh;
      return <Consumer />;
    }
    render(
      <LicenseProvider publicKeyPem={publicPem}>
        <Harness />
      </LicenseProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("licensed").textContent).toBe("no");
    });
    const token = await makeValidToken(publicPem, privatePem);
    setStoredToken(token);
    await act(async () => {
      refresh();
    });
    await waitFor(() => {
      expect(screen.getByTestId("licensed").textContent).toBe("yes");
    });
  });
});
