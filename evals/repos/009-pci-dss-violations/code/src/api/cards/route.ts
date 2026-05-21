import { db } from "@/lib/db";

// PCI-004 (Req 10.2.1): the card record is read and the access is recorded
// only with console.log — not an audit log. All individual access to
// cardholder data must be written to an audit trail that can reconstruct the
// event (actor, action, record, time, outcome).
export async function getCard(id: string) {
  const card = await db.card.findUnique({ where: { id } });
  console.log("read card", id);
  return card;
}
