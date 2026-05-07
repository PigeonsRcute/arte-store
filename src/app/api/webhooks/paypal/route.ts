import { type NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paypal";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.text();

  const authAlgo = request.headers.get("paypal-auth-algo") ?? "";
  const certUrl = request.headers.get("paypal-cert-url") ?? "";
  const transmissionId = request.headers.get("paypal-transmission-id") ?? "";
  const transmissionSig = request.headers.get("paypal-transmission-sig") ?? "";
  const transmissionTime =
    request.headers.get("paypal-transmission-time") ?? "";

  let webhookEvent: unknown;
  try {
    webhookEvent = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const isValid = await verifyWebhookSignature({
    authAlgo,
    certUrl,
    transmissionId,
    transmissionSig,
    transmissionTime,
    webhookId: process.env.PAYPAL_WEBHOOK_ID!,
    webhookEvent,
  });

  if (!isValid) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  const event = webhookEvent as {
    event_type: string;
    resource: {
      id: string; // capture ID
      supplementary_data?: {
        related_ids?: { order_id?: string };
      };
    };
  };

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const captureId = event.resource.id;
    const paypalOrderId =
      event.resource.supplementary_data?.related_ids?.order_id;

    if (!paypalOrderId) {
      return NextResponse.json({ error: "no_order_id" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Idempotent: mark order as paid if it exists and isn't already
    await adminSupabase
      .from("orders")
      .update({ status: "paid", paypal_capture_id: captureId })
      .eq("paypal_order_id", paypalOrderId)
      .neq("status", "paid");
  }

  return NextResponse.json({ received: true });
}
