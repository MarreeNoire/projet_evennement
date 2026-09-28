import { CinetPayProvider } from "@/lib/payments/cinetpay";
import { handlePaymentWebhook } from "@/lib/payments/webhook-handler";

export async function POST(request: Request) {
  return handlePaymentWebhook(request, new CinetPayProvider());
}
