<p align="center">
  <img src="https://raw.githubusercontent.com/luisangel2895/haloform/main/assets/logo.svg" alt="haloform" width="320" />
</p>

<p align="center">
  <strong>React Native adapter for haloform — prop mappers for TextInput, Switch & more.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@haloform/core"><img src="https://img.shields.io/npm/v/@haloform/core?style=flat-square&color=6366f1&label=core" alt="npm core"></a>
  <a href="https://www.npmjs.com/package/@haloform/react"><img src="https://img.shields.io/npm/v/@haloform/react?style=flat-square&color=8b5cf6&label=react" alt="npm react"></a>
  <a href="https://www.npmjs.com/package/@haloform/native"><img src="https://img.shields.io/npm/v/@haloform/native?style=flat-square&color=a78bfa&label=native" alt="npm native"></a>
  <a href="https://github.com/luisangel2895/haloform/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license"></a>
  <img src="https://img.shields.io/badge/types-TypeScript-3178c6?style=flat-square" alt="TypeScript">
</p>

---

This is the **React Native** adapter for [haloform](https://github.com/luisangel2895/haloform). It re-exports `useForm` and `useMultiStepForm` from `@haloform/react` and adds prop mappers that convert field handles into React Native component props.

## Install

```bash
npm install @haloform/core @haloform/native
```

> `@haloform/native` includes `@haloform/react` as a dependency — you don't need to install it separately.

## Quick Start

```tsx
import { createForm, f } from "@haloform/core";
import { useForm, toTextInputProps, toSwitchProps } from "@haloform/native";
import { TextInput, Switch, View, Text, Button } from "react-native";

const schema = createForm({
  name: f.text({ required: true }),
  email: f.email({ required: true }),
  agreed: f.checkbox(),
});

function MyForm() {
  const { fields, handleSubmit } = useForm(schema);

  return (
    <View>
      <TextInput {...toTextInputProps(fields.name)} placeholder="Name" />
      {fields.name.error && <Text style={{ color: "red" }}>{fields.name.error}</Text>}

      <TextInput {...toTextInputProps(fields.email)} placeholder="Email" keyboardType="email-address" />
      {fields.email.error && <Text style={{ color: "red" }}>{fields.email.error}</Text>}

      <Switch {...toSwitchProps(fields.agreed)} />

      <Button title="Submit" onPress={handleSubmit((v) => console.log(v))} />
    </View>
  );
}
```

## Prop Mappers

### `toTextInputProps(field)`

Maps a string `FieldHandle` to React Native `TextInput` props.

```tsx
<TextInput {...toTextInputProps(fields.name)} placeholder="Name" />
```

| Mapped Prop | From |
|---|---|
| `value` | `field.value` |
| `onChangeText` | `field.onChange` |
| `onBlur` | `field.onBlur` |
| `editable` | `!field.disabled` |

Also passes through: `error`, `touched`, `dirty`, `disabled`, `visible`, `validating`.

### `toSwitchProps(field)`

Maps a boolean `FieldHandle` to React Native `Switch` props.

```tsx
<Switch {...toSwitchProps(fields.agreed)} />
```

| Mapped Prop | From |
|---|---|
| `value` | `field.value` |
| `onValueChange` | `field.onChange` |
| `disabled` | `field.disabled` |

### `toNumberInputProps(field)`

Maps a number `FieldHandle` to `TextInput` props with automatic number conversion.

```tsx
<TextInput keyboardType="numeric" {...toNumberInputProps(fields.age)} />
```

| Mapped Prop | From |
|---|---|
| `value` | `String(field.value)` |
| `numericValue` | `field.value` (original number) |
| `onChangeText` | Parses string to number, ignores NaN |
| `editable` | `!field.disabled` |

## Re-exported Hooks

This package re-exports everything from `@haloform/react`:

- `useForm(schema)` — Single-step form hook
- `useMultiStepForm(schema)` — Multi-step form hook with navigation

See the [`@haloform/react` docs](https://www.npmjs.com/package/@haloform/react) for the full hook API.

## Full Documentation

See the [full documentation and examples](https://github.com/luisangel2895/haloform) on GitHub.

## License

[MIT](https://github.com/luisangel2895/haloform/blob/main/LICENSE) — Made with care by [Angel Orellana](https://angel-orellana.com)
