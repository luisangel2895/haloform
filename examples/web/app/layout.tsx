import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "haloform — Multi-step Checkout Example",
  description: "Demo of @haloform/react multi-step form",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fafafa" }}>
        {children}
      </body>
    </html>
  );
}
