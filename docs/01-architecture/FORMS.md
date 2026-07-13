# Form Engine

The Form Engine is a reusable Core capability and contains no wedding or Supabase knowledge.

An invitation defines a versioned `FormDefinition`: ordered steps, fields, translated message keys, validation,
visibility conditions and submission metadata. React renders that contract in `features/forms`; event packages only
provide configuration.

Supported v1 elements are text, email, number, date, textarea, radio, select, checkbox group and informational content.
Conditional visibility compares one earlier answer with a primitive value. An option may complete the form early, which
supports declining an invitation without wedding-specific branching in the renderer.

Field IDs are persistent data identifiers. Renaming a label is safe; changing an ID requires a new form version and a
data migration strategy. The engine emits `FormAnswers` and never persists data or imports an infrastructure provider.

## Accessible presentation contract

- Choice groups render as `fieldset` and `legend`; radios share a stable field name.
- Help and validation messages have stable IDs referenced through `aria-describedby`.
- Invalid controls expose `aria-invalid`, and validation moves focus to the first invalid control.
- Step changes move focus to the new heading without stealing focus on the initial render.
- Submission failure is a localized form message announced through an alert; provider details are not exposed publicly.
- The form exposes busy and progress state while persistence remains owned by the RSVP application layer.

Presentation hints such as optional icon IDs do not change validation or stored answers. Unknown hints render no icon,
keeping the form functional and provider-independent.
