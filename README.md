<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/logo-dark.svg" />
    <source media="(prefers-color-scheme: light)" srcset="./assets/logo.svg" />
    <img src="./assets/logo.svg" alt="haloform" width="320" />
  </picture>
</p>

<p align="center">
  <strong>Headless, schema-driven form engine for React & React Native.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@haloform/core"><img src="https://img.shields.io/npm/v/@haloform/core?style=flat-square&color=6366f1&label=core" alt="npm core"></a>
  <a href="https://www.npmjs.com/package/@haloform/react"><img src="https://img.shields.io/npm/v/@haloform/react?style=flat-square&color=8b5cf6&label=react" alt="npm react"></a>
  <a href="https://www.npmjs.com/package/@haloform/native"><img src="https://img.shields.io/npm/v/@haloform/native?style=flat-square&color=a78bfa&label=native" alt="npm native"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license"></a>
  <img src="https://img.shields.io/badge/types-TypeScript-3178c6?style=flat-square" alt="TypeScript">
  <img src="https://img.shields.io/badge/coverage->90%25-brightgreen?style=flat-square" alt="coverage">
</p>

<p align="center">
  One schema. Two platforms. Zero UI opinions.
</p>

<p align="center">
  <a href="#why-haloform">Why</a> ·
  <a href="#features">Features</a> ·
  <a href="#install">Install</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#api-reference">API</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#contributing">Contributing</a>
</p>

---

## Why haloform?

Most form libraries are tied to a specific platform or ship their own UI. Haloform takes a different approach:

- **Schema-first** — Define your form once, use it on web and mobile
- **Headless** — No UI components. You bring your own `<input>`, `<TextInput>`, or design system
- **Type-safe to the bone** — Full type inference from schema to field values. No generics to pass manually
- **Cross-platform** — Same core engine powers React DOM and React Native
- **Tiny** — Core is ~5KB gzipped, zero runtime dependencies

<br>

## Features

| | Feature | Description |
|---|---|---|
| :zap: | **Schema-driven** | Define fields with `f.text()`, `f.email()`, `f.select()`, etc. |
| :jigsaw: | **Headless** | Renders nothing. Works with any component library |
| :shield: | **Built-in validation** | Required, minLength, maxLength, min, max, email, pattern |
| :globe_with_meridians: | **Async validation** | Debounced with AbortController — stale requests auto-cancel |
| :link: | **Field dependencies** | `dependsOn` for conditional visibility, dynamic options, cascading values |
| :footprints: | **Multi-step forms** | `createMultiStepForm` with per-step validation and navigation |
| :arrows_counterclockwise: | **Cross-field validation** | Form-level `validate(values)` for password confirmation, etc. |
| :iphone: | **React Native ready** | `toTextInputProps()`, `toSwitchProps()` for instant RN integration |
| :crystal_ball: | **Full type inference** | Schema infers `{ email: string, age: number, agreed: boolean }` |
| :test_tube: | **138 tests** | Comprehensive coverage across core, React, and Native packages |

<br>

## Install

```bash
# Core + React (web)
npm install @haloform/core @haloform/react

# Core + React Native
npm install @haloform/core @haloform/native
```

<details>
<summary>pnpm / yarn / bun</summary>

```bash
# pnpm
pnpm add @haloform/core @haloform/react

# yarn
yarn add @haloform/core @haloform/react

# bun
bun add @haloform/core @haloform/react
```

</details>

<br>

## Quick Start

### Basic Form (React)

```tsx
import { createForm, f } from "@haloform/core";
import { useForm } from "@haloform/react";

const loginSchema = createForm({
  email: f.email({ required: true }),
  password: f.text({ required: true, minLength: 8 }),
  remember: f.checkbox({ default: false }),
});

function LoginForm() {
  const { fields, handleSubmit, errors } = useForm(loginSchema);

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
      {fields.password.error && <span>{fields.password.error}</span>}

      <label>
        <input
          type="checkbox"
          checked={fields.remember.value}
          onChange={(e) => fields.remember.onChange(e.target.checked)}
        />
        Remember me
      </label>

      <button type="submit">Sign in</button>
    </form>
  );
}
```

### Multi-Step Form

```tsx
import { createMultiStepForm, f } from "@haloform/core";
import { useMultiStepForm } from "@haloform/react";

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

function Checkout() {
  const {
    fields,
    currentStep,
    currentStepName,
    isLastStep,
    nextStep,
    prevStep,
    handleSubmit,
  } = useMultiStepForm(checkoutSchema);

  return (
    <div>
      <h2>{currentStepName}</h2>

      {currentStep === 0 && (
        <>
          <input value={fields.name.value} onChange={e => fields.name.onChange(e.target.value)} onBlur={fields.name.onBlur} />
          <input value={fields.address.value} onChange={e => fields.address.onChange(e.target.value)} onBlur={fields.address.onBlur} />
        </>
      )}

      {currentStep === 1 && (
        <>
          <input value={fields.card.value} onChange={e => fields.card.onChange(e.target.value)} onBlur={fields.card.onBlur} />
          <input value={fields.cvv.value} onChange={e => fields.cvv.onChange(e.target.value)} onBlur={fields.cvv.onBlur} />
        </>
      )}

      <button onClick={prevStep}>Back</button>
      {isLastStep
        ? <button onClick={handleSubmit((v) => console.log(v))}>Submit</button>
        : <button onClick={nextStep}>Next</button>
      }
    </div>
  );
}
```

