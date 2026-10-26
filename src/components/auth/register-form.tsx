"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Eye, EyeOff, Search } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import { Alert } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Field, Input, fieldAriaProps } from "@/components/ui/field";
import { ROUTES } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";

const PHONE_COUNTRIES = [
  { region: "CI", name: "Côte d’Ivoire", code: "225" },
  { region: "SN", name: "Sénégal", code: "221" },
  { region: "BF", name: "Burkina Faso", code: "226" },
  { region: "ML", name: "Mali", code: "223" },
  { region: "TG", name: "Togo", code: "228" },
  { region: "BJ", name: "Bénin", code: "229" },
  { region: "GN", name: "Guinée", code: "224" },
  { region: "CM", name: "Cameroun", code: "237" },
  { region: "CD", name: "RD Congo", code: "243" },
  { region: "CG", name: "Congo", code: "242" },
  { region: "GA", name: "Gabon", code: "241" },
  { region: "NE", name: "Niger", code: "227" },
  { region: "NG", name: "Nigeria", code: "234" },
  { region: "GH", name: "Ghana", code: "233" },
  { region: "KE", name: "Kenya", code: "254" },
  { region: "ZA", name: "Afrique du Sud", code: "27" },
  { region: "MA", name: "Maroc", code: "212" },
  { region: "DZ", name: "Algérie", code: "213" },
  { region: "TN", name: "Tunisie", code: "216" },
  { region: "FR", name: "France", code: "33" },
  { region: "BE", name: "Belgique", code: "32" },
  { region: "CH", name: "Suisse", code: "41" },
  { region: "CA", name: "Canada", code: "1" },
  { region: "US", name: "États-Unis", code: "1" },
  { region: "GB", name: "Royaume-Uni", code: "44" },
  { region: "DE", name: "Allemagne", code: "49" },
  { region: "ES", name: "Espagne", code: "34" },
  { region: "IT", name: "Italie", code: "39" },
] as const;

