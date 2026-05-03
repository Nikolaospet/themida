export async function fetchTodos(): Promise<string[]> {
  const response = await fetch("/api/todos");
  if (!response.ok) throw new Error(`fetchTodos failed: ${response.status}`);
  return (await response.json()) as string[];
}
