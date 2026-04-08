import { describe, it, expect, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { createMultiStepForm, f } from "@haloform/core";
import { useMultiStepForm } from "./useMultiStepForm.js";
import React from "react";

// ---------------------------------------------------------------------------
// Test component
// ---------------------------------------------------------------------------

const checkoutSchema = createMultiStepForm([
  {
    name: "shipping",
    fields: {
      fullName: f.text({ required: true }),
      address: f.text({ required: true }),
    },
  },
  {
    name: "payment",
    fields: {
      card: f.text({ required: true }),
    },
  },
  {
    name: "review",
    fields: {
      agreed: f.checkbox({ required: true }),
    },
  },
]);

function MultiStepTestForm({
  onSubmit = vi.fn(),
}: {
  onSubmit?: (values: Record<string, unknown>) => void;
}) {
  const {
    fields,
    currentStep,
    currentStepName,
    totalSteps,
    isFirstStep,
    isLastStep,
    currentStepFields,
    nextStep,
    prevStep,
    handleSubmit,
    reset,
  } = useMultiStepForm(checkoutSchema);

  return (
    <div>
      <span data-testid="step">{currentStep}</span>
      <span data-testid="step-name">{currentStepName}</span>
      <span data-testid="total">{totalSteps}</span>
      <span data-testid="is-first">{String(isFirstStep)}</span>
      <span data-testid="is-last">{String(isLastStep)}</span>
      <span data-testid="step-fields">{currentStepFields.join(",")}</span>

      <input
        data-testid="fullName"
        value={fields.fullName.value}
        onChange={(e) => fields.fullName.onChange(e.target.value)}
      />
      <input
        data-testid="address"
        value={fields.address.value}
        onChange={(e) => fields.address.onChange(e.target.value)}
      />
      <input
        data-testid="card"
        value={fields.card.value}
        onChange={(e) => fields.card.onChange(e.target.value)}
      />

      {fields.fullName.error && (
        <span data-testid="fullName-error">{fields.fullName.error}</span>
      )}

      <button data-testid="next" onClick={() => nextStep()}>
        Next
      </button>
      <button data-testid="prev" onClick={() => prevStep()}>
        Prev
      </button>
      <button data-testid="reset" onClick={() => reset()}>
        Reset
      </button>
      <button data-testid="submit" onClick={handleSubmit(onSubmit)}>
        Submit
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useMultiStepForm", () => {
  it("renders at step 0 with correct metadata", () => {
    render(<MultiStepTestForm />);
    expect(screen.getByTestId("step")).toHaveTextContent("0");
    expect(screen.getByTestId("step-name")).toHaveTextContent("shipping");
    expect(screen.getByTestId("total")).toHaveTextContent("3");
    expect(screen.getByTestId("is-first")).toHaveTextContent("true");
    expect(screen.getByTestId("is-last")).toHaveTextContent("false");
    expect(screen.getByTestId("step-fields")).toHaveTextContent(
      "fullName,address",
    );
  });

  it("blocks nextStep when current step validation fails", async () => {
    render(<MultiStepTestForm />);

    await act(async () => {
      screen.getByTestId("next").click();
    });

    // Should stay on step 0 — required fields empty
    expect(screen.getByTestId("step")).toHaveTextContent("0");
    expect(screen.getByTestId("fullName-error")).toBeInTheDocument();
  });

  it("advances to next step when current step is valid", async () => {
    render(<MultiStepTestForm />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("fullName"), { target: { value: "Angel" } });
      fireEvent.change(screen.getByTestId("address"), { target: { value: "123 Main" } });
    });

    await act(async () => {
      screen.getByTestId("next").click();
    });

    expect(screen.getByTestId("step")).toHaveTextContent("1");
    expect(screen.getByTestId("step-name")).toHaveTextContent("payment");
  });

  it("prevStep goes back without validation", async () => {
    render(<MultiStepTestForm />);

    // Fill step 0 and advance
    await act(async () => {
      fireEvent.change(screen.getByTestId("fullName"), { target: { value: "Angel" } });
      fireEvent.change(screen.getByTestId("address"), { target: { value: "123 Main" } });
    });

    await act(async () => {
      screen.getByTestId("next").click();
    });

    expect(screen.getByTestId("step")).toHaveTextContent("1");

    await act(async () => {
      screen.getByTestId("prev").click();
    });

    expect(screen.getByTestId("step")).toHaveTextContent("0");
  });

  it("reset goes back to step 0 and clears values", async () => {
    render(<MultiStepTestForm />);

    // Fill and advance
    await act(async () => {
      fireEvent.change(screen.getByTestId("fullName"), { target: { value: "Angel" } });
      fireEvent.change(screen.getByTestId("address"), { target: { value: "123 Main" } });
    });

    await act(async () => {
      screen.getByTestId("next").click();
    });

    await act(async () => {
      screen.getByTestId("reset").click();
    });

    expect(screen.getByTestId("step")).toHaveTextContent("0");
    expect(screen.getByTestId("fullName")).toHaveValue("");
  });

  it("submit validates all steps", async () => {
    const onSubmit = vi.fn();
    render(<MultiStepTestForm onSubmit={onSubmit} />);

    // Try submitting with empty fields
    await act(async () => {
      screen.getByTestId("submit").click();
    });

    // Should not submit — validation fails
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
