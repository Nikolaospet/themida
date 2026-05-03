import { logger } from "../lib/logger";

export async function login(email: string, password: string): Promise<void> {
  // Logs the password value alongside the email — leaks via log aggregation.
  logger.info({ email, password }, "login attempt");
  // ... rest of the login flow
}
