import { ViewTransition, type ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="route-fade-in" exit="route-fade-out" default="none">
      {children}
    </ViewTransition>
  );
}
