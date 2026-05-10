const PAYPAL_BASE =
  process.env.NODE_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal auth failed: ${data.error_description}`);
  return data.access_token as string;
}

export type PayPalOrderItem = {
  name: string;
  quantity: number;
  unitPriceCents: number;
};

function fmtPayPal(amount: number, decimals: 0 | 2): string {
  return decimals === 0 ? String(Math.round(amount)) : amount.toFixed(2);
}

export async function createPayPalOrder(params: {
  subtotalCents: number;
  shippingCents: number;
  items: PayPalOrderItem[];
  returnUrl: string;
  cancelUrl: string;
  currency: { code: string; decimals: 0 | 2; rate: number };
}): Promise<{ id: string; approvalUrl: string; chargedAmount: number }> {
  const token = await getAccessToken();

  const { code, decimals, rate } = params.currency;

  const subtotalConverted = (params.subtotalCents / 100) * rate;
  const shippingConverted = (params.shippingCents / 100) * rate;
  const totalConverted = subtotalConverted + shippingConverted;

  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: code,
          value: fmtPayPal(totalConverted, decimals),
          breakdown: {
            item_total: {
              currency_code: code,
              value: fmtPayPal(subtotalConverted, decimals),
            },
            shipping: {
              currency_code: code,
              value: fmtPayPal(shippingConverted, decimals),
            },
          },
        },
        items: params.items.map((item) => ({
          name: item.name,
          quantity: String(item.quantity),
          unit_amount: {
            currency_code: code,
            value: fmtPayPal((item.unitPriceCents / 100) * rate, decimals),
          },
          category: "PHYSICAL_GOODS",
        })),
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          return_url: params.returnUrl,
          cancel_url: params.cancelUrl,
          landing_page: "LOGIN",
          user_action: "PAY_NOW",
          shipping_preference: "GET_FROM_FILE",
        },
      },
    },
  };

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal create order failed: ${data.message}`);

  const approvalUrl = data.links?.find(
    (l: { rel: string; href: string }) => l.rel === "payer-action",
  )?.href;

  if (!approvalUrl) throw new Error("No approval URL in PayPal response");

  const chargedAmount = decimals === 0 ? Math.round(totalConverted) : totalConverted;

  return { id: data.id as string, approvalUrl: approvalUrl as string, chargedAmount };
}

export async function capturePayPalOrder(paypalOrderId: string): Promise<{
  id: string;
  captureId: string;
  status: string;
}> {
  const token = await getAccessToken();

  const res = await fetch(
    `${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal capture failed: ${data.message}`);

  const captureId =
    data.purchase_units?.[0]?.payments?.captures?.[0]?.id as string;

  return { id: data.id as string, captureId, status: data.status as string };
}

export async function verifyWebhookSignature(params: {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
  webhookId: string;
  webhookEvent: unknown;
}): Promise<boolean> {
  const token = await getAccessToken();

  const res = await fetch(
    `${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: params.authAlgo,
        cert_url: params.certUrl,
        transmission_id: params.transmissionId,
        transmission_sig: params.transmissionSig,
        transmission_time: params.transmissionTime,
        webhook_id: params.webhookId,
        webhook_event: params.webhookEvent,
      }),
      cache: "no-store",
    },
  );

  const data = await res.json();
  return data.verification_status === "SUCCESS";
}
