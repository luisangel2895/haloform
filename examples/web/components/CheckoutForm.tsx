"use client";

import { createMultiStepForm, f } from "@haloform/core";
import { useMultiStepForm } from "@haloform/react";

const checkoutSchema = createMultiStepForm([
  {
    name: "Shipping",
    fields: {
      firstName: f.text({ required: true, minLength: 2 }),
      lastName: f.text({ required: true, minLength: 2 }),
      email: f.email({ required: true }),
      address: f.text({ required: true }),
      city: f.text({ required: true }),
      country: f.select({ options: ["US", "PE", "PT", "BR", "MX"] as const, required: true }),
    },
  },
  {
    name: "Payment",
    fields: {
      cardNumber: f.text({ required: true, pattern: /^\d{16}$/ }),
      expiry: f.text({ required: true, pattern: /^\d{2}\/\d{2}$/ }),
      cvv: f.text({ required: true, minLength: 3, maxLength: 4 }),
      nameOnCard: f.text({ required: true }),
    },
  },
  {
    name: "Review",
    fields: {
      notes: f.textarea({ maxLength: 200 }),
      agreed: f.checkbox({ required: true }),
    },
  },
]);

const styles = {
  card: {
    background: "white",
    borderRadius: 12,
    padding: 32,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
  } as React.CSSProperties,
  field: {
    marginBottom: 16,
  } as React.CSSProperties,
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
    marginBottom: 4,
  } as React.CSSProperties,
  input: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  } as React.CSSProperties,
  inputError: {
    borderColor: "#ef4444",
  } as React.CSSProperties,
  error: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 2,
  } as React.CSSProperties,
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  } as React.CSSProperties,
  actions: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  } as React.CSSProperties,
  btnPrimary: {
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  } as React.CSSProperties,
  btnSecondary: {
    background: "white",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  } as React.CSSProperties,
  steps: {
    display: "flex",
    gap: 8,
    marginBottom: 24,
  } as React.CSSProperties,
  step: (active: boolean, done: boolean) =>
    ({
      flex: 1,
      height: 4,
      borderRadius: 2,
      background: active ? "#6366f1" : done ? "#a78bfa" : "#e5e7eb",
      transition: "background 0.2s",
    }) as React.CSSProperties,
  success: {
    textAlign: "center",
    padding: "40px 0",
  } as React.CSSProperties,
};

function Field({
  label,
  field,
  type = "text",
  placeholder,
}: {
  label: string;
  field: { value: string; onChange: (v: string) => void; onBlur: () => void; error: string | null; touched: boolean };
  type?: string;
  placeholder?: string;
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        value={field.value}
        onChange={(e) => field.onChange(e.target.value)}
        onBlur={field.onBlur}
        placeholder={placeholder}
        style={{
          ...styles.input,
          ...(field.error && field.touched ? styles.inputError : {}),
        }}
      />
      {field.error && field.touched && <div style={styles.error}>{field.error}</div>}
    </div>
  );
}

export function CheckoutForm() {
  const {
    fields,
    currentStep,
    currentStepName,
    totalSteps,
    isFirstStep,
    isLastStep,
    nextStep,
    prevStep,
    handleSubmit,
    isSubmitting,
  } = useMultiStepForm(checkoutSchema);

  const onSubmit = handleSubmit(async (values) => {
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    alert("Order placed!\n\n" + JSON.stringify(values, null, 2));
  });

  return (
    <div style={styles.card}>
      {/* Progress bar */}
      <div style={styles.steps}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} style={styles.step(i === currentStep, i < currentStep)} />
        ))}
      </div>

      <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 600, color: "#1e1b4b" }}>
        {currentStepName}
      </h2>

      {/* Step 0: Shipping */}
      {currentStep === 0 && (
        <>
          <div style={styles.row}>
            <Field label="First name" field={fields.firstName} placeholder="Angel" />
            <Field label="Last name" field={fields.lastName} placeholder="Orellana" />
          </div>
          <Field label="Email" field={fields.email} type="email" placeholder="angel@example.com" />
          <Field label="Address" field={fields.address} placeholder="123 Main St" />
          <div style={styles.row}>
            <Field label="City" field={fields.city} placeholder="Lima" />
            <div style={styles.field}>
              <label style={styles.label}>Country</label>
              <select
                value={fields.country.value}
                onChange={(e) => fields.country.onChange(e.target.value)}
                onBlur={fields.country.onBlur}
                style={styles.input}
              >
                <option value="">Select...</option>
                <option value="US">United States</option>
                <option value="PE">Peru</option>
                <option value="PT">Portugal</option>
                <option value="BR">Brazil</option>
                <option value="MX">Mexico</option>
              </select>
              {fields.country.error && fields.country.touched && (
                <div style={styles.error}>{fields.country.error}</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Step 1: Payment */}
      {currentStep === 1 && (
        <>
          <Field label="Card number" field={fields.cardNumber} placeholder="1234567812345678" />
          <div style={styles.row}>
            <Field label="Expiry" field={fields.expiry} placeholder="MM/YY" />
            <Field label="CVV" field={fields.cvv} placeholder="123" />
          </div>
          <Field label="Name on card" field={fields.nameOnCard} placeholder="ANGEL ORELLANA" />
        </>
      )}

      {/* Step 2: Review */}
      {currentStep === 2 && (
        <>
          <div style={{ ...styles.field, background: "#f9fafb", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Shipping to:</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {fields.firstName.value} {fields.lastName.value}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              {fields.address.value}, {fields.city.value}, {fields.country.value}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{fields.email.value}</div>
          </div>
          <div style={{ ...styles.field, background: "#f9fafb", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Payment:</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              **** **** **** {fields.cardNumber.value.slice(-4)}
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Order notes (optional)</label>
            <textarea
              value={fields.notes.value}
              onChange={(e) => fields.notes.onChange(e.target.value)}
              onBlur={fields.notes.onBlur}
              rows={3}
              placeholder="Any special requests..."
              style={{ ...styles.input, resize: "vertical" }}
            />
          </div>
          <div style={styles.field}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={fields.agreed.value}
                onChange={(e) => fields.agreed.onChange(e.target.checked)}
                onBlur={fields.agreed.onBlur}
              />
              I agree to the terms and conditions
            </label>
            {fields.agreed.error && fields.agreed.touched && (
              <div style={styles.error}>{fields.agreed.error}</div>
            )}
          </div>
        </>
      )}

      {/* Navigation */}
      <div style={styles.actions}>
        <button
          type="button"
          onClick={prevStep}
          style={{ ...styles.btnSecondary, visibility: isFirstStep ? "hidden" : "visible" }}
        >
          Back
        </button>
        {isLastStep ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            style={{ ...styles.btnPrimary, opacity: isSubmitting ? 0.6 : 1 }}
          >
            {isSubmitting ? "Placing order..." : "Place order"}
          </button>
        ) : (
          <button type="button" onClick={nextStep} style={styles.btnPrimary}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
