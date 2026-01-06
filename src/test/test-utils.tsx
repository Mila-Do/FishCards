import React from "react";
import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {/* Add your providers here (React Query, Context, etc.) */}
      {children}
    </>
  );
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
