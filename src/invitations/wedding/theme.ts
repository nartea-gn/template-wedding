import type {ThemeId} from '../../design/themes/themes.ts'

/**
 * The theme this invitation renders with, declared apart from the invitation itself.
 *
 * `vite.config.ts` needs it to inject the theme's webfonts at build time, and it runs in Node.
 * Importing `invitation.ts` for one string dragged the whole browser configuration into the Node
 * program, where `import.meta.env` does not exist: an invitation that reads the environment failed
 * the build with `Cannot read properties of undefined` and `tsc -b` with `Property 'env' does not
 * exist on type 'ImportMeta'`. Splitting the string is what keeps the invitation free to depend on
 * browser-only values without the build config caring.
 *
 * `satisfies` keeps the literal type while still refusing a theme that does not exist.
 */
export const weddingThemeId = 'royal' satisfies ThemeId
