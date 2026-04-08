import { useMemo, useCallback, useEffect, useSyncExternalStore } from "react";
import {
  createFormStore,
  createValidationEngine,
  createDependencyEngine,
  type FormSchema,
  type FormSchemaDefinition,
  type FormStore,
  type InferFormValues,
  type FieldState,
} from "@haloform/core";

// ---------------------------------------------------------------------------
// Field handle — what the consumer gets per field
// ---------------------------------------------------------------------------

export type FieldHandle<T = unknown> = FieldState<T> & {
  onChange: (value: T) => void;
  onBlur: () => void;
};

// ---------------------------------------------------------------------------
// useForm return type
// ---------------------------------------------------------------------------

export type UseFormReturn<S extends FormSchemaDefinition> = {
  fields: { [K in keyof S]: FieldHandle<InferFormValues<S>[K]> };
  handleSubmit: (
    onSubmit: (values: InferFormValues<S>) => void | Promise<void>,
  ) => (e?: { preventDefault?: () => void }) => Promise<void>;
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
  errors: Partial<Record<keyof S & string, string>>;
  reset: () => void;
  setValue: FormStore<S>["setValue"];
  getValues: () => InferFormValues<S>;
};

// ---------------------------------------------------------------------------
// useForm hook
// ---------------------------------------------------------------------------

export function useForm<S extends FormSchemaDefinition>(
  schema: FormSchema<S>,
): UseFormReturn<S> {
  // Create store, validation, and dependency engines once (stable reference)
  const { store, validation, cleanup } = useMemo(() => {
    const s = createFormStore(schema);
    const v = createValidationEngine(s);
    const d = createDependencyEngine(s);
    const unsubDeps = d.autoResolve();
    return { store: s, validation: v, cleanup: () => { v.dispose(); unsubDeps(); } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  // Subscribe to store changes via useSyncExternalStore
  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState,
  );

  // Build field handles
  const fields = useMemo(() => {
    const result = {} as UseFormReturn<S>["fields"];
    for (const name of Object.keys(schema.fields) as (keyof S & string)[]) {
      const fieldState = (state.fields as Record<string, FieldState>)[
        name
      ] as FieldState<InferFormValues<S>[typeof name]>;

      (result as Record<string, FieldHandle>)[name] = {
        value: fieldState.value,
        error: fieldState.error,
        touched: fieldState.touched,
        dirty: fieldState.dirty,
        disabled: fieldState.disabled,
        visible: fieldState.visible,
        validating: fieldState.validating,
        onChange: (value: unknown) => {
          validation.handleChange(name, value);
        },
        onBlur: () => {
          validation.handleBlur(name);
        },
      };
    }
    return result;
  }, [state, schema.fields, validation]);

  // Collect current errors
  const errors = useMemo(() => {
    const e = {} as Partial<Record<keyof S & string, string>>;
    for (const name of Object.keys(state.fields) as (keyof S & string)[]) {
      const fieldState = (state.fields as Record<string, FieldState>)[name];
      if (fieldState?.error) {
        e[name] = fieldState.error;
      }
    }
    return e;
  }, [state.fields]);

  // handleSubmit
  const handleSubmit = useCallback(
    (onSubmit: (values: InferFormValues<S>) => void | Promise<void>) => {
      return async (e?: { preventDefault?: () => void }) => {
        e?.preventDefault?.();

        // Guard against concurrent submits
        if (store.getState().isSubmitting) return;

        store.incrementSubmitCount();
        store.setSubmitting(true);
        try {
          const valid = await validation.validateAll();
          if (!valid) return;

          await onSubmit(store.getValues());
        } finally {
          store.setSubmitting(false);
        }
      };
    },
    [store, validation],
  );

  const reset = useCallback(() => store.reset(), [store]);
  const setValue = useCallback(
    (...args: Parameters<FormStore<S>["setValue"]>) => store.setValue(...args),
    [store],
  ) as FormStore<S>["setValue"];
  const getValues = useCallback(() => store.getValues(), [store]);

  return {
    fields,
    handleSubmit,
    isValid: state.isValid,
    isSubmitting: state.isSubmitting,
    submitCount: state.submitCount,
    errors,
    reset,
    setValue,
    getValues,
  };
}
