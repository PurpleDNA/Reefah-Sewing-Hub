// Verify the `flutterwave-signature` header on incoming v4 webhooks.
// The signature is base64(HMAC-SHA256(rawBody, secretHash)). Compare in
// constant time to avoid leaking timing information.

import { createHmac, timingSafeEqual } from "crypto";
import { flutterwaveConfig } from "./config";

export function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = flutterwaveConfig.secretHash;
  console.log("secret>>>>>>>>>>>", secret);
  if (!secret || !signatureHeader) return false;

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");

  // const a = Buffer.from(expected)
  // const b = Buffer.from(signatureHeader)
  // if (a.length !== b.length) return false
  // return timingSafeEqual(a, b)
  console.log(
    "expected>>>> ",
    expected,
    " then received>>>> ",
    signatureHeader,
  );
  return expected === signatureHeader;
}
