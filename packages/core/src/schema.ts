import type {
  TextFieldConfig,
  EmailFieldConfig,
  NumberFieldConfig,
  CheckboxFieldConfig,
  SelectFieldConfig,
  RadioFieldConfig,
  TextareaFieldConfig,
  DateFieldConfig,
  FieldDef,
  FormSchemaDefinition,
  FormSchema,
  FormConfig,
} from "./types.js";

// ---------------------------------------------------------------------------
// Field builders — the `f` namespace
// ---------------------------------------------------------------------------

function text(config: TextFieldConfig = {}): FieldDef<"text", string> {
  return { kind: "text", config };
}

function email(config: EmailFieldConfig = {}): FieldDef<"email", string> {
  return { kind: "email", config };
}

function number(config: NumberFieldConfig = {}): FieldDef<"number", number> {
  return { kind: "number", config };
}

function checkbox(
  config: CheckboxFieldConfig = {},
): FieldDef<"checkbox", boolean> {
  return { kind: "checkbox", config };
}

function select<const O extends readonly string[]>(
  config: SelectFieldConfig<O>,
): FieldDef<"select", O[number]> {
  return { kind: "select", config: config as SelectFieldConfig };
}

function radio<const O extends readonly string[]>(
  config: RadioFieldConfig<O>,
): FieldDef<"radio", O[number]> {
  return { kind: "radio", config: config as RadioFieldConfig };
}

function textarea(
  config: TextareaFieldConfig = {},
): FieldDef<"textarea", string> {
  return { kind: "textarea", config };
}

function date(config: DateFieldConfig = {}): FieldDef<"date", string> {
  return { kind: "date", config };
}

export const f = {
  text,
  email,
  number,
  checkbox,
  select,
  radio,
  textarea,
  date,
} as const;

// ---------------------------------------------------------------------------
// createForm — takes a field definition record and returns a FormSchema
// ---------------------------------------------------------------------------

export function createForm<S extends FormSchemaDefinition>(
  fields: S,
  config: FormConfig<S> = {},
): FormSchema<S> {
  return { fields, config };
}
