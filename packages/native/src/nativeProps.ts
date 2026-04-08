// ---------------------------------------------------------------------------
// NativeFieldProps — maps FieldHandle props to React Native component props
// ---------------------------------------------------------------------------

type FieldHandle<T = unknown> = {
  value: T;
  error: string | null;
  touched: boolean;
  dirty: boolean;
  disabled: boolean;
  visible: boolean;
  validating: boolean;
  onChange: (value: T) => void;
  onBlur: () => void;
};

/** Props compatible with React Native TextInput */
export type NativeTextInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  editable: boolean;
};

/** Props compatible with React Native Switch */
export type NativeSwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled: boolean;
};

/** General native field props with the original field state */
export type NativeFieldProps<T> = {
  value: T;
  error: string | null;
  touched: boolean;
  dirty: boolean;
  disabled: boolean;
  visible: boolean;
  validating: boolean;
};

/**
 * Convert a string FieldHandle to React Native TextInput-compatible props.
 *
 * Usage:
 * ```tsx
 * const { fields } = useForm(schema);
 * <TextInput {...toTextInputProps(fields.name)} />
 * ```
 */
export function toTextInputProps(field: FieldHandle<string>): NativeTextInputProps & NativeFieldProps<string> {
  return {
    value: field.value,
    onChangeText: field.onChange,
    onBlur: field.onBlur,
    editable: !field.disabled,
    error: field.error,
    touched: field.touched,
    dirty: field.dirty,
    disabled: field.disabled,
    visible: field.visible,
    validating: field.validating,
  };
}

/**
 * Convert a boolean FieldHandle to React Native Switch-compatible props.
 *
 * Usage:
 * ```tsx
 * const { fields } = useForm(schema);
 * <Switch {...toSwitchProps(fields.agreed)} />
 * ```
 */
export function toSwitchProps(field: FieldHandle<boolean>): NativeSwitchProps & NativeFieldProps<boolean> {
  return {
    value: field.value,
    onValueChange: field.onChange,
    disabled: field.disabled,
    error: field.error,
    touched: field.touched,
    dirty: field.dirty,
    visible: field.visible,
    validating: field.validating,
  };
}

/**
 * Convert a number FieldHandle to TextInput props (number as string).
 *
 * Usage:
 * ```tsx
 * const { fields } = useForm(schema);
 * <TextInput keyboardType="numeric" {...toNumberInputProps(fields.age)} />
 * ```
 */
export type NativeNumberInputProps = Omit<NativeTextInputProps, "value"> &
  Omit<NativeFieldProps<number>, "value"> & {
    /** String representation of the number for TextInput */
    value: string;
    /** Original numeric value */
    numericValue: number;
  };

export function toNumberInputProps(field: FieldHandle<number>): NativeNumberInputProps {
  return {
    value: String(field.value),
    numericValue: field.value,
    onChangeText: (text: string) => {
      const num = Number(text);
      if (!Number.isNaN(num)) {
        field.onChange(num);
      }
    },
    onBlur: field.onBlur,
    editable: !field.disabled,
    error: field.error,
    touched: field.touched,
    dirty: field.dirty,
    disabled: field.disabled,
    visible: field.visible,
    validating: field.validating,
  };
}
