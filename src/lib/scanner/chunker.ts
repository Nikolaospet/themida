import type { ScannerFile } from "./types";

const CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export type ChunkOptions = {
  maxTokensPerChunk?: number;
};

export function chunkFiles(
  files: readonly ScannerFile[],
  options: ChunkOptions = {},
): ScannerFile[][] {
  const maxTokens = options.maxTokensPerChunk ?? 50_000;
  if (files.length === 0) return [];

  const chunks: ScannerFile[][] = [];
  let current: ScannerFile[] = [];
  let currentTokens = 0;

  for (const file of files) {
    const tokens = estimateTokens(file.content ?? "");
    if (tokens > maxTokens) {
      if (current.length > 0) {
        chunks.push(current);
        current = [];
        currentTokens = 0;
      }
      chunks.push([file]);
      continue;
    }
    if (currentTokens + tokens > maxTokens && current.length > 0) {
      chunks.push(current);
      current = [];
      currentTokens = 0;
    }
    current.push(file);
    currentTokens += tokens;
  }

  if (current.length > 0) chunks.push(current);
  return chunks;
}
