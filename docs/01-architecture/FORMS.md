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
