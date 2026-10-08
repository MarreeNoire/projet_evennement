import { ViewTransition, type ReactNode } from "react";

export function EventRouteTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{
        "event-forward": "event-route-forward",
        "event-back": "event-route-back",
        default: "none",
      }}
      exit={{
        "event-forward": "event-route-forward",
        "event-back": "event-route-back",
        default: "none",
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
