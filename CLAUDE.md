# Claude Repository Instructions

## V8 UI Component Baseline

Before creating or modifying any V8 frontend visual component, read:

`docs/V8_COMPONENT_CONTROL_BASELINE.md`

Treat that document as the authoritative V8 component-control specification.

Do not create a separate interpretation or duplicated baseline.

For every new independently positioned V8 component:

- expose the baseline visual controls;
- expose text controls when applicable;
- use the existing shared visibility control;
- do not add per-component Visible controls;
- do not add Safe Area / Guide systems unless explicitly requested.

Do not modify V7 unless explicitly instructed.
