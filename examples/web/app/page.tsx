"use client";

import { CheckoutForm } from "@/components/CheckoutForm";

export default function Home() {
  return (
    <main style={{ maxWidth: 520, margin: "60px auto", padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, color: "#1e1b4b" }}>
        haloform
      </h1>
      <p style={{ color: "#6b7280", marginBottom: 32, fontSize: 14 }}>
        Multi-step checkout form — built with <code>@haloform/react</code>
      </p>
      <CheckoutForm />
    </main>
  );
}