function CountryFlag({ region }: { region: string }) {
  const star =
    "M12 2.2 13.45 6.8l4.85.02-3.9 2.86 1.48 4.62L12 11.43l-3.88 2.87 1.48-4.62-3.9-2.86 4.85-.02L12 2.2Z";
  let artwork: React.ReactNode;

  switch (region) {
    case "CI":
      artwork = (
        <>
          <rect width="8" height="16" fill="#f77f00" />
          <rect x="8" width="8" height="16" fill="#fff" />
          <rect x="16" width="8" height="16" fill="#009e60" />
        </>
      );
      break;
    case "SN":
      artwork = (
        <>
          <rect width="8" height="16" fill="#00853f" />
          <rect x="8" width="8" height="16" fill="#fdef42" />
          <rect x="16" width="8" height="16" fill="#e31b23" />
          <path d={star} fill="#00853f" />
        </>
      );
      break;
    case "BF":
      artwork = (
        <>
          <rect width="24" height="8" fill="#ef2b2d" />
          <rect y="8" width="24" height="8" fill="#009e49" />
          <path d={star} fill="#fcd116" />
        </>
      );
      break;
    case "ML":
      artwork = (
        <>
          <rect width="8" height="16" fill="#14b53a" />
          <rect x="8" width="8" height="16" fill="#fcd116" />
          <rect x="16" width="8" height="16" fill="#ce1126" />
        </>
      );
      break;
    case "TG":
      artwork = (
        <>
          <rect width="24" height="16" fill="#006a4e" />
          <path d="M0 3.2h24v2H0zm0 4h24v2H0zm0 4h24v2H0z" fill="#ffce00" />
          <path d="M0 0h9v7H0z" fill="#d21034" />
          <path d={star} fill="#fff" />
        </>
      );
      break;
    case "BJ":
      artwork = (
        <>
          <rect width="24" height="16" fill="#e8112d" />
          <rect width="14" height="8" fill="#fcd116" />
          <rect width="10" height="16" fill="#008751" />
        </>
      );
      break;
    case "GN":
      artwork = (
        <>
          <rect width="8" height="16" fill="#ce1126" />
          <rect x="8" width="8" height="16" fill="#fcd116" />
          <rect x="16" width="8" height="16" fill="#009460" />
        </>
      );
      break;
    case "CM":
      artwork = (
        <>
          <rect width="8" height="16" fill="#007a5e" />
          <rect x="8" width="8" height="16" fill="#ce1126" />
          <rect x="16" width="8" height="16" fill="#fcd116" />
          <path d={star} fill="#fcd116" />
        </>
      );
      break;
    case "CD":
      artwork = (
        <>
          <rect width="24" height="16" fill="#007fff" />
          <path d="M-2 15 15-2h6L4 17z" fill="#f7d618" />
          <path d="M-1 16 16-1h3L2 17z" fill="#ce1021" />
          <path
            d="m5 2 1 2.5 2.6.1-2.1 1.5.8 2.5L5 7.1 2.7 8.6l.8-2.5-2.1-1.5L4 4.5z"
            fill="#f7d618"
          />
        </>
      );
      break;
    case "CG":
      artwork = (
        <>
          <rect width="24" height="16" fill="#009543" />
          <path d="M24 0v16H0z" fill="#dc241f" />
          <path d="M0 0h24L0 16z" fill="#fbde4a" />
        </>
      );
      break;
    case "GA":
      artwork = (
        <>
          <rect width="24" height="5.34" fill="#009e60" />
          <rect y="5.33" width="24" height="5.34" fill="#fcd116" />
          <rect y="10.66" width="24" height="5.34" fill="#3a75c4" />
        </>
      );
      break;
    case "NE":
      artwork = (
        <>
          <rect width="24" height="5.33" fill="#e05206" />
          <rect y="5.33" width="24" height="5.34" fill="#fff" />
          <rect y="10.67" width="24" height="5.33" fill="#0db02b" />
          <circle cx="12" cy="8" r="2.2" fill="#e05206" />
        </>
      );
      break;
    case "NG":
      artwork = (
        <>
          <rect width="8" height="16" fill="#008751" />
          <rect x="8" width="8" height="16" fill="#fff" />
          <rect x="16" width="8" height="16" fill="#008751" />
        </>
      );
      break;
    case "GH":
      artwork = (
        <>
          <rect width="24" height="5.33" fill="#ce1126" />
          <rect y="5.33" width="24" height="5.34" fill="#fcd116" />
          <rect y="10.67" width="24" height="5.33" fill="#006b3f" />
          <path d={star} fill="#000" />
        </>
      );
      break;
    case "KE":
      artwork = (
        <>
          <rect width="24" height="4.5" fill="#000" />
          <rect y="4.5" width="24" height="1.4" fill="#fff" />
          <rect y="5.9" width="24" height="4.2" fill="#bb0000" />
          <rect y="10.1" width="24" height="1.4" fill="#fff" />
          <rect y="11.5" width="24" height="4.5" fill="#006600" />
          <ellipse cx="12" cy="8" rx="2.2" ry="4.4" fill="#fff" />
          <ellipse cx="12" cy="8" rx="1.2" ry="4.1" fill="#bb0000" />
        </>
      );
      break;
    case "ZA":
      artwork = (
        <>
          <rect width="24" height="8" fill="#de3831" />
          <rect y="8" width="24" height="8" fill="#002395" />
          <path d="M0 0 12 8 0 16z" fill="#000" />
          <path d="M0 0 12 8 0 16" fill="none" stroke="#ffb81c" strokeWidth="4" />
          <path d="M0 0 11 8H24M0 16 11 8" fill="none" stroke="#fff" strokeWidth="4" />
          <path d="M0 0 10 8H24M0 16 10 8" fill="none" stroke="#007a4d" strokeWidth="2.3" />
        </>
      );
      break;
    case "MA":
      artwork = (
        <>
          <rect width="24" height="16" fill="#c1272d" />
          <path d={star} fill="none" stroke="#006233" strokeWidth=".7" />
        </>
      );
      break;
    case "DZ":
      artwork = (
        <>
          <rect width="12" height="16" fill="#006633" />
          <rect x="12" width="12" height="16" fill="#fff" />
          <path d="M15.8 4.2a4 4 0 1 0 0 7.6 4.6 4.6 0 1 1 0-7.6Z" fill="#d21034" />
          <path d={star} fill="#d21034" />
        </>
      );
      break;
    case "TN":
      artwork = (
        <>
          <rect width="24" height="16" fill="#e70013" />
          <circle cx="12" cy="8" r="5" fill="#fff" />
          <path d="M13 4.7a3.3 3.3 0 1 0 0 6.6 3.8 3.8 0 1 1 0-6.6Z" fill="#e70013" />
          <path
            d="m13.4 5.8 1 1.6 1.9.1-1.5 1.1.6 1.8-1.6-1.1-1.6 1.1.6-1.8-1.5-1.1 1.9-.1z"
            fill="#e70013"
          />
        </>
      );
      break;
    case "FR":
      artwork = (
        <>
          <rect width="8" height="16" fill="#002395" />
          <rect x="8" width="8" height="16" fill="#fff" />
          <rect x="16" width="8" height="16" fill="#ed2939" />
        </>
      );
      break;
    case "BE":
      artwork = (
        <>
          <rect width="8" height="16" fill="#000" />
          <rect x="8" width="8" height="16" fill="#fae042" />
          <rect x="16" width="8" height="16" fill="#ed2939" />
        </>
      );
      break;
    case "CH":
      artwork = (
        <>
          <rect width="24" height="16" fill="#d52b1e" />
          <path d="M10 3h4v4.5h4.5v4H14V16h-4v-4.5H5.5v-4H10z" fill="#fff" />
        </>
      );
      break;
    case "CA":
      artwork = (
        <>
          <rect width="5" height="16" fill="#d80621" />
          <rect x="5" width="14" height="16" fill="#fff" />
          <rect x="19" width="5" height="16" fill="#d80621" />
          <path
            d="m12 3 .9 2.1 1.6-.5-.8 1.7 1.4 1-.9.8.4 3.2-1.5-.9-1.1 2-1.1-2-1.5.9.4-3.2-.9-.8 1.4-1-.8-1.7 1.6.5z"
            fill="#d80621"
          />
        </>
      );
      break;
    case "US":
      artwork = (
        <>
          <rect width="24" height="16" fill="#fff" />
          {[0, 2.45, 4.9, 7.35, 9.8, 12.25, 14.7].map((y) => (
            <rect key={y} y={y} width="24" height="1.23" fill="#b22234" />
          ))}
          <rect width="10.5" height="8.6" fill="#3c3b6e" />
          <path
            d="m5.25 1.3.7 1.4 1.5.2-1.1 1 .3 1.5-1.4-.7-1.4.7.3-1.5-1.1-1 1.5-.2z"
            fill="#fff"
          />
        </>
      );
      break;
    case "GB":
      artwork = (
        <>
          <rect width="24" height="16" fill="#012169" />
          <path d="m0 0 24 16M24 0 0 16" stroke="#fff" strokeWidth="4" />
          <path d="m0 0 24 16M24 0 0 16" stroke="#c8102e" strokeWidth="1.5" />
          <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="6" />
          <path d="M12 0v16M0 8h24" stroke="#c8102e" strokeWidth="3" />
        </>
      );
      break;
    case "DE":
      artwork = (
        <>
          <rect width="24" height="5.33" fill="#000" />
          <rect y="5.33" width="24" height="5.34" fill="#d00" />
          <rect y="10.67" width="24" height="5.33" fill="#ffce00" />
        </>
      );
      break;
    case "ES":
      artwork = (
        <>
          <rect width="24" height="4" fill="#aa151b" />
          <rect y="4" width="24" height="8" fill="#f1bf00" />
          <rect y="12" width="24" height="4" fill="#aa151b" />
        </>
      );
      break;
    case "IT":
      artwork = (
        <>
          <rect width="8" height="16" fill="#009246" />
          <rect x="8" width="8" height="16" fill="#fff" />
          <rect x="16" width="8" height="16" fill="#ce2b37" />
        </>
      );
      break;
    default:
      artwork = (
        <>
          <rect width="8" height="16" fill="#888" />
          <rect x="8" width="8" height="16" fill="#fff" />
          <rect x="16" width="8" height="16" fill="#888" />
        </>
      );
  }

  return (
    <svg
      aria-hidden="true"
      className="size-5 shrink-0 overflow-hidden rounded-[2px] border border-black/10 shadow-sm"
      viewBox="0 0 24 16"
      focusable="false"
    >
      {artwork}
    </svg>
  );
}