### React Native

```tsx
import { createForm, f } from "@haloform/core";
import { useForm, toTextInputProps, toSwitchProps } from "@haloform/native";
import { TextInput, Switch, View, Text } from "react-native";

const schema = createForm({
  name: f.text({ required: true }),
  agreed: f.checkbox(),
});

function MyForm() {
  const { fields, handleSubmit } = useForm(schema);

  return (
    <View>
      <TextInput {...toTextInputProps(fields.name)} placeholder="Name" />
      {fields.name.error && <Text>{fields.name.error}</Text>}

      <Switch {...toSwitchProps(fields.agreed)} />

      <Button title="Submit" onPress={handleSubmit((v) => console.log(v))} />
    </View>
  );
}
```

### Async Validation

```tsx
const signupSchema = createForm({
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

### Field Dependencies

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

<br>

## API Reference

### Field Builders (`f.*`)

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

### `useForm(schema)` Returns

| Property | Type | Description |
|---|---|---|
| `fields` | `Record<name, FieldHandle>` | Per-field state + `onChange` / `onBlur` |
| `handleSubmit(fn)` | `(e?) => Promise<void>` | Validates all, then calls `fn(values)` |
| `isValid` | `boolean` | `true` when no field has errors |
| `isSubmitting` | `boolean` | `true` while submit handler is running |
| `errors` | `Record<name, string>` | Current errors (only fields with errors) |
| `reset()` | `void` | Reset all fields to defaults |
| `setValue(name, value)` | `void` | Programmatically set a field |
| `getValues()` | `InferFormValues<S>` | Get all current values |

### `useMultiStepForm(schema)` Returns

Everything from `useForm` plus:

| Property | Type | Description |
|---|---|---|
| `currentStep` | `number` | Current step index (0-based) |
| `currentStepName` | `string` | Name of the current step |
| `totalSteps` | `number` | Total number of steps |
| `isFirstStep` / `isLastStep` | `boolean` | Position flags |
| `nextStep()` | `Promise<boolean>` | Validate current step, advance if valid |
| `prevStep()` | `void` | Go back (no validation) |
| `goToStep(i)` | `void` | Jump to step `i` |

### Native Prop Mappers

| Function | Maps To |
|---|---|
| `toTextInputProps(field)` | `value`, `onChangeText`, `onBlur`, `editable` |
| `toSwitchProps(field)` | `value`, `onValueChange`, `disabled` |
| `toNumberInputProps(field)` | `value` (string), `onChangeText` (parses number), `editable` |

<br>

## Architecture

```
@haloform/core          Pure TypeScript, zero deps
├── schema.ts           Field builders (f.*) + createForm
├── types.ts            Full type system with inference
├── store.ts            Subscribable state management
├── validation.ts       Sync/async + debounce + abort
├── dependencies.ts     Inter-field dependency resolution
└── multistep.ts        Multi-step navigation + per-step validation

@haloform/react         React adapter (~5KB)
├── useForm.ts          useSyncExternalStore over core store
└── useMultiStepForm.ts Multi-step hook with step state

@haloform/native        React Native adapter
├── useForm.ts          Re-exports from @haloform/react
├── useMultiStepForm.ts Re-exports from @haloform/react
└── nativeProps.ts      TextInput/Switch prop mappers
```

<br>

## Comparison

| | haloform | react-hook-form | formik |
|---|---|---|---|
| Headless | Yes | Yes | No (includes `<Form>`) |
| Schema-driven | Yes (first-class) | Via resolvers | Via Yup/Zod |
| React Native | Built-in adapter | Manual | Manual |
| Multi-step | Built-in | Manual | Manual |
| Field dependencies | Built-in | Manual | Manual |
| Async validation | Debounce + abort | Manual abort | No abort |
| Bundle size | ~5KB core | ~9KB | ~13KB |
| Type inference from schema | Full | Partial | No |
| Zero dependencies | Yes (core) | Yes | No (3 deps) |

<br>

## Development

```bash
# Install
pnpm install

# Test (138 tests)
pnpm test

# Build all packages
pnpm build

# Run example app
cd examples/web && pnpm install && pnpm dev
```

<br>

## Contributing

Contributions are welcome! Whether it's a bug report, feature request, or pull request — all input is appreciated.

1. Fork the repository
2. Create your branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

Please make sure all tests pass (`pnpm test`) and the build succeeds (`pnpm build`) before submitting.

<br>

## License

[MIT](./LICENSE) — Made with care by [Angel Orellana](https://angel-orellana.com)
