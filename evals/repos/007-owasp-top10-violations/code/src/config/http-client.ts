import https from "node:https";

// A05 Security Misconfiguration.
// 1) TLS certificate verification disabled — every outbound HTTPS call is
//    open to undetected man-in-the-middle interception.
// 2) Wildcard CORS combined with credentials — any origin can read
//    authenticated responses on the user's behalf.
export const upstreamAgent = new https.Agent({
  rejectUnauthorized: false,
});

export function applyCorsHeaders(res: { setHeader: (name: string, value: string) => void }): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}
