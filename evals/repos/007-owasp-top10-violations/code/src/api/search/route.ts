import { pool } from "@/lib/db";

// GET /api/search?q=...
// A03 Injection: the user-supplied query string is concatenated directly into
// the SQL statement. An attacker can inject arbitrary SQL (e.g.
// `' OR '1'='1` or a UNION) to read or modify the whole table.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";

  const rows = await pool.query(`SELECT id, name, email FROM users WHERE name LIKE '%${q}%'`);

  return Response.json(rows);
}
