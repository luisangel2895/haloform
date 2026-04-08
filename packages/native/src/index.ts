// Re-export hooks from @haloform/react (React Native uses React)
export { useForm, useMultiStepForm } from "@haloform/react";
export type { FieldHandle, UseFormReturn, UseMultiStepFormReturn } from "@haloform/react";

// Native-specific prop mappers
export {
  toTextInputProps,
  toSwitchProps,
  toNumberInputProps,
} from "./nativeProps.js";
export type {
  NativeTextInputProps,
  NativeSwitchProps,
  NativeFieldProps,
  NativeNumberInputProps,
} from "./nativeProps.js";
