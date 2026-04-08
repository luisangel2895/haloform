import type {
  FieldDef,
  FieldKind,
  FieldState,
  FieldValueMap,
  FormSchema,
  FormSchemaDefinition,
  FormState,
  InferFormValues,
} from "./types.js";

// ---------------------------------------------------------------------------
// Subscriber pattern
// ---------------------------------------------------------------------------

type Listener = () => void;

// ---------------------------------------------------------------------------
// FormStore — the runtime engine that holds and mutates form state
// ---------------------------------------------------------------------------

export type FormStore<S extends FormSchemaDefinition = FormSchemaDefinition> = {
  /** Current snapshot of the full form state */
  getState: () => FormState<S>;
  /** Get all current field values as a plain object */
  getValues: () => InferFormValues<S>;
  /** Set a single field's value */
  setValue: <K extends keyof S & string>(name: K, value: InferFormValues<S>[K]) => void;
  /** Mark a field as touched (user interacted with it) */
  setTouched: (name: keyof S & string, touched?: boolean) => void;
  /** Set a field-level error manually */
  setError: (name: keyof S & string, error: string | null) => void;
  /** Set the field's disabled state */
  setDisabled: (name: keyof S & string, disabled: boolean) => void;
  /** Set the field's visibility */
  setVisible: (name: keyof S & string, visible: boolean) => void;
  /** Reset the entire form to initial state */
  reset: () => void;
  /** Reset a single field to its initial state */
  resetField: (name: keyof S & string) => void;
  /** Subscribe to state changes — returns unsubscribe function */
  subscribe: (listener: Listener) => () => void;
  /** Set submitting flag */
  setSubmitting: (submitting: boolean) => void;
  /** Increment submit count */
  incrementSubmitCount: () => void;
  /** The schema this store was created from */
  schema: FormSchema<S>;
};

// ---------------------------------------------------------------------------
// Default values per field kind
// ---------------------------------------------------------------------------

const DEFAULT_VALUES: FieldValueMap = {
  text: "",
  email: "",
  number: 0,
  checkbox: false,
  select: "",
  radio: "",
  textarea: "",
  date: "",
};

function getDefaultValue<K extends FieldKind>(field: FieldDef<K>): FieldValueMap[K] {
  if (field.config.default !== undefined) {
    return field.config.default as FieldValueMap[K];
  }
  return DEFAULT_VALUES[field.kind] as FieldValueMap[K];
}

function createInitialFieldState<K extends FieldKind>(field: FieldDef<K>): FieldState {
  return {
    value: getDefaultValue(field),
    error: null,
    touched: false,
    dirty: false,
    disabled: false,
    visible: true,
    validating: false,
  };
}

// ---------------------------------------------------------------------------
// createFormStore
// ---------------------------------------------------------------------------

export function createFormStore<S extends FormSchemaDefinition>(
  schema: FormSchema<S>,
): FormStore<S> {
  const listeners = new Set<Listener>();

  // Build initial state from schema
  function buildInitialState(): FormState<S> {
    const fields = {} as FormState<S>["fields"];
    for (const name of Object.keys(schema.fields)) {
      const fieldDef = schema.fields[name]!;
      (fields as Record<string, FieldState>)[name] = createInitialFieldState(fieldDef);
    }
    return {
      fields,
      isValid: true,
      isSubmitting: false,
      submitCount: 0,
    };
  }

  let state = buildInitialState();

  function notify(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  function computeIsValid(fields: FormState<S>["fields"]): boolean {
    for (const name of Object.keys(fields)) {
      const field = (fields as Record<string, FieldState>)[name]!;
      if (field.error !== null) return false;
    }
    return true;
  }

  function updateField(
    name: string,
    updater: (field: FieldState) => FieldState,
  ): void {
    const current = (state.fields as Record<string, FieldState>)[name];
    if (!current) return;

    const updated = updater(current);
    const newFields = { ...state.fields, [name]: updated } as FormState<S>["fields"];
    state = {
      ...state,
      fields: newFields,
      isValid: computeIsValid(newFields),
    };
    notify();
  }

  const store: FormStore<S> = {
    schema,

    getState: () => state,

    getValues: () => {
      const values = {} as Record<string, unknown>;
      for (const name of Object.keys(state.fields)) {
        values[name] = (state.fields as Record<string, FieldState>)[name]!.value;
      }
      return values as InferFormValues<S>;
    },

    setValue: (name, value) => {
      updateField(name, (field) => ({
        ...field,
        value,
        dirty: true,
      }));
    },

    setTouched: (name, touched = true) => {
      updateField(name, (field) => ({
        ...field,
        touched,
      }));
    },

    setError: (name, error) => {
      updateField(name, (field) => ({
        ...field,
        error,
      }));
    },

    setDisabled: (name, disabled) => {
      updateField(name, (field) => ({
        ...field,
        disabled,
      }));
    },

    setVisible: (name, visible) => {
      updateField(name, (field) => ({
        ...field,
        visible,
      }));
    },

    reset: () => {
      state = buildInitialState();
      notify();
    },

    resetField: (name) => {
      const fieldDef = schema.fields[name];
      if (!fieldDef) return;
      updateField(name, () => createInitialFieldState(fieldDef));
    },

    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    setSubmitting: (submitting) => {
      state = { ...state, isSubmitting: submitting };
      notify();
    },

    incrementSubmitCount: () => {
      state = { ...state, submitCount: state.submitCount + 1 };
      notify();
    },
  };

  return store;
}
