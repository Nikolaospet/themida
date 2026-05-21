import { createPool } from "@/lib/db/driver";

// PCI-005 (Req 2.2.2/8.3.1): the payments database connects with the vendor
// default account admin/admin. Vendor default accounts must be removed or
// their passwords changed, and access must never rely on a default/hardcoded
// password — defaults give an attacker direct access to the cardholder data
// environment.
export const paymentsDb = createPool({
  host: "db.internal",
  user: "admin",
  password: "admin",
  database: "payments",
});
