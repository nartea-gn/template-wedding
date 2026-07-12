# ADR-010: Configuration-driven Form Engine

- Status: Accepted
- Date: 2026-07-12

## Context

Different events require different questions, steps and optional RSVP flows without changing Core components.

## Decision

Use a typed, versioned and localized `FormDefinition`. Core owns data contracts and validation; the React feature owns
rendering; invitations own field configuration.

## Consequences

Forms can evolve without wedding-specific Core code. Stable field IDs and explicit versions become part of the persisted
data contract. Complex branching, schema builders and visual editors remain outside v1.
