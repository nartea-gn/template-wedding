import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { themes, type ThemeId } from "./src/design/themes/themes";
import { weddingInvitation } from "./src/invitations/wedding/invitation";

/**
 * Requests only the webfonts the deployed theme uses.
 *
 * Every theme declares its own families, so activating a theme can never leave the page asking
 * for someone else's fonts -- or silently rendering with the wrong ones.
 */
function themeFonts(): Plugin {
  return {
    name: "nartea-theme-fonts",
    transformIndexHtml(html) {
      const families: readonly string[] =
        themes[weddingInvitation.theme.id as ThemeId].googleFonts;
      const link =
        families.length === 0
          ? ""
          : `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${families.map((family) => `family=${family}`).join("&")}&display=swap"/>`;
      return html.replace("<!--theme-fonts-->", link);
    },
  };
}

/**
 * Emits `_headers`, the file Cloudflare Pages turns into response headers.
 *
 * The policy travels as a header rather than a `<meta>` because a meta tag cannot carry
 * `frame-ancestors`: browsers ignore that directive when it arrives in markup, so clickjacking
 * was the one thing the previous policy could not address. The Supabase origin is still a
 * build-time variable, which is why this is generated and not a static file in `public/`.
 *
 * Only Cloudflare's own server applies this file. `vite preview` ignores it, so the guard in
 * `e2e/csp.spec.ts` runs against `wrangler pages dev`.
 */
function contentSecurityPolicy(supabaseUrl: string): Plugin {
  return {
    name: "nartea-content-security-policy",
    apply: "build",
    generateBundle() {
      const supabaseOrigin = new URL(supabaseUrl).origin;
      const policy = [
        "default-src 'self'",
        "script-src 'self'",
        // No 'unsafe-inline'. The components that set CSS custom properties do it through
        // React's style prop, which writes via CSSOM -- `style-src` does not govern that,
        // only `<style>` elements and style attributes parsed from markup, and the build
        // emits neither. `e2e/csp.spec.ts` is what keeps this honest.
        "style-src 'self' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data:",
        "media-src 'self'",
        `connect-src 'self' ${supabaseOrigin}`,
        "form-action 'self'",
        "base-uri 'none'",
        "object-src 'none'",
        // The reason this file exists: unavailable to a meta tag.
        "frame-ancestors 'none'",
      ].join("; ");

      // Cloudflare already sends `X-Content-Type-Options` and `Referrer-Policy` by default.
      // They are declared anyway: a security contract should not rest on a platform default
      // nobody here controls, and the cost of stating it is one line each.
      const headers = [
        "/*",
        `  Content-Security-Policy: ${policy}`,
        "  Strict-Transport-Security: max-age=31536000; includeSubDomains",
        "  X-Content-Type-Options: nosniff",
        "  Referrer-Policy: strict-origin-when-cross-origin",
        "  Permissions-Policy: geolocation=(), camera=(), microphone=()",
        "",
        // Every file here carries a content hash in its name, so it can never go stale.
        "/assets/*",
        "  Cache-Control: public, max-age=31536000, immutable",
        "",
      ].join("\n");

      this.emitFile({ type: "asset", fileName: "_headers", source: headers });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ??
    loadEnv(mode, process.cwd(), "VITE_").VITE_SUPABASE_URL;
  // Only the build emits the policy, so only the build needs the origin. Demanding it from
  // `dev` and `preview` would fail them over a header they never serve.
  if (command === "build" && !supabaseUrl) {
    throw new Error(
      "VITE_SUPABASE_URL is required to build: the CSP has to name the API origin the app calls.",
    );
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      themeFonts(),
      ...(supabaseUrl ? [contentSecurityPolicy(supabaseUrl)] : []),
    ],
    // Cloudflare Pages sirve en la raíz del proyecto, no en un subpath del usuario.
    base: "/",
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 300,
      reportCompressedSize: true,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("node_modules")) {
              if (
                id.includes("react") ||
                id.includes("react-dom") ||
                id.includes("react-router")
              ) {
                return "vendor-react";
              }
              if (id.includes("@supabase")) {
                return "vendor-supabase";
              }
              return "vendor";
            }
            if (id.includes("src/themes")) {
              return "theme";
            }
          },
        },
      },
    },
  };
});