function findPhoneCountry(digits: string) {
  return [...PHONE_COUNTRIES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((country) => digits.startsWith(country.code));
}

/* Inscription : crée le compte Auth + profil public, gère la confirmation. */

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState<(typeof PHONE_COUNTRIES)[number]>(
    PHONE_COUNTRIES[0],
  );
  const [phoneInput, setPhoneInput] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const countryPickerRef = useRef<HTMLDetailsElement>(null);
  const countrySearchRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const filteredPhoneCountries = [...PHONE_COUNTRIES]
    .sort((a, b) => a.name.localeCompare(b.name, "fr"))
    .filter((country) => {
      const query = countrySearch.trim().toLocaleLowerCase("fr");
      return (
        !query ||
        `${country.name} ${country.region} +${country.code}`.toLocaleLowerCase("fr").includes(query)
      );
    });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false as unknown as true,
    },
  });

  useEffect(() => {
    const region = navigator.language.match(/-([A-Za-z]{2})(?:-|$)/)?.[1]?.toUpperCase();
    const detectedCountry = PHONE_COUNTRIES.find((country) => country.region === region);
    if (detectedCountry) {
      const timeout = window.setTimeout(() => setPhoneCountry(detectedCountry), 0);
      return () => window.clearTimeout(timeout);
    }
  }, []);

  function handlePhoneInput(value: string, onChange: (phone: string) => void) {
    setPhoneInput(value);
    const trimmed = value.trim();
    const isInternational = trimmed.startsWith("+") || trimmed.startsWith("00");
    if (isInternational) {
      const digits = trimmed.replace(/\D/g, "");
      const internationalDigits = trimmed.startsWith("00") ? digits.slice(2) : digits;
      const detectedCountry = findPhoneCountry(internationalDigits);
      if (detectedCountry) {
        setPhoneCountry(detectedCountry);
        setPhoneInput(internationalDigits.slice(detectedCountry.code.length));
      }
      onChange(`+${internationalDigits}`);
      return;
    }

    const digits = trimmed.replace(/\D/g, "");
    const nationalDigits = phoneCountry.region === "CI" ? digits : digits.replace(/^0/, "");
    const international = nationalDigits ? `+${phoneCountry.code}${nationalDigits}` : "";
    onChange(international);
  }

  function setPhoneValue(value: string, digitCount: number) {
    if (digitCount < 8) clearErrors("phone");
    setValue("phone", value, {
      shouldValidate: digitCount >= 8,
      shouldDirty: true,
    });
  }

  function handlePhoneCountryChange(region: string) {
    const selectedCountry = PHONE_COUNTRIES.find((country) => country.region === region);
    if (!selectedCountry) return;
    setPhoneCountry(selectedCountry);
    const digits = phoneInput.replace(/\D/g, "");
    const nationalDigits = selectedCountry.region === "CI" ? digits : digits.replace(/^0/, "");
    const international = nationalDigits ? `+${selectedCountry.code}${nationalDigits}` : "";
    if (digits.length === 0) clearErrors("phone");
    setPhoneValue(international, selectedCountry.code.length + nationalDigits.length);
  }

  function closeCountryPicker() {
    if (countryPickerRef.current) countryPickerRef.current.open = false;
    setCountrySearch("");
  }

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { display_name: values.displayName.trim(), phone: values.phone.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setServerError(
          /already registered|already exists|duplicate/i.test(error.message)
            ? "Un compte existe déjà avec cet email. Connecte-toi ou réinitialise ton mot de passe."
            : "Inscription impossible pour le moment. Réessaie dans un instant.",
        );
        return;
      }

      if (data.user && !data.session) {
        setEmailSent(values.email);
        return;
      }

      router.push(ROUTES.home);
      router.refresh();
    });
  });

  if (emailSent) {
    return (
      <Alert tone="success" title="Vérifie ta boîte email">
        Un lien de confirmation a été envoyé à <strong>{emailSent}</strong>. Clique dessus pour
        activer ton compte, puis connecte-toi.
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {serverError ? (
        <Alert tone="danger" title="Inscription impossible">
          {serverError}
        </Alert>
      ) : null}

      <Field
        label="Nom d'affichage"
        htmlFor="displayName"
        required
        hint="Visible par les autres participants"
        error={errors.displayName?.message}
      >
        <Input
          id="displayName"
          autoComplete="nickname"
          placeholder="Koffi A."
          invalid={Boolean(errors.displayName)}
          {...fieldAriaProps("displayName", { error: errors.displayName?.message })}
          {...register("displayName")}
        />
      </Field>

      <Field label="Adresse email" htmlFor="email" required error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="koffi@example.ci"
          invalid={Boolean(errors.email)}
          {...fieldAriaProps("email", { error: errors.email?.message })}
          {...register("email")}
        />
      </Field>

      <Field
        label="Numéro de téléphone"
        htmlFor="phone"
        required
        hint="Indicatif prérempli selon ta région"
        description="Utilisé pour préremplir tes achats de billets. Il reste privé."
        error={errors.phone?.message}
      >
        <div className="grid grid-cols-[6.75rem_minmax(0,1fr)] gap-2 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
          <details
            ref={countryPickerRef}
            className="group relative min-w-0"
            onToggle={(event) => {
              if (event.currentTarget.open) {
                window.setTimeout(() => countrySearchRef.current?.focus(), 0);
              } else {
                setCountrySearch("");
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                closeCountryPicker();
                event.currentTarget.querySelector("summary")?.focus();
              }
            }}
          >
            <summary
              aria-label={`Choisir un pays et son indicatif. Pays actuel : ${phoneCountry.name}, +${phoneCountry.code}`}
              className="border-border-strong bg-surface text-fg focus-visible:ring-border-focus hover:border-border flex h-11 cursor-pointer list-none items-center justify-between gap-1 rounded-md border px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden"
            >
              <span className="flex min-w-0 items-center gap-1.5 tabular-nums">
                <CountryFlag region={phoneCountry.region} />
                <span>+{phoneCountry.code}</span>
              </span>
              <ChevronDown
                className="text-fg-muted size-4 shrink-0 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="border-border-strong bg-surface absolute top-[calc(100%+0.35rem)] left-0 z-30 w-[min(19rem,calc(100vw-3rem))] overflow-hidden rounded-sm border shadow-md">
              <label className="border-border flex items-center gap-2 border-b px-3">
                <Search className="text-fg-muted size-4 shrink-0" aria-hidden="true" />
                <input
                  ref={countrySearchRef}
                  type="search"
                  autoComplete="off"
                  value={countrySearch}
                  onChange={(event) => setCountrySearch(event.target.value)}
                  placeholder="Rechercher un pays ou un indicatif"
                  aria-label="Rechercher un pays ou un indicatif"
                  className="text-fg placeholder:text-fg-subtle h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </label>
              <ul className="max-h-60 overflow-y-auto p-1" aria-label="Pays et indicatifs">
                {filteredPhoneCountries.length ? (
                  filteredPhoneCountries.map((country) => {
                    const selected = phoneCountry.region === country.region;
                    return (
                      <li key={country.region}>
                        <button
                          type="button"
                          aria-current={selected ? "true" : undefined}
                          onClick={() => {
                            handlePhoneCountryChange(country.region);
                            closeCountryPicker();
                          }}
                          className="hover:bg-bg-muted focus-visible:bg-bg-muted flex min-h-10 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm focus-visible:outline-none"
                        >
                          <CountryFlag region={country.region} />
                          <span className="min-w-0 flex-1 truncate">{country.name}</span>
                          <span className="text-fg-muted tabular-nums">+{country.code}</span>
                          {selected ? (
                            <Check className="text-primary size-4" aria-hidden="true" />
                          ) : null}
                        </button>
                      </li>
                    );
                  })
                ) : (
                  <li className="text-fg-muted px-3 py-4 text-center text-sm">
                    Aucun pays ne correspond à cette recherche.
                  </li>
                )}
              </ul>
            </div>
          </details>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Input
                id="phone"
                ref={field.ref}
                name={field.name}
                type="tel"
                autoComplete="tel-national"
                inputMode="tel"
                placeholder={
                  phoneCountry.region === "CI" ? "07 00 00 00 00" : "Numéro de téléphone"
                }
                value={phoneInput}
                invalid={Boolean(errors.phone)}
                {...fieldAriaProps("phone", {
                  error: errors.phone?.message,
                  description: "Utilisé pour préremplir tes achats de billets. Il reste privé.",
                })}
                onBlur={field.onBlur}
                onChange={(event) => handlePhoneInput(event.target.value, field.onChange)}
              />
            )}
          />
        </div>
      </Field>

      <Field
        label="Mot de passe"
        htmlFor="password"
        required
        hint="8 caractères min., 1 lettre + 1 chiffre"
        error={errors.password?.message}
      >
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className="pr-12"
            invalid={Boolean(errors.password)}
            {...fieldAriaProps("password", { error: errors.password?.message })}
            {...register("password")}
          />
          <button
            type="button"
            className="text-fg-muted hover:text-fg focus-visible:ring-border-focus absolute inset-y-0 right-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm focus-visible:ring-2 focus-visible:outline-none"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </Field>

      <Field
        label="Confirmer le mot de passe"
        htmlFor="confirmPassword"
        required
        error={errors.confirmPassword?.message}
      >
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className="pr-12"
            invalid={Boolean(errors.confirmPassword)}
            {...fieldAriaProps("confirmPassword", { error: errors.confirmPassword?.message })}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            className="text-fg-muted hover:text-fg focus-visible:ring-border-focus absolute inset-y-0 right-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm focus-visible:ring-2 focus-visible:outline-none"
            aria-label={
              showConfirmPassword
                ? "Masquer la confirmation du mot de passe"
                : "Afficher la confirmation du mot de passe"
            }
            aria-pressed={showConfirmPassword}
            onClick={() => setShowConfirmPassword((visible) => !visible)}
          >
            {showConfirmPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </Field>

      <div>
        <label className="text-fg-muted flex cursor-pointer items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-[var(--color-primary-solid)]"
            {...register("acceptTerms")}
          />
          <span>
            J&apos;accepte les{" "}
            <Link href="/cgu" className="text-primary font-medium hover:underline">
              conditions d&apos;utilisation
            </Link>{" "}
            et la{" "}
            <Link href="/confidentialite" className="text-primary font-medium hover:underline">
              politique de confidentialité
            </Link>
            .
          </span>
        </label>
        {errors.acceptTerms ? (
          <p role="alert" className="text-danger mt-1.5 text-xs">
            {errors.acceptTerms.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" loading={pending} loadingLabel="Création du compte…" fullWidth>
        Créer mon compte
      </Button>
    </form>
  );
}
