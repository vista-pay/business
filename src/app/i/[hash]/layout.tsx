import { Suspense, type ReactNode } from "react";

// This public route resolves its hash at request time in a Client Component.
export const instant = false;

export default function PublicInvoiceLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
