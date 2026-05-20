import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

// GET /api/orders/:id
// A01 Broken Access Control (IDOR): the order is loaded by the id taken
// straight from the request, and returned without checking that the
// authenticated user owns it. Any logged-in user can read any order by
// guessing/incrementing the id.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  await getSession(req); // authenticated, but the result is never used for authorization

  const order = await db.order.findUnique({ where: { id: params.id } });
  if (!order) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(order);
}
