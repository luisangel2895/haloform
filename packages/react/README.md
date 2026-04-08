<p align="center">
  <img src="https://raw.githubusercontent.com/luisangel2895/haloform/main/assets/logo.svg" alt="haloform" width="320" />
</p>

<p align="center">
  <strong>React hooks for haloform — the headless, schema-driven form engine.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@haloform/core"><img src="https://img.shields.io/npm/v/@haloform/core?style=flat-square&color=6366f1&label=core" alt="npm core"></a>
  <a href="https://www.npmjs.com/package/@haloform/react"><img src="https://img.shields.io/npm/v/@haloform/react?style=flat-square&color=8b5cf6&label=react" alt="npm react"></a>
  <a href="https://www.npmjs.com/package/@haloform/native"><img src="https://img.shields.io/npm/v/@haloform/native?style=flat-square&color=a78bfa&label=native" alt="npm native"></a>
  <a href="https://github.com/luisangel2895/haloform/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license"></a>
  <img src="https://img.shields.io/badge/types-TypeScript-3178c6?style=flat-square" alt="TypeScript">
</p>

---

This is the **React** adapter for [haloform](https://github.com/luisangel2895/haloform). It provides `useForm` and `useMultiStepForm` hooks powered by `useSyncExternalStore` over the core store.

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

## `useForm(schema)` Returns

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

## Multi-Step Forms

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

## `useMultiStepForm(schema)` Returns

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

## Full Documentation

See the [full documentation and examples](https://github.com/luisangel2895/haloform) on GitHub.

## License

[MIT](https://github.com/luisangel2895/haloform/blob/main/LICENSE) — Made with care by [Angel Orellana](https://angel-orellana.com)
