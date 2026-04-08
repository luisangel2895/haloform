import type {
  FieldDef,
  FormSchemaDefinition,
  InferFormValues,
} from "./types.js";
import type { FormStore } from "./store.js";

// ---------------------------------------------------------------------------
// DependencyEngine — resolves inter-field dependencies
// ---------------------------------------------------------------------------

export type DependencyEngine<S extends FormSchemaDefinition> = {
  /** Resolve all dependencies based on current form values */
  resolve: () => void;
  /** Resolve dependencies triggered by a specific field changing */
  resolveFor: (changedField: keyof S & string) => void;
  /** Subscribe to the store so dependencies auto-resolve on changes. Returns unsubscribe. */
  autoResolve: () => () => void;
};

export function createDependencyEngine<S extends FormSchemaDefinition>(
  store: FormStore<S>,
): DependencyEngine<S> {
  // Build a reverse index: for each field, which other fields depend on it
  const dependents = new Map<string, Set<string>>();

  for (const [fieldName, fieldDef] of Object.entries(store.schema.fields)) {
    const deps = (fieldDef as FieldDef).config.dependsOn;
    if (!deps) continue;

    for (const depSource of Object.keys(deps)) {
      let set = dependents.get(depSource);
      if (!set) {
        set = new Set();
        dependents.set(depSource, set);
      }
      set.add(fieldName);
    }
  }

  function applyEffects(fieldName: string): void {
    const fieldDef = store.schema.fields[fieldName] as FieldDef | undefined;
    if (!fieldDef?.config.dependsOn) return;

    const values = store.getValues() as Record<string, unknown>;

    for (const [depSource, effectFn] of Object.entries(fieldDef.config.dependsOn)) {
      const sourceValue = values[depSource];
      const effect = (effectFn as (v: unknown) => Record<string, unknown>)(sourceValue);

      if (effect.visible !== undefined) {
        store.setVisible(fieldName as keyof S & string, effect.visible as boolean);
      }

      if (effect.value !== undefined) {
        store.setValue(
          fieldName as keyof S & string,
          effect.value as InferFormValues<S>[keyof S & string],
        );
      }

      if (effect.options !== undefined) {
        // Store options on the field config for runtime access
        const currentDef = store.schema.fields[fieldName] as FieldDef;
        (currentDef.config as Record<string, unknown>).options = effect.options;
      }
    }
  }

  function resolve(): void {
    for (const fieldName of Object.keys(store.schema.fields)) {
      const fieldDef = store.schema.fields[fieldName] as FieldDef;
      if (fieldDef.config.dependsOn) {
        applyEffects(fieldName);
      }
    }
  }

  function resolveFor(changedField: keyof S & string): void {
    const deps = dependents.get(changedField);
    if (!deps) return;

    for (const depFieldName of deps) {
      applyEffects(depFieldName);
    }
  }

  function autoResolve(): () => void {
    let previousValues = { ...store.getValues() } as Record<string, unknown>;
    let resolving = false;

    // Run initial resolution
    resolve();
    previousValues = { ...store.getValues() } as Record<string, unknown>;

    return store.subscribe(() => {
      // Guard against re-entrant calls (resolveFor triggers store updates)
      if (resolving) return;
      resolving = true;

      try {
        const currentValues = store.getValues() as Record<string, unknown>;

        // Find which fields changed
        for (const name of Object.keys(currentValues)) {
          if (currentValues[name] !== previousValues[name]) {
            resolveFor(name as keyof S & string);
          }
        }

        previousValues = { ...store.getValues() } as Record<string, unknown>;
      } finally {
        resolving = false;
      }
    });
  }

  return { resolve, resolveFor, autoResolve };
}
