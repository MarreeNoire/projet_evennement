"use client";

import { forwardRef, type HTMLAttributes, type ReactNode, useMemo, useState, Children, isValidElement, cloneElement } from "react";
import { cn } from "@/lib/utils";
import styles from "./avatar.module.css";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  shape?: "circle" | "square";
  status?: "online" | "offline" | "busy" | "away";
  statusPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  loading?: "lazy" | "eager";
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = "",
      fallback,
      size = "md",
      shape = "circle",
      status,
      statusPosition = "bottom-right",
      loading = "lazy",
      className,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);

    const initials = useMemo(() => {
      if (!alt) return "?";
      const parts = alt.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return "?";
      const first = parts[0] ?? "";
      if (parts.length === 1) return first.slice(0, 2).toUpperCase();
      const last = parts[parts.length - 1] ?? "";
      return (first.charAt(0) + last.charAt(0)).toUpperCase();
    }, [alt]);

    const showFallback = !src || imageError;

    return (
      <div
        ref={ref}
        className={cn(
          styles.avatar,
          styles[size],
          styles[shape],
          status && styles.hasStatus,
          className
        )}
        {...props}
      >
        {showFallback ? (
          <div className={styles.fallback} aria-hidden="true">
            {fallback ?? initials}
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            loading={loading}
            className={styles.image}
            onError={() => setImageError(true)}
          />
        )}
        {status && (
          <span
            className={cn(styles.status, styles[status], styles[`status-${statusPosition}`])}
            aria-label={`Statut: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  max?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  overlap?: boolean;
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  (
    {
      children,
      max = 5,
      size = "md",
      overlap = true,
      className,
      ...props
    },
    ref
  ) => {
    const childArray = Children.toArray(children);
    const visibleChildren = childArray.slice(0, max);
    const remainingCount = childArray.length - max;

    return (
      <div
        ref={ref}
        className={cn(styles.group, overlap && styles.overlap, className)}
        {...props}
      >
        {visibleChildren.map((child, index) =>
          isValidElement(child) ? (
            cloneElement(child as React.ReactElement<{ className?: string; size?: string }>, {
              size,
              className: cn(
                (child.props as { className?: string }).className,
                index === visibleChildren.length - 1 && remainingCount > 0 && styles.lastVisible
              ),
            })
          ) : (
            child
          )
        )}
        {remainingCount > 0 && (
          <div className={cn(styles.avatar, styles[size], styles.overflow)}>
            <span className={styles.overflowText}>+{remainingCount}</span>
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = "AvatarGroup";