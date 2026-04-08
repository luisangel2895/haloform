import { useMemo, useCallback, useSyncExternalStore, useState } from "react";
import {
  createMultiStepStore,
  type MultiStepSchema,
  type StepDefinition,
  type MergeStepFields,
  type InferFormValues,
  type FieldState,
} from "@haloform/core";
import type { FieldHandle } from "./useForm.js";

// ---------------------------------------------------------------------------
// useMultiStepForm return type
// ---------------------------------------------------------------------------

export type UseMultiStepFormReturn<Steps extends readonly StepDefinition[]> = {
  /** Current step index (0-based) */
  currentStep: number;
  /** Current step name */
  currentStepName: string;
  /** Total number of steps */
  totalSteps: number;
  /** Whether on the first step */
  isFirstStep: boolean;
  /** Whether on the last step */
  isLastStep: boolean;
  /** Field handles for ALL fields (not just current step) */
  fields: {
    [K in keyof MergeStepFields<Steps>]: FieldHandle<
      InferFormValues<MergeStepFields<Steps>>[K]
    >;
  };
  /** Field names for the current step */
  currentStepFields: string[];
  /** Advance to next step (validates current step first) */
  nextStep: () => Promise<boolean>;
  /** Go back to previous step */
  prevStep: () => void;
  /** Jump to a specific step */
  goToStep: (index: number) => void;
  /** Submit handler — validates all steps before calling onSubmit */
  handleSubmit: (
    onSubmit: (
      values: InferFormValues<MergeStepFields<Steps>>,
    ) => void | Promise<void>,
  ) => (e?: { preventDefault?: () => void }) => Promise<void>;
  /** Whether the form is currently submitting */
  isSubmitting: boolean;
  /** All current values across all steps */
  getValues: () => InferFormValues<MergeStepFields<Steps>>;
  /** Reset the entire form and go back to step 0 */
  reset: () => void;
};

// ---------------------------------------------------------------------------
// useMultiStepForm hook
// ---------------------------------------------------------------------------

export function useMultiStepForm<
  const Steps extends readonly StepDefinition[],
>(schema: MultiStepSchema<Steps>): UseMultiStepFormReturn<Steps> {
  type Merged = MergeStepFields<Steps>;

  const ms = useMemo(() => createMultiStepStore(schema), []);

  // Step state — driven by onStepChange
  const [step, setStep] = useState(0);

  // Subscribe to step changes
  useMemo(() => {
    ms.onStepChange((s) => setStep(s));
  }, [ms]);

  // Subscribe to the underlying store for field state
  const state = useSyncExternalStore(
    ms.store.subscribe,
    ms.store.getState,
    ms.store.getState,
  );

  // Build field handles from merged fields
  const fields = useMemo(() => {
    const allFieldNames = Object.keys(state.fields);
    const result = {} as Record<string, FieldHandle>;

    for (const name of allFieldNames) {
      const fieldState = (state.fields as Record<string, FieldState>)[name]!;

      result[name] = {
        value: fieldState.value,
        error: fieldState.error,
        touched: fieldState.touched,
        dirty: fieldState.dirty,
        disabled: fieldState.disabled,
        visible: fieldState.visible,
        validating: fieldState.validating,
        onChange: (value: unknown) => {
          ms.validation.handleChange(
            name as keyof Merged & string,
            value,
          );
        },
        onBlur: () => {
          ms.validation.handleBlur(name as keyof Merged & string);
        },
      };
    }

    return result as UseMultiStepFormReturn<Steps>["fields"];
  }, [state, ms.validation]);

  const handleSubmit = useCallback(
    (
      onSubmit: (
        values: InferFormValues<Merged>,
      ) => void | Promise<void>,
    ) => {
      return async (e?: { preventDefault?: () => void }) => {
        e?.preventDefault?.();
        ms.store.incrementSubmitCount();

        const valid = await ms.validateAll();
        if (!valid) return;

        ms.store.setSubmitting(true);
        try {
          await onSubmit(ms.getValues());
        } finally {
          ms.store.setSubmitting(false);
        }
      };
    },
    [ms],
  );

  const reset = useCallback(() => {
    ms.store.reset();
    ms.goToStep(0);
  }, [ms]);

  return {
    currentStep: step,
    currentStepName: ms.getCurrentStepName(),
    totalSteps: ms.getTotalSteps(),
    isFirstStep: step === 0,
    isLastStep: step === ms.getTotalSteps() - 1,
    fields,
    currentStepFields: ms.getCurrentStepFields(),
    nextStep: () => ms.nextStep(),
    prevStep: () => ms.prevStep(),
    goToStep: (i) => ms.goToStep(i),
    handleSubmit,
    isSubmitting: state.isSubmitting,
    getValues: () => ms.getValues(),
    reset,
  };
}
