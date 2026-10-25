"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import styles from "./empty-state.module.css";
import {
  EmptyEventsIllustration,
  EmptySearchIllustration,
  EmptySalonIllustration,
  EmptyTicketsIllustration,
  EmptyNotificationsIllustration,
  OfflineIllustration,
  ErrorIllustration,
  LoadingIllustration,
} from "./empty-states";

export type EmptyStateVariant =
  | "events"
  | "search"
  | "salon"
  | "tickets"
  | "notifications"
  | "offline"
  | "error"
  | "loading";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  variant: EmptyStateVariant;
  title: string;
  description?: string;
  action?: React.ReactNode;
  illustrationSize?: "sm" | "md" | "lg" | "xl";
  centered?: boolean;
}

const illustrationMap: Record<EmptyStateVariant, React.ComponentType<{ className?: string; size?: "sm" | "md" | "lg" | "xl" }>> = {
  events: EmptyEventsIllustration,
  search: EmptySearchIllustration,
  salon: EmptySalonIllustration,
  tickets: EmptyTicketsIllustration,
  notifications: EmptyNotificationsIllustration,
  offline: OfflineIllustration,
  error: ErrorIllustration,
  loading: LoadingIllustration,
};

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      variant,
      title,
      description,
      action,
      illustrationSize = "lg",
      centered = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const Illustration = illustrationMap[variant];

    return (
      <div
        ref={ref}
        className={cn(
          styles.emptyState,
          centered && styles.centered,
          variant === "loading" && styles.loading,
          className
        )}
        {...props}
      >
        <div className={styles.illustrationWrapper} aria-hidden="true">
          <Illustration size={illustrationSize} />
        </div>
        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          {description && <p className={styles.description}>{description}</p>}
          {action && <div className={styles.action}>{action}</div>}
          {children && <div className={styles.extra}>{children}</div>}
        </div>
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

/* --- Skeleton Components --- */

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "card" | "avatar";
  width?: string | number;
  height?: string | number;
  lines?: number;
  animated?: boolean;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = "text",
      width = "100%",
      height,
      lines = 1,
      animated = true,
      className,
      ...props
    },
    ref
  ) => {
    if (variant === "card") {
      return (
        <div
          ref={ref}
          className={cn(styles.skeleton, styles.skeletonCard, animated && styles.animated, className)}
          style={{ width, height } as React.CSSProperties}
          {...props}
        >
          <div className={cn(styles.skeletonElement, styles.skeletonImage)} />
          <div className={styles.skeletonBody}>
            <div className={cn(styles.skeletonElement, styles.skeletonTitle)} />
            <div className={cn(styles.skeletonElement, styles.skeletonText)} />
            <div className={cn(styles.skeletonElement, styles.skeletonTextShort)} />
          </div>
        </div>
      );
    }

    if (variant === "avatar") {
      return (
        <div
          ref={ref}
          className={cn(styles.skeleton, styles.skeletonAvatar, animated && styles.animated, className)}
          style={{ width, height } as React.CSSProperties}
          {...props}
        />
      );
    }

    if (variant === "circular") {
      return (
        <div
          ref={ref}
          className={cn(styles.skeleton, styles.skeletonCircular, animated && styles.animated, className)}
          style={{ width, height: height ?? width } as React.CSSProperties}
          {...props}
        />
      );
    }

    const lineHeight = "1rem";
    const gap = "0.5rem";

    return (
      <div
        ref={ref}
        className={cn(styles.skeleton, animated && styles.animated, className)}
        style={{ width } as React.CSSProperties}
        {...props}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(styles.skeletonElement, styles.skeletonLine)}
            style={{
              height: height ? `${parseInt(String(height)) / lines}px` : lineHeight,
              width: i === lines - 1 ? "60%" : "100%",
              marginBottom: i === lines - 1 ? 0 : gap,
            } as React.CSSProperties}
          />
        ))}
      </div>
    );
  }
);

Skeleton.displayName = "Skeleton";

/* --- Skeleton Card Presets --- */

export const EventCardSkeleton = () => (
  <div className={styles.skeletonCardWrapper} aria-hidden="true">
    <Skeleton variant="card" width="100%" height="320px" />
  </div>
);

export const EventCardSkeletonGrid = ({ count = 6 }: { count?: number }) => (
  <div className={styles.skeletonGrid} aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <EventCardSkeleton key={i} />
    ))}
  </div>
);

export const ListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className={styles.skeletonList} aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} variant="rectangular" height="72px" width="100%" />
    ))}
  </div>
);

export const SearchResultsSkeleton = () => (
  <div className={styles.skeletonGrid} aria-hidden="true">
    {Array.from({ length: 8 }).map((_, i) => (
      <Skeleton key={i} variant="card" width="100%" height="280px" />
    ))}
  </div>
);