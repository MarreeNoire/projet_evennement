import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  computeCinetPaySignature,
  extractOrderReference,
  isCinetPaySignatureValid,
  splitCustomerName,
} from "@/lib/payments/cinetpay-signature";

/* =============================================================================
   Tests — signature et charge utile CinetPay
   --------------------------------------------------------------------------
   Ces tests protègent le point où une erreur ouvre une faille : si la
   vérification de signature est trop permissive, une notification forgée
   pourrait faire croire à un paiement.
   ========================================================================== */

const SECRET = "cle-de-test-secret";

/** Champs représentatifs d'une notification CinetPay réussie. */
const FIELDS = {
  cpm_site_id: "123456",
  cpm_trans_id: "CMD-8F3K2P",
  cpm_trans_date: "2026-09-21 10:32:15",
  cpm_amount: "10000",
  cpm_currency: "XOF",
  cpm_payid: "PAY-998877",
  cpm_payment_config: "MOBILE_MONEY",
  cpm_page_action: "PAYMENT",
  cpm_version: "V2",
};

describe("signature CinetPay", () => {
  it("est indépendante de l'ordre des clés de l'objet", () => {
    const reordered = {
      cpm_version: FIELDS.cpm_version,
      cpm_site_id: FIELDS.cpm_site_id,
      cpm_amount: FIELDS.cpm_amount,
      cpm_trans_id: FIELDS.cpm_trans_id,
      cpm_trans_date: FIELDS.cpm_trans_date,
      cpm_currency: FIELDS.cpm_currency,
      cpm_payid: FIELDS.cpm_payid,
      cpm_payment_config: FIELDS.cpm_payment_config,
      cpm_page_action: FIELDS.cpm_page_action,
    };

    expect(computeCinetPaySignature(reordered, SECRET)).toBe(
      computeCinetPaySignature(FIELDS, SECRET),
    );
  });

  it("reproduit l'algorithme documenté (HMAC-SHA256 de la concaténation)", () => {
    const concatenated =
      "123456" +
      "CMD-8F3K2P" +
      "2026-09-21 10:32:15" +
      "10000" +
      "XOF" +
      "PAY-998877" +
      "MOBILE_MONEY" +
      "PAYMENT" +
      "V2";

    const expected = createHmac("sha256", SECRET).update(concatenated, "utf8").digest("hex");

    expect(computeCinetPaySignature(FIELDS, SECRET)).toBe(expected);
  });

  it("accepte une signature valide, quelle que soit la casse", () => {
    const signature = computeCinetPaySignature(FIELDS, SECRET);
    expect(isCinetPaySignatureValid(FIELDS, signature, SECRET)).toBe(true);
    expect(isCinetPaySignatureValid(FIELDS, signature.toUpperCase(), SECRET)).toBe(true);
  });

  it("rejette une signature absente, vide ou de mauvaise longueur", () => {
    expect(isCinetPaySignatureValid(FIELDS, undefined, SECRET)).toBe(false);
    expect(isCinetPaySignatureValid(FIELDS, "", SECRET)).toBe(false);
    expect(isCinetPaySignatureValid(FIELDS, "abcd", SECRET)).toBe(false);
  });

  it("rejette une signature forgée", () => {
    expect(isCinetPaySignatureValid(FIELDS, "a".repeat(64), SECRET)).toBe(false);
  });

  it("rejette toute signature lorsqu'aucun secret n'est configuré", () => {
    const signature = computeCinetPaySignature(FIELDS, SECRET);
    expect(isCinetPaySignatureValid(FIELDS, signature, "")).toBe(false);
  });

  it("détecte la falsification du montant", () => {
    const signature = computeCinetPaySignature(FIELDS, SECRET);
    const tampered = { ...FIELDS, cpm_amount: "1" };
    expect(isCinetPaySignatureValid(tampered, signature, SECRET)).toBe(false);
  });

  it("détecte la falsification de l'identifiant de transaction", () => {
    const signature = computeCinetPaySignature(FIELDS, SECRET);
    const tampered = { ...FIELDS, cpm_trans_id: "CMD-AUTRE" };
    expect(isCinetPaySignatureValid(tampered, signature, SECRET)).toBe(false);
  });
});

describe("extractOrderReference", () => {
  it("extrait la référence depuis le JSON de cpm_custom", () => {
    expect(extractOrderReference(JSON.stringify({ order_reference: "CMD-8F3K2P" }))).toBe(
      "CMD-8F3K2P",
    );
  });

  it("retourne null si la valeur est absente ou illisible", () => {
    expect(extractOrderReference(undefined)).toBeNull();
    expect(extractOrderReference("")).toBeNull();
    expect(extractOrderReference("pas-du-json")).toBeNull();
    expect(extractOrderReference(JSON.stringify({ autre: "valeur" }))).toBeNull();
  });
});

describe("splitCustomerName", () => {
  it("sépare le prénom du nom", () => {
    expect(splitCustomerName("Koffi Atta")).toEqual({ name: "Koffi", surname: "Atta" });
  });

  it("gère un nom composé", () => {
    expect(splitCustomerName("Aya Marie Koné")).toEqual({
      name: "Aya",
      surname: "Marie Koné",
    });
  });

  it("gère un nom unique et l'absence de nom", () => {
    expect(splitCustomerName("Koffi")).toEqual({ name: "Koffi", surname: undefined });
    expect(splitCustomerName(undefined)).toEqual({});
    expect(splitCustomerName("   ")).toEqual({});
  });
});