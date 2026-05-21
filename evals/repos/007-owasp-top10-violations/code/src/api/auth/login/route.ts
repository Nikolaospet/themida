import jwt from "jsonwebtoken";

import { db } from "@/lib/db";

const SECRET = process.env.JWT_SECRET ?? "dev";

// POST /api/auth/login
// A07 Identification & Authentication Failures.
// 1) Password compared with `===` against a stored plaintext value — secrets
//    are not hashed, and the compare is timing-attackable.
// 2) Session token signed with the 'none' algorithm — the signature is not
//    verifiable, so tokens can be forged.
// 3) Session cookie set with httpOnly: false — readable by injected script.
export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = await db.user.findUnique({ where: { email } });

  if (!user || password !== user.password) {
    return new Response("Unauthorized", { status: 401 });
  }

  const token = jwt.sign({ sub: user.id }, SECRET, { algorithm: "none" });

  return new Response("OK", {
    status: 200,
    headers: { "Set-Cookie": `sid=${token}; httpOnly=false; Path=/` },
  });
}
