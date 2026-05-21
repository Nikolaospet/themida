import { db } from "@/lib/db";

// PCI-001 (Req 3.5.1): the full PAN is written to the database as a plaintext
// column. PAN must be rendered unreadable wherever it is stored (truncation,
// tokenization, or strong cryptography), so a DB or backup compromise would
// directly expose cardholder data.
export async function saveCard(body: { userId: string; cardNumber: string; expiry: string }) {
  return db.payment.create({
    data: {
      userId: body.userId,
      cardNumber: body.cardNumber,
      expiry: body.expiry,
    },
  });
}
