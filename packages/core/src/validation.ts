import type {
  FieldDef,
  FieldState,
  FormSchemaDefinition,
  InferFormValues,
  ValidationResult,
} from "./types.js";
import type { FormStore } from "./store.js";

// ---------------------------------------------------------------------------
// Built-in validators — run before the user's custom validate()
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function runBuiltInValidation(field: FieldDef, value: unknown): string | null {
  const config = field.config;

  // Required check
  if (config.required) {
    if (value === "" || value === undefined || value === null) {
      return "This field is required";
    }
    if (field.kind === "checkbox" && value === false) {
      return "This field is required";
    }
  }

  // String-based validations
  if (typeof value === "string") {
    if (field.kind === "email" && value.length > 0 && !EMAIL_RE.test(value)) {
      return "Invalid email address";
    }
    const minLength = config.minLength as number | undefined;
    if (minLength !== undefined && value.length > 0 && value.length < minLength) {
      return `Must be at least ${minLength} characters`;
    }
    const maxLength = config.maxLength as number | undefined;
    if (maxLength !== undefined && value.length > maxLength) {
      return `Must be at most ${maxLength} characters`;
    }
    const pattern = config.pattern as RegExp | undefined;
    if (pattern !== undefined && value.length > 0 && !pattern.test(value)) {
      return "Invalid format";
    }
  }

  // Number-based validations
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "Must be a valid number";
    }
    const min = config.min as number | undefined;
    if (min !== undefined && value < min) {
      return `Must be at least ${min}`;
    }
    const max = config.max as number | undefined;
    if (max !== undefined && value > max) {
      return `Must be at most ${max}`;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Async validation controller — manages debounce + abort per field
// ---------------------------------------------------------------------------

type FieldValidationState = {
  abortController: AbortController | null;
  debounceTimer: ReturnType<typeof setTimeout> | null;
};

// ---------------------------------------------------------------------------
// ValidationEngine — orchestrates validation for a FormStore
// ---------------------------------------------------------------------------

export type ValidationEngine<S extends FormSchemaDefinition> = {
  /** Validate a single field (built-in + custom). Returns the error or null. */
  validateField: (name: keyof S & string) => Promise<string | null>;
  /** Validate all fields. Returns true if the form is valid. */
  validateAll: () => Promise<boolean>;
  /** Handle a field blur event — runs validation with the blur strategy */
  handleBlur: (name: keyof S & string) => void;
  /** Handle a field change event — runs validation only if already touched */
  handleChange: (name: keyof S & string, value: unknown) => void;
  /** Run cross-field validation if configured */
  validateCrossField: () => Record<string, string> | undefined;
  /** Clean up all timers and abort controllers */
  dispose: () => void;
};

export function createValidationEngine<S extends FormSchemaDefinition>(
  store: FormStore<S>,
  options: { debounceMs?: number } = {},
): ValidationEngine<S> {
  const debounceMs = options.debounceMs ?? store.schema.config.validateDebounceMs ?? 300;
  const fieldStates = new Map<string, FieldValidationState>();

  function getFieldValidationState(name: string): FieldValidationState {
    let fs = fieldStates.get(name);
    if (!fs) {
      fs = { abortController: null, debounceTimer: null };
      fieldStates.set(name, fs);
    }
    return fs;
  }

  function cancelPending(name: string): void {
    const fs = getFieldValidationState(name);
    if (fs.debounceTimer !== null) {
      clearTimeout(fs.debounceTimer);
      fs.debounceTimer = null;
    }
    if (fs.abortController) {
      fs.abortController.abort();
      fs.abortController = null;
    }
  }

  async function validateField(name: keyof S & string): Promise<string | null> {
    cancelPending(name);

    const fieldDef = store.schema.fields[name];
    if (!fieldDef) return null;

    const state = store.getState();
    const fieldState = (state.fields as Record<string, FieldState>)[name];
    if (!fieldState) return null;

    const value = fieldState.value;

    // 1. Run built-in validators
    const builtInError = runBuiltInValidation(fieldDef, value);
    if (builtInError) {
      store.setError(name, builtInError);
      return builtInError;
    }

    // 2. Run custom validator if present
    const customValidate = fieldDef.config.validate;
    if (!customValidate) {
      store.setError(name, null);
      return null;
    }

    // Create AbortController before invoking validator so it can be
    // cancelled by a subsequent validateField call via cancelPending.
    const ac = new AbortController();
    const fs = getFieldValidationState(name);
    fs.abortController = ac;

    try {
      const result = customValidate(value as never, ac.signal as never);

      if (result instanceof Promise) {
        store.setValidating(name, true);
        try {
          const asyncResult = await result;
          // Check if this validation was aborted while awaiting
          if (ac.signal.aborted) return null;

          const error = asyncResult === true ? null : asyncResult;
          store.setError(name, error);
          return error;
        } catch {
          // If aborted, ignore
          if (ac.signal.aborted) return null;
          return null;
        } finally {
          const currentFs = fieldStates.get(name);
          if (currentFs?.abortController === ac) {
            currentFs.abortController = null;
          }
          // Only clear validating if this is still the active validation
          if (!ac.signal.aborted) {
            store.setValidating(name, false);
          }
        }
      } else {
        // Sync validation
        fs.abortController = null;
        const error = (result as ValidationResult) === true ? null : (result as string);
        store.setError(name, error);
        return error;
      }
    } catch {
      fs.abortController = null;
      store.setValidating(name, false);
      return null;
    }
  }

  async function validateAll(): Promise<boolean> {
    const fieldNames = Object.keys(store.schema.fields);
    const results = await Promise.all(
      fieldNames.map((name) => validateField(name as keyof S & string)),
    );

    // Run cross-field validation
    const crossErrors = validateCrossField();

    const hasFieldErrors = results.some((r) => r !== null);
    const hasCrossErrors = crossErrors !== undefined && Object.keys(crossErrors).length > 0;

    return !hasFieldErrors && !hasCrossErrors;
  }

  function validateCrossField(): Record<string, string> | undefined {
    const crossValidate = store.schema.config.validate;
    if (!crossValidate) return undefined;

    const values = store.getValues();
    const errors = crossValidate(values);

    if (errors) {
      for (const [name, error] of Object.entries(errors)) {
        store.setError(name as keyof S & string, error);
      }
    }

    return errors;
  }

  function debouncedValidateField(name: keyof S & string): void {
    cancelPending(name);

    const fieldDef = store.schema.fields[name];
    const hasAsyncValidator =
      fieldDef?.config.validate &&
      isAsyncValidator(fieldDef.config.validate);

    if (!hasAsyncValidator) {
      // Sync validators run immediately, no debounce needed
      void validateField(name);
      return;
    }

    const fs = getFieldValidationState(name);
    fs.debounceTimer = setTimeout(() => {
      fs.debounceTimer = null;
      void validateField(name);
    }, debounceMs);
  }

  function handleBlur(name: keyof S & string): void {
    store.setTouched(name, true);
    void validateField(name);
  }

  function handleChange(name: keyof S & string, value: unknown): void {
    store.setValue(name, value as InferFormValues<S>[keyof S & string]);

    // Only validate on change if the field has been touched (blur-first strategy)
    const state = store.getState();
    const fieldState = (state.fields as Record<string, FieldState>)[name];
    if (fieldState?.touched) {
      debouncedValidateField(name);
    }
  }

  function dispose(): void {
    for (const [name] of fieldStates) {
      cancelPending(name);
    }
    fieldStates.clear();
  }

  return {
    validateField,
    validateAll,
    handleBlur,
    handleChange,
    validateCrossField,
    dispose,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isAsyncValidator(validate: unknown): boolean {
  if (typeof validate !== "function") return false;
  // Heuristic: async validators accept a signal parameter (length > 1)
  return (validate as (...args: unknown[]) => unknown).length > 1;
}
