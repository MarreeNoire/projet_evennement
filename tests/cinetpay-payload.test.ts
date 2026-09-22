import { describe, expect, it } from "vitest";

import {
  mapCheckResponse,
  normalizePhoneNumber,
  toAmount,
} from "@/lib/payments/cinetpay-payload";
import { isPaidStatus, normalizePaymentStatus } from "@/lib/payments/types";

/* =============================================================================
   Tests — normalisation des réponses CinetPay et des statuts
   --------------------------------------------------------------------------
   Principe protégé ici : un statut ambigu ne doit JAMAIS être interprété comme
   un paiement réussi. C'est la règle qui empêche de délivrer un billet sans
   encaissement.
   ========================================================================== */

describe("normalisation du numéro de téléphone", () => {
  it("retire les espaces et le préfixe international", () => {
    expect(normalizePhoneNumber("+225 07 08 09 10 11")).toBe("0708091011");
    expect(normalizePhoneNumber("2250708091011")).toBe("0708091011");
  });

  it("conserve un numéro local tel quel", () => {
    expect(normalizePhoneNumber("0708091011")).toBe("0708091011");
  });

  it("supporte les tirets et les parenthèses", () => {
    expect(normalizePhoneNumber("07-08-09-10-11")).toBe("0708091011");
    expect(normalizePhoneNumber("(225) 07 08 09 10 11")).toBe("0708091011");
  });
});

describe("conversion des montants", () => {
  it("arrondit à l'entier : le franc CFA n'a pas de décimales", () => {
    expect(toAmount("10000")).toBe(10000);
    expect(toAmount(9999.6)).toBe(10000);
    expect(toAmount(9999.4)).toBe(9999);
  });

  it("retourne null pour une valeur absente ou invalide", () => {
    expect(toAmount(null)).toBeNull();
    expect(toAmount(undefined)).toBeNull();
    expect(toAmount("")).toBeNull();
    expect(toAmount("abc")).toBeNull();
  });

  it("accepte zéro comme montant valide", () => {
    expect(toAmount(0)).toBe(0);
    expect(toAmount("0")).toBe(0);
  });
});

describe("interprétation du statut", () => {
  it("normalise les libellés d'un prestataire", () => {
    expect(normalizePaymentStatus("ACCEPTED")).toBe("accepted");
    expect(normalizePaymentStatus("success")).toBe("accepted");
    expect(normalizePaymentStatus("PAID")).toBe("accepted");
    expect(normalizePaymentStatus("PENDING")).toBe("pending");
    expect(normalizePaymentStatus("REFUSED")).toBe("refused");
    expect(normalizePaymentStatus("DECLINED")).toBe("refused");
    expect(normalizePaymentStatus("CANCELLED")).toBe("cancelled");
    expect(normalizePaymentStatus("REFUNDED")).toBe("refunded");
  });

  it("traite tout statut inconnu comme une erreur, jamais comme un succès", () => {
    expect(normalizePaymentStatus("BIDULE")).toBe("error");
    expect(normalizePaymentStatus(null)).toBe("error");
    expect(normalizePaymentStatus(undefined)).toBe("error");
    expect(isPaidStatus(normalizePaymentStatus("BIDULE"))).toBe(false);
  });

  it("ne considère comme payé que le statut accepté", () => {
    expect(isPaidStatus("accepted")).toBe(true);
    expect(isPaidStatus("pending")).toBe(false);
    expect(isPaidStatus("refused")).toBe(false);
    expect(isPaidStatus("cancelled")).toBe(false);
    expect(isPaidStatus("error")).toBe(false);
  });
});

describe("mapCheckResponse", () => {
  it("considère le paiement en attente si le code n'est pas 00", () => {
    const result = mapCheckResponse({ code: "600", message: "Transaction introuvable" });
    expect(result.status).toBe("pending");
    expect(result.amount).toBeNull();
  });

  it("considère le paiement en attente si les données sont absentes", () => {
    const result = mapCheckResponse({ code: "00", message: "OK" });
    expect(result.status).toBe("pending");
  });

  it("extrait les informations d'une transaction acceptée", () => {
    const result = mapCheckResponse({
      code: "00",
      message: "OK",
      data: { amount: "10000", currency: "XOF", status: "ACCEPTED", payment_method: "WAVE" },
    });

    expect(result).toEqual({
      status: "accepted",
      amount: 10000,
      currency: "XOF",
      method: "WAVE",
    });
  });

  it("utilise operator_id si payment_method est absent", () => {
    const result = mapCheckResponse({
      code: "00",
      message: "OK",
      data: { status: "ACCEPTED", operator_id: "OMCI" },
    });

    expect(result.method).toBe("OMCI");
  });
});