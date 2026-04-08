<p align="center">
  <img src="https://raw.githubusercontent.com/luisangel2895/haloform/main/assets/logo.svg" alt="haloform" width="320" />
</p>

<p align="center">
  <strong>Headless, schema-driven form engine for React & React Native.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@haloform/core"><img src="https://img.shields.io/npm/v/@haloform/core?style=flat-square&color=6366f1&label=core" alt="npm core"></a>
  <a href="https://www.npmjs.com/package/@haloform/react"><img src="https://img.shields.io/npm/v/@haloform/react?style=flat-square&color=8b5cf6&label=react" alt="npm react"></a>
  <a href="https://www.npmjs.com/package/@haloform/native"><img src="https://img.shields.io/npm/v/@haloform/native?style=flat-square&color=a78bfa&label=native" alt="npm native"></a>
  <a href="https://github.com/luisangel2895/haloform/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license"></a>
  <img src="https://img.shields.io/badge/types-TypeScript-3178c6?style=flat-square" alt="TypeScript">
</p>

<p align="center">
  One schema. Two platforms. Zero UI opinions.
</p>

---

This is the **core** package of haloform. It contains the schema builders, store, validation engine, dependency resolution, and multi-step form logic — all in pure TypeScript with zero runtime dependencies.

For React hooks, install [`@haloform/react`](https://www.npmjs.com/package/@haloform/react).
For React Native prop mappers, install [`@haloform/native`](https://www.npmjs.com/package/@haloform/native).

## Install

```bash
npm install @haloform/core @haloform/react
```

## Quick Start

```tsx
import { createForm, f } from "@haloform/core";
import { useForm } from "@haloform/react";

const loginSchema = createForm({
  email: f.email({ required: true }),
  password: f.text({ required: true, minLength: 8 }),
  remember: f.checkbox({ default: false }),
});

function LoginForm() {
  const { fields, handleSubmit } = useForm(loginSchema);

  return (
    <form onSubmit={handleSubmit((values) => console.log(values))}>
      <input
        value={fields.email.value}
        onChange={(e) => fields.email.onChange(e.target.value)}
        onBlur={fields.email.onBlur}
      />
      {fields.email.error && <span>{fields.email.error}</span>}

      <input
        type="password"
        value={fields.password.value}
        onChange={(e) => fields.password.onChange(e.target.value)}
        onBlur={fields.password.onBlur}
      />

      <button type="submit">Sign in</button>
    </form>
  );
}
```

## Field Builders (`f.*`)

| Builder | Value Type | Extra Config |
|---|---|---|
| `f.text()` | `string` | `minLength`, `maxLength`, `pattern` |
| `f.email()` | `string` | Built-in email format validation |
| `f.number()` | `number` | `min`, `max` |
| `f.checkbox()` | `boolean` | — |
| `f.select()` | `string` | `options` (required) |
| `f.radio()` | `string` | `options` (required) |
| `f.textarea()` | `string` | `minLength`, `maxLength` |
| `f.date()` | `string` | — |

All builders accept: `required`, `default`, `validate`, `dependsOn`.

## Features

| Feature | Description |
|---|---|
| **Schema-driven** | Define fields with `f.text()`, `f.email()`, `f.select()`, etc. |
| **Built-in validation** | Required, minLength, maxLength, min, max, email, pattern |
| **Async validation** | Debounced with AbortController — stale requests auto-cancel |
| **Field dependencies** | `dependsOn` for conditional visibility, dynamic options, cascading values |
| **Multi-step forms** | `createMultiStepForm` with per-step validation and navigation |
| **Cross-field validation** | Form-level `validate(values)` for password confirmation, etc. |
| **Full type inference** | Schema infers `{ email: string, age: number, agreed: boolean }` |
| **Zero dependencies** | Pure TypeScript, ~5KB gzipped |

## Async Validation

```tsx
const schema = createForm({
  username: f.text({
    required: true,
    validate: async (value, signal) => {
      const res = await fetch(`/api/check-username?u=${value}`, { signal });
      const { available } = await res.json();
      return available ? true : "Username is taken";
    },
  }),
});
```

The async validator receives an `AbortSignal` — if the user types again before the previous check completes, it's automatically cancelled.

## Field Dependencies

```tsx
const schema = createForm({
  country: f.select({ options: ["US", "PE", "PT"], required: true }),
  state: f.select({
    options: [],
    dependsOn: {
      country: (value) => ({
        visible: value === "US",
        options: value === "US" ? ["CA", "NY", "TX"] : [],
      }),
    },
  }),
});
```

## Multi-Step Forms

```tsx
import { createMultiStepForm, f } from "@haloform/core";

const checkoutSchema = createMultiStepForm([
  {
    name: "Shipping",
    fields: {
      name: f.text({ required: true }),
      address: f.text({ required: true }),
    },
  },
  {
    name: "Payment",
    fields: {
      card: f.text({ required: true, pattern: /^\d{16}$/ }),
      cvv: f.text({ required: true, minLength: 3 }),
    },
  },
]);
```

## Architecture

```
@haloform/core          Pure TypeScript, zero deps
├── schema.ts           Field builders (f.*) + createForm
├── types.ts            Full type system with inference
├── store.ts            Subscribable state management
├── validation.ts       Sync/async + debounce + abort
├── dependencies.ts     Inter-field dependency resolution
└── multistep.ts        Multi-step navigation + per-step validation
```

## Full Documentation

See the [full documentation and examples](https://github.com/luisangel2895/haloform) on GitHub.

## License

[MIT](https://github.com/luisangel2895/haloform/blob/main/LICENSE) — Made with care by [Angel Orellana](https://angel-orellana.com)
