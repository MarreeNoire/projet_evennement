"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, CheckCircle2, Search, ShieldCheck, XCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/states";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface ScanResult {
  code: string;
  status: "valid" | "already_used" | "invalid";
  holderName?: string;
  ticketType?: string;
  message?: string;
}

export interface CheckInEvent {
  id: string;
  title: string;
  start_at: string;
  city: string;
}

type DetectedBarcode = { rawValue: string };
type QrDetector = { detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]> };
type QrDetectorConstructor = new (options: { formats: string[] }) => QrDetector;

export function OrgCheckInScanner({ events }: { events: CheckInEvent[] }) {
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<QrDetector | null>(null);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    detectorRef.current = null;
    setScanning(false);
  }

  const validateTicket = useCallback(async (inputCode: string) => {
    const targetCode = inputCode.trim();
    if (!eventId) {
      setError("Sélectionnez d’abord l’événement contrôlé.");
      return;
    }
    if (!targetCode) {
      setError("Scannez le QR code ou saisissez la référence du billet.");
      return;
    }

    setError(null);
    setPending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: rpcError } = await supabase.rpc("perform_check_in", {
        p_event_id: eventId,
        p_code: targetCode,
      });
      if (rpcError) throw rpcError;

      const item = data?.[0];
      if (!item) throw new Error("Le contrôle n’a retourné aucun résultat.");
      setLastResult({
        code: targetCode,
        status: item.result === "valid" ? "valid" : item.result === "already_used" ? "already_used" : "invalid",
        holderName: item.holder_name ?? undefined,
        ticketType: item.ticket_type_name ?? undefined,
        message: item.message ?? undefined,
      });
      setCode("");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Le contrôle du billet a échoué.";
      setError(
        message.includes("42501") || message.toLowerCase().includes("autorisé")
          ? "Votre compte n’est pas autorisé à contrôler cet événement. Demandez à l’organisateur de vous attribuer le rôle Agent de contrôle."
          : "Impossible de vérifier ce billet. Vérifiez la connexion puis réessayez.",
      );
    } finally {
      setPending(false);
    }
  }, [eventId]);

  async function startCamera() {
    setError(null);
    const Detector = (window as Window & { BarcodeDetector?: QrDetectorConstructor }).BarcodeDetector;
    if (!Detector) {
      setError("Le scan caméra n’est pas pris en charge par ce navigateur. Saisissez la référence du billet.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("La caméra est inaccessible. Ouvrez l’application en HTTPS ou saisissez la référence du billet.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      detectorRef.current = new Detector({ formats: ["qr_code"] });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
    } catch {
      stopCamera();
      setError("La caméra n’a pas pu démarrer. Autorisez son accès ou saisissez la référence du billet.");
    }
  }

  useEffect(() => {
    if (!scanning) return;
    let active = true;
    const poll = async () => {
      const video = videoRef.current;
      const detector = detectorRef.current;
      if (active && video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && detector) {
        try {
          const [barcode] = await detector.detect(video);
          if (barcode?.rawValue) {
            active = false;
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            detectorRef.current = null;
            setScanning(false);
            void validateTicket(barcode.rawValue);
            return;
          }
        } catch {
          // Une frame illisible est normale pendant le déplacement du téléphone.
        }
      }
      if (active) window.setTimeout(poll, 250);
    };
    void poll();
    return () => {
      active = false;
    };
  }, [scanning, validateTicket]);

  return (
    <div className="space-y-6">
      {events.length === 0 ? (
        <Alert tone="warning" title="Aucun événement disponible">
          Les événements annulés ne peuvent pas être contrôlés. Vous devez être propriétaire, gestionnaire ou agent de contrôle d’une organisation.
        </Alert>
      ) : (
        <>
          {error ? <Alert tone="danger" title="Contrôle impossible" floating onDismiss={() => setError(null)}>{error}</Alert> : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Événement à contrôler</CardTitle>
              <CardDescription>Chaque billet est vérifié et enregistré pour l’événement sélectionné.</CardDescription>
            </CardHeader>
            <CardContent>
              <label htmlFor="check-in-event" className="sr-only">Événement à contrôler</label>
              <select
                id="check-in-event"
                value={eventId}
                onChange={(event) => {
                  setEventId(event.target.value);
                  setLastResult(null);
                  if (scanning) stopCamera();
                }}
                className="min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} · {new Date(event.start_at).toLocaleDateString("fr-FR")} · {event.city}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="flex flex-col items-center space-y-4 p-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary-subtle text-primary">
                <Camera className="size-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-fg">Scanner le QR code</h2>
                <p className="mt-1 text-xs text-fg-muted">La caméra arrière lit le QR personnel du billet.</p>
              </div>
              <video ref={videoRef} className={scanning ? "aspect-video w-full rounded-md bg-black object-cover" : "hidden"} muted playsInline />
              <Button onClick={scanning ? stopCamera : startCamera} variant={scanning ? "secondary" : "primary"} className="w-full" disabled={!eventId || pending}>
                {scanning ? "Arrêter le scanner" : "Démarrer le scanner QR"}
              </Button>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Saisie manuelle</CardTitle>
                <CardDescription>Utilisez la référence imprimée si la caméra est indisponible.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(event) => { event.preventDefault(); void validateTicket(code); }} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="ticketCode" className="text-xs font-semibold text-fg">Référence du billet</label>
                    <input
                      id="ticketCode"
                      type="text"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="ex. TCK-AB12CD34EF"
                      autoComplete="off"
                      className="w-full rounded-md border border-border bg-transparent px-3 py-2 font-mono text-sm uppercase focus:border-border-focus focus:outline-none"
                    />
                  </div>
                  <Button type="submit" variant="secondary" className="w-full" loading={pending} loadingLabel="Vérification…" disabled={!eventId}>
                    <Search className="mr-2 size-4" /> Vérifier le billet
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {lastResult ? (
            <Card className={lastResult.status === "valid" ? "border-success/30 bg-success-subtle/30" : lastResult.status === "already_used" ? "border-warning/30 bg-warning-subtle/30" : "border-danger/30 bg-danger-subtle/30"}>
              <CardContent className="flex items-center gap-3 p-4">
                {lastResult.status === "valid" ? <CheckCircle2 className="size-6 shrink-0 text-success" /> : lastResult.status === "already_used" ? <AlertCircle className="size-6 shrink-0 text-warning" /> : <XCircle className="size-6 shrink-0 text-danger" />}
                <div>
                  <p className="text-sm font-bold text-fg">{lastResult.status === "valid" ? "Billet accepté" : lastResult.status === "already_used" ? "Billet déjà utilisé" : "Billet refusé"} · {lastResult.code}</p>
                  <p className="text-xs text-fg-muted">
                    {[lastResult.holderName, lastResult.ticketType, lastResult.message].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}
          <p className="flex items-center gap-2 text-xs text-fg-subtle">
            <ShieldCheck className="size-4 shrink-0" /> Un scan accepté marque le billet comme utilisé. Un deuxième passage est refusé et journalisé.
          </p>
        </>
      )}
    </div>
  );
}
