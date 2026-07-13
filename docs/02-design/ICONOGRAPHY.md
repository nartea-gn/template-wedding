# Iconography

## Current strategy

Sprint 6.1 replaces platform-dependent emoji with a small owned SVG set in `InterfaceIcon`. The interface set follows
the proportions and outlined language of the open-licensed [Lucide Line Icons collection on SVG Repo](https://www.svgrepo.com/collection/lucide-line-icons/).
Icons are decorative by default (`aria-hidden`) and visible labels continue carrying meaning. Unknown icon IDs render
nothing rather than breaking a configured form.

## Rules

- Do not use emoji as interface controls, status indicators or form-option decoration.
- Do not duplicate standalone SVG markup inside feature components; extend the shared primitive when reuse is real.
- Never rely on color or an icon alone to communicate attendance, errors or actions.
- Text exports may use stable textual marks where they are data decoration rather than interactive iconography.
- A third-party icon dependency requires repeated demand that the owned set cannot satisfy.
- New icons must come from the same outlined family whenever possible; SVG Repo is the discovery reference and each
  asset's license must be checked before its geometry is incorporated.

## Theme Engine v2 boundary

The current primitive owns geometry and accessibility only. Sprint 6.4 may let themes vary stroke, weight or treatment,
but icon choices must not control capabilities, content, validation or business rules.
