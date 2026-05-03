import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request): Promise<Response> {
  const { prompt } = (await request.json()) as { prompt: string };

  const reply = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  // Returns the AI text directly with no disclosure that this came from a model.
  return Response.json({
    message: reply.content[0]?.type === "text" ? reply.content[0].text : "",
  });
}
