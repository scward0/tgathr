"use client";

import { StackProvider } from "@stackframe/stack";
import { stackApp } from "@/lib/stack-client";
import { ReactNode } from "react";

export function StackWrapper({ children }: { children: ReactNode }) {
  return (
    <StackProvider app={stackApp}>
      {children}
    </StackProvider>
  );
}