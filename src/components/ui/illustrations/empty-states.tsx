"use client";

import { cn } from "@/lib/utils";

export interface IllustrationProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-24 h-24",
  md: "w-32 h-32",
  lg: "w-48 h-48",
  xl: "w-64 h-64",
};

const colorClass = "text-vermilion-600 dark:text-vermilion-400";

export function EmptyEventsIllustration({ className, size = "lg" }: IllustrationProps) {
  return (
    <svg
      className={cn(sizeClasses[size], colorClass, className)}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ticketGradient" x1="0" y1="0" x2="200" y2="200">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Ticket shape */}
      <path
        d="M30 40 L170 40 L170 160 L30 160 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="8 4"
        fill="url(#ticketGradient)"
      />

      {/* Perforation */}
      <circle cx="50" cy="40" r="3" fill="currentColor" fillOpacity="0.3" />
      <circle cx="150" cy="40" r="3" fill="currentColor" fillOpacity="0.3" />
      <circle cx="50" cy="160" r="3" fill="currentColor" fillOpacity="0.3" />
      <circle cx="150" cy="160" r="3" fill="currentColor" fillOpacity="0.3" />

      {/* Event icon */}
      <path
        d="M100 70 L100 100 M85 85 L115 85"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />

      {/* Calendar lines */}
      <path
        d="M60 120 L140 120 M60 135 L140 135 M60 150 L100 150"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* Small stars/sparkles */}
      <circle cx="30" cy="30" r="2" fill="currentColor" fillOpacity="0.4" />
      <circle cx="170" cy="170" r="2" fill="currentColor" fillOpacity="0.4" />
      <circle cx="30" cy="170" r="1.5" fill="currentColor" fillOpacity="0.3" />
      <circle cx="170" cy="30" r="1.5" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

export function EmptySearchIllustration({ className, size = "lg" }: IllustrationProps) {
  return (
    <svg
      className={cn(sizeClasses[size], colorClass, className)}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="searchGradient" x1="0" y1="0" x2="200" y2="200">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Magnifying glass */}
      <circle
        cx="80"
        cy="80"
        r="35"
        stroke="currentColor"
        strokeWidth="3"
        fill="url(#searchGradient)"
      />
      <path
        d="M115 115 L140 140"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Question marks */}
      <path
        d="M50 140 Q65 130 75 140 M70 130 V145"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M130 50 Q145 60 130 70 M130 60 V75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />

      {/* Floating particles */}
      <circle cx="30" cy="30" r="1.5" fill="currentColor" fillOpacity="0.4" />
      <circle cx="170" cy="170" r="1.5" fill="currentColor" fillOpacity="0.4" />
      <circle cx="180" cy="40" r="1" fill="currentColor" fillOpacity="0.3" />
      <circle cx="20" cy="160" r="1" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

export function EmptySalonIllustration({ className, size = "lg" }: IllustrationProps) {
  return (
    <svg
      className={cn(sizeClasses[size], colorClass, className)}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="chatGradient" x1="0" y1="0" x2="200" y2="200">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Speech bubble */}
      <path
        d="M30 50 L170 50 L170 140 L110 140 L100 155 L90 140 L30 140 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="url(#chatGradient)"
      />

      {/* Message lines */}
      <path
        d="M50 75 L130 75 M50 95 L110 95 M50 115 L90 115"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Second bubble (reply) */}
      <path
        d="M60 110 L140 110 L140 150 L100 150 L90 165 L80 150 L60 150 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="5 3"
        fill="none"
        opacity="0.4"
      />

      {/* Floating dots */}
      <circle cx="160" cy="30" r="2" fill="currentColor" fillOpacity="0.3" />
      <circle cx="30" cy="180" r="1.5" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

export function EmptyTicketsIllustration({ className, size = "lg" }: IllustrationProps) {
  return (
    <svg
      className={cn(sizeClasses[size], colorClass, className)}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ticket2Gradient" x1="0" y1="0" x2="200" y2="200">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Stack of tickets */}
      <path
        d="M40 40 L160 40 L160 140 L40 140 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="url(#ticket2Gradient)"
      />
      <path
        d="M45 48 L155 48 L155 132 L45 132 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="5 3"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M50 56 L150 56 L150 124 L50 124 Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
        fill="none"
        opacity="0.2"
      />

      {/* Perforation holes */}
      <circle cx="60" cy="40" r="3" fill="currentColor" fillOpacity="0.4" />
      <circle cx="140" cy="40" r="3" fill="currentColor" fillOpacity="0.4" />
      <circle cx="60" cy="140" r="3" fill="currentColor" fillOpacity="0.3" />
      <circle cx="140" cy="140" r="3" fill="currentColor" fillOpacity="0.3" />

      {/* QR code placeholder */}
      <rect x="70" y="70" width="60" height="60" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M78 85 L92 99 M92 85 L78 99" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <path d="M105 110 L115 120" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />

      {/* Sparkles */}
      <circle cx="25" cy="25" r="1.5" fill="currentColor" fillOpacity="0.4" />
      <circle cx="175" cy="175" r="1.5" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
}

export function EmptyNotificationsIllustration({ className, size = "lg" }: IllustrationProps) {
  return (
    <svg
      className={cn(sizeClasses[size], colorClass, className)}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bellGradient" x1="0" y1="0" x2="200" y2="200">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Bell */}
      <path
        d="M100 35 C100 35 70 35 70 65 C70 95 100 125 100 125 C100 125 130 95 130 65 C130 35 100 35 100 35 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="url(#bellGradient)"
      />
      <path
        d="M90 125 L110 125"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="100" cy="130" r="3" fill="currentColor" fillOpacity="0.5" />

      {/* Zzz / sleeping */}
      <path
        d="M140 45 L155 35 L170 45 L155 35"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M150 30 L165 20 L180 30 L165 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />

      {/* Floating musical notes */}
      <path
        d="M25 80 L25 100 M30 85 L20 85"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M175 80 L175 100 M180 85 L170 85"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  );
}

export function OfflineIllustration({ className, size = "lg" }: IllustrationProps) {
  return (
    <svg
      className={cn(sizeClasses[size], colorClass, className)}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wifiGradient" x1="0" y1="0" x2="200" y2="200">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* WiFi arcs */}
      <path
        d="M100 140 C100 140 40 140 40 80 C40 20 100 20 100 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />
      <path
        d="M100 120 C100 120 60 120 60 60 C60 0 100 0 100 0"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M100 100 C100 100 80 100 80 40 C80 0 100 0 100 0"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />

      {/* Center dot */}
      <circle cx="100" cy="70" r="8" fill="currentColor" fillOpacity="0.2" />
      <circle cx="100" cy="70" r="4" fill="currentColor" />

      {/* Slash */}
      <line
        x1="30"
        y1="170"
        x2="170"
        y2="30"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Floating particles */}
      <circle cx="20" cy="20" r="2" fill="currentColor" fillOpacity="0.3" />
      <circle cx="180" cy="180" r="2" fill="currentColor" fillOpacity="0.3" />
      <circle cx="180" cy="20" r="1.5" fill="currentColor" fillOpacity="0.2" />
      <circle cx="20" cy="180" r="1.5" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

export function ErrorIllustration({ className, size = "lg" }: IllustrationProps) {
  return (
    <svg
      className={cn(sizeClasses[size], "text-error-dark dark:text-error-light", className)}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="errorGradient" x1="0" y1="0" x2="200" y2="200">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Alert triangle */}
      <path
        d="M100 20 L180 160 L20 160 Z"
        stroke="#ef4444"
        strokeWidth="3"
        fill="url(#errorGradient)"
      />

      {/* Exclamation */}
      <path
        d="M100 55 L100 105 M100 115 L100 120"
        stroke="#ef4444"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Floating warning signs */}
      <circle cx="40" cy="40" r="12" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.3" />
      <circle cx="160" cy="160" r="12" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.2" />
    </svg>
  );
}

export function LoadingIllustration({ className, size = "lg" }: IllustrationProps) {
  return (
    <svg
      className={cn(sizeClasses[size], colorClass, className)}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="loadingGradient" x1="0" y1="0" x2="200" y2="200">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Three bouncing dots */}
      <circle cx="60" cy="100" r="12" fill="currentColor" fillOpacity="0.6">
        <animate
          attributeName="opacity"
          values="0.6;1;0.6"
          dur="0.6s"
          repeatCount="indefinite"
          begin="0s"
        />
        <animate
          attributeName="cy"
          values="100;70;100"
          dur="0.6s"
          repeatCount="indefinite"
          begin="0s"
        />
      </circle>
      <circle cx="100" cy="100" r="12" fill="currentColor" fillOpacity="0.6">
        <animate
          attributeName="opacity"
          values="0.6;1;0.6"
          dur="0.6s"
          repeatCount="indefinite"
          begin="0.2s"
        />
        <animate
          attributeName="cy"
          values="100;70;100"
          dur="0.6s"
          repeatCount="indefinite"
          begin="0.2s"
        />
      </circle>
      <circle cx="140" cy="100" r="12" fill="currentColor" fillOpacity="0.6">
        <animate
          attributeName="opacity"
          values="0.6;1;0.6"
          dur="0.6s"
          repeatCount="indefinite"
          begin="0.4s"
        />
        <animate
          attributeName="cy"
          values="100;70;100"
          dur="0.6s"
          repeatCount="indefinite"
          begin="0.4s"
        />
      </circle>

      {/* Floating particles */}
      <circle cx="20" cy="20" r="2" fill="currentColor" fillOpacity="0.3">
        <animate attributeName="cy" values="20;10;20" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="180" cy="180" r="2" fill="currentColor" fillOpacity="0.3">
        <animate attributeName="cy" values="180;170;180" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}