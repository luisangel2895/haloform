import type {
  StepDefinition,
  MultiStepSchema,
  MergeStepFields,
  InferFormValues,
} from "./types.js";
import { createFormStore, type FormStore } from "./store.js";
import { createValidationEngine, type ValidationEngine } from "./validation.js";

// ---------------------------------------------------------------------------
// createMultiStepForm — schema builder for multi-step forms
// ---------------------------------------------------------------------------

export function createMultiStepForm<
  const Steps extends readonly StepDefinition[],
>(steps: Steps): MultiStepSchema<Steps> {
  return { steps };
}

// ---------------------------------------------------------------------------
// MultiStepStore — runtime engine for multi-step form navigation
// ---------------------------------------------------------------------------

export type MultiStepStore<Steps extends readonly StepDefinition[]> = {
  /** The underlying flat form store */
  store: FormStore<MergeStepFields<Steps>>;
  /** Validation engine for the flat store */
  validation: ValidationEngine<MergeStepFields<Steps>>;
  /** Current step index (0-based) */
  getCurrentStep: () => number;
  /** Current step name */
  getCurrentStepName: () => string;
  /** Total number of steps */
  getTotalSteps: () => number;
  /** Whether currently on the first step */
  isFirstStep: () => boolean;
  /** Whether currently on the last step */
  isLastStep: () => boolean;
  /** Field names for the current step */
  getCurrentStepFields: () => string[];
  /** Go to next step — validates current step first. Returns false if validation fails. */
  nextStep: () => Promise<boolean>;
  /** Go to previous step (no validation needed) */
  prevStep: () => void;
  /** Go to a specific step by index */
  goToStep: (index: number) => void;
  /** Validate only the current step's fields. Returns true if all valid. */
  validateCurrentStep: () => Promise<boolean>;
  /** Validate all steps and return true if entire form is valid */
  validateAll: () => Promise<boolean>;
  /** Get merged values from all steps */
  getValues: () => InferFormValues<MergeStepFields<Steps>>;
  /** Subscribe to step changes */
  onStepChange: (listener: (step: number) => void) => () => void;
};

export function createMultiStepStore<
  const Steps extends readonly StepDefinition[],
>(schema: MultiStepSchema<Steps>): MultiStepStore<Steps> {
  type Merged = MergeStepFields<Steps>;

  // Merge all step fields into a single flat schema definition
  const mergedFields = {} as Record<string, unknown>;
  for (const step of schema.steps) {
    Object.assign(mergedFields, step.fields);
  }

  // Build a flat FormSchema for the underlying store
  const flatSchema = {
    fields: mergedFields as Merged,
    config: {},
  };

  const store = createFormStore(flatSchema) as FormStore<Merged>;
  const validation = createValidationEngine(store);

  // Step tracking
  let currentStep = 0;
  let navigating = false;
  const stepListeners = new Set<(step: number) => void>();

  function notifyStepChange(): void {
    for (const listener of stepListeners) {
      listener(currentStep);
    }
  }

  // Build a map of step index → field names
  const stepFieldNames: string[][] = schema.steps.map((step) =>
    Object.keys(step.fields),
  );

  async function validateStep(stepIndex: number): Promise<boolean> {
    const fields = stepFieldNames[stepIndex];
    if (!fields) return true;

    // Validate each field in this step
    const results = await Promise.all(
      fields.map((name) =>
        validation.validateField(name as keyof Merged & string),
      ),
    );

    const hasFieldErrors = results.some((r) => r !== null);

    // Run step-level cross validation if defined
    const stepDef = schema.steps[stepIndex];
    if (stepDef?.validate) {
      const values = store.getValues() as Record<string, unknown>;
      // Build a subset of values for this step
      const stepValues = {} as Record<string, unknown>;
      for (const name of fields) {
        stepValues[name] = values[name];
      }
      const errors = (stepDef.validate as (v: Record<string, unknown>) => Record<string, string> | undefined)(stepValues);
      if (errors) {
        for (const [name, error] of Object.entries(errors)) {
          store.setError(name as keyof Merged & string, error);
        }
        return false;
      }
    }

    return !hasFieldErrors;
  }

  const multiStepStore: MultiStepStore<Steps> = {
    store,
    validation,

    getCurrentStep: () => currentStep,
    getCurrentStepName: () => schema.steps[currentStep]?.name ?? "",
    getTotalSteps: () => schema.steps.length,
    isFirstStep: () => currentStep === 0,
    isLastStep: () => currentStep === schema.steps.length - 1,
    getCurrentStepFields: () => stepFieldNames[currentStep] ?? [],

    nextStep: async () => {
      if (navigating) return false;
      navigating = true;
      try {
        const valid = await validateStep(currentStep);
        if (!valid) return false;

        if (currentStep < schema.steps.length - 1) {
          currentStep++;
          notifyStepChange();
        }
        return true;
      } finally {
        navigating = false;
      }
    },

    prevStep: () => {
      if (currentStep > 0) {
        currentStep--;
        notifyStepChange();
      }
    },

    goToStep: (index: number) => {
      if (index >= 0 && index < schema.steps.length) {
        currentStep = index;
        notifyStepChange();
      }
    },

    validateCurrentStep: () => validateStep(currentStep),

    validateAll: async () => {
      const results = await Promise.all(
        schema.steps.map((_, i) => validateStep(i)),
      );
      return results.every(Boolean);
    },

    getValues: () => store.getValues(),

    onStepChange: (listener) => {
      stepListeners.add(listener);
      return () => { stepListeners.delete(listener); };
    },
  };

  return multiStepStore;
}
