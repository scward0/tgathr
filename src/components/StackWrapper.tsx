"use client";

import { StackProvider } from "@stackframe/stack";
import { stackApp } from "@/lib/stack-client";
import { ReactNode } from "react";

export function StackWrapper({ children }: { children: ReactNode }) {
  console.log('StackWrapper rendering with app:', stackApp);
  
  return (
    <StackProvider app={stackApp}>
      {children}
    </StackProvider>
  );
}