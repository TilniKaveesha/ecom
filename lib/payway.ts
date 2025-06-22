import crypto from "crypto"

/* eslint-disable @typescript-eslint/no-explicit-any */
const base =
  process.env.PAYWAY_API_URL ||
  "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments"

export const payway = {
  createOrder: async function createOrder(
    price: number,
    orderId: string,
    customerInfo: any
  ) {
    const url = `${base}/purchase`

    const transactionRef = `TXN_${orderId}_${Date.now()}`

    const payload = {
      merchant_id: process.env.PAYWAY_MERCHANT_ID,
      transaction_ref: transactionRef,
      amount: Math.round(price * 100), // Convert to cents
      currency: "USD",
      return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payway/return?orderId=${orderId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payway/cancel?orderId=${orderId}`,
      callback_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payway/callback?orderId=${orderId}`,
      customer_email: customerInfo.email,
      customer_phone: customerInfo.phone,
      customer_name: customerInfo.name,
      items: [
        {
          name: `Order ${orderId}`,
          quantity: 1,
          price: Math.round(price * 100),
        },
      ],
      metadata: {
        order_id: orderId,
      },
    }

    const signature = signPayload(payload)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PAYWAY_PUBLIC_KEY}`,
        "X-Payway-Signature": signature,
      },
      body: JSON.stringify(payload),
    })

    return handleResponse(response)
  },

  verifyPayment: async function verifyPayment(transactionRef: string) {
    const url = `${base}/verify/${transactionRef}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PAYWAY_PUBLIC_KEY}`,
      },
    })

    return handleResponse(response)
  },
}

function signPayload(payload: any): string {
  const sortedKeys = Object.keys(payload).sort();
  const queryString = sortedKeys
    .map((key) => `${key}=${encodeURIComponent(JSON.stringify(payload[key]))}`)
    .join("&");

  // Get and clean private key
  let privateKey = process.env.PAYWAY_RSA_PRIVATE_KEY || '';
  privateKey = privateKey.replace(/\\n/g, '\n').trim();

  if (!privateKey) {
    throw new Error("PAYWAY_RSA_PRIVATE_KEY is not configured");
  }

  // Ensure proper key headers
  if (!privateKey.includes('-----BEGIN') && !privateKey.includes('-----END')) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
  }

  try {
    const sign = crypto.createSign('SHA256');
    sign.update(queryString);
    
    // Try PKCS#8 first, then fallback to PKCS#1
    try {
      return sign.sign({
        key: privateKey,
        format: 'pem',
        type: 'pkcs8'
      }, "base64");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (pkcs8Error) {
      return sign.sign({
        key: privateKey,
        format: 'pem',
        type: 'pkcs1'
      }, "base64");
    }
  } catch (error: unknown) {
    console.error('Signing error details:', error);
    throw new Error(`Failed to sign payload: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleResponse(response: any) {
  if (response.ok) {
    return response.json()
  }

  const errorMessage = await response.text()
  throw new Error(errorMessage)
}
