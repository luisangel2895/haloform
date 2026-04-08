// ---------------------------------------------------------------------------
// Field value types — maps each field kind to its TypeScript value type
// ---------------------------------------------------------------------------

export type FieldKind =
  | "text"
  | "email"
  | "number"
  | "checkbox"
  | "select"
  | "radio"
  | "textarea"
  | "date";

export type FieldValueMap = {
  text: string;
  email: string;
  number: number;
  checkbox: boolean;
  select: string;
  radio: string;
  textarea: string;
  date: string;
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type ValidationResult = true | string;
export type SyncValidator<T> = (value: T) => ValidationResult;
export type AsyncValidator<T> = (
  value: T,
  signal: AbortSignal,
) => Promise<ValidationResult>;
export type Validator<T> = SyncValidator<T> | AsyncValidator<T>;

// ---------------------------------------------------------------------------
// DependsOn — how a field reacts to another field's value
// ---------------------------------------------------------------------------

export type DependencyEffect<T> = {
  visible?: boolean;
  options?: T extends string ? readonly string[] : never;
  value?: T;
};

export type DependsOnConfig = Record<
  string,
  (value: never) => DependencyEffect<unknown>
>;

// ---------------------------------------------------------------------------
// Field configuration — what the developer passes to f.text(), f.select(), etc.
// ---------------------------------------------------------------------------

type BaseFieldConfig<T> = {
  required?: boolean;
  default?: T;
  validate?: Validator<T>;
  dependsOn?: DependsOnConfig;
};

export type TextFieldConfig = BaseFieldConfig<string> & {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
};

export type EmailFieldConfig = BaseFieldConfig<string>;

export type NumberFieldConfig = BaseFieldConfig<number> & {
  min?: number;
  max?: number;
};

export type CheckboxFieldConfig = BaseFieldConfig<boolean>;

export type SelectFieldConfig<O extends readonly string[] = readonly string[]> =
  BaseFieldConfig<O[number]> & {
    options: O;
  };

export type RadioFieldConfig<O extends readonly string[] = readonly string[]> =
  BaseFieldConfig<O[number]> & {
    options: O;
  };

export type TextareaFieldConfig = BaseFieldConfig<string> & {
  minLength?: number;
  maxLength?: number;
};

export type DateFieldConfig = BaseFieldConfig<string>;

// ---------------------------------------------------------------------------
// FieldDef — internal representation of a defined field (builder output)
// ---------------------------------------------------------------------------

export type FieldDef<K extends FieldKind = FieldKind, T = unknown> = {
  kind: K;
  config: BaseFieldConfig<T> & Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Schema definition — Record of field names to FieldDefs
// ---------------------------------------------------------------------------

export type FormSchemaDefinition = Record<string, FieldDef>;

// ---------------------------------------------------------------------------
// Type inference — extract value types from a schema definition
// ---------------------------------------------------------------------------

type InferFieldValue<F> = F extends FieldDef<"text", infer _>
  ? string
  : F extends FieldDef<"email", infer _>
    ? string
    : F extends FieldDef<"number", infer _>
      ? number
      : F extends FieldDef<"checkbox", infer _>
        ? boolean
        : F extends FieldDef<"select", infer _>
          ? string
          : F extends FieldDef<"radio", infer _>
            ? string
            : F extends FieldDef<"textarea", infer _>
              ? string
              : F extends FieldDef<"date", infer _>
                ? string
                : unknown;

export type InferFormValues<S extends FormSchemaDefinition> = {
  [K in keyof S]: InferFieldValue<S[K]>;
};

// ---------------------------------------------------------------------------
// FormSchema — the object returned by createForm()
// ---------------------------------------------------------------------------

export type CrossFieldValidator<S extends FormSchemaDefinition> = (
  values: InferFormValues<S>,
) => Record<string, string> | undefined;

export type FormConfig<S extends FormSchemaDefinition> = {
  validate?: CrossFieldValidator<S>;
  validateDebounceMs?: number;
};

export type FormSchema<S extends FormSchemaDefinition = FormSchemaDefinition> = {
  fields: S;
  config: FormConfig<S>;
};

// ---------------------------------------------------------------------------
// Field state — runtime state of a single field
// ---------------------------------------------------------------------------

export type FieldState<T = unknown> = {
  value: T;
  error: string | null;
  touched: boolean;
  dirty: boolean;
  disabled: boolean;
  visible: boolean;
  validating: boolean;
};

// ---------------------------------------------------------------------------
// Form state — runtime state of the entire form
// ---------------------------------------------------------------------------

export type FormState<S extends FormSchemaDefinition = FormSchemaDefinition> = {
  fields: { [K in keyof S]: FieldState<InferFieldValue<S[K]>> };
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
};
