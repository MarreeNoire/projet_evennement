"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import styles from "./badge.module.css";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "warning" | "error" | "outline" | "subtle";
  size?: "xs" | "sm" | "md" | "lg";
  dot?: boolean;
  dotColor?: string;
  removable?: boolean;
  onRemove?: () => void;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      variant = "default",
      size = "md",
      dot = false,
      dotColor,
      removable = false,
      onRemove,
      className,
      ...props
    },
    ref
  ) => (
    <span
      ref={ref}
      className={cn(
        styles.badge,
        styles[variant],
        styles[size],
        dot && styles.dot,
        removable && styles.removable,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={styles.dotIndicator}
          style={dotColor ? { backgroundColor: dotColor } : undefined}
          aria-hidden="true"
        />
      )}
      <span className={styles.content}>{children}</span>
      {removable && (
        <button
          type="button"
          className={styles.removeButton}
          onClick={onRemove}
          aria-label="Supprimer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </span>
  )
);

Badge.displayName = "Badge";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "warning" | "error";
  size?: "sm" | "md";
  count?: number;
}

export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  (
    {
      children,
      variant = "default",
      size = "md",
      count,
      className,
      ...props
    },
    ref
  ) => (
    <span
      ref={ref}
      className={cn(styles.tag, styles[`tag-${variant}`], styles[`tag-${size}`], className)}
      {...props}
    >
      <span className={styles.tagContent}>{children}</span>
      {count !== undefined && (
        <span className={cn(styles.tagCount, styles[`tag-count-${variant}`])}>
          {count}
        </span>
      )}
    </span>
  )
);

Tag.displayName = "Tag";

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: "pending" | "active" | "completed" | "cancelled" | "draft" | "published" | "archived";
  size?: "sm" | "md";
}

const statusVariantMap: Record<StatusBadgeProps["status"], BadgeProps["variant"]> = {
  pending: "warning",
  active: "success",
  completed: "primary",
  cancelled: "error",
  draft: "subtle",
  published: "success",
  archived: "outline",
};

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, size = "md", className, ...props }, ref) => (
    <Badge
      ref={ref}
      variant={statusVariantMap[status]}
      size={size}
      className={cn(styles.statusBadge, className)}
      {...props}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
);

StatusBadge.displayName = "StatusBadge";