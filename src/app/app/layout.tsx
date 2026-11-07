import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = { title: "Minna" };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AppShell>{children}</AppShell>
    </StoreProvider>
  );
}
