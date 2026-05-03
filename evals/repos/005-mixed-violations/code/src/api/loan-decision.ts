import Anthropic from "@anthropic-ai/sdk";

import { db } from "../lib/db";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function decideLoan(applicationId: string): Promise<void> {
  const reply = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 32,
    messages: [{ role: "user", content: `Approve or reject application ${applicationId}` }],
  });
  const verdict = reply.content[0]?.type === "text" ? reply.content[0].text : "reject";
  // Decision is committed directly — no human review queue.
  await db.applications.update({ id: applicationId, status: verdict });
}
