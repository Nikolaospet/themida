import { useState } from "react";

import { fetchTodos } from "./api/todos";

export default function App() {
  const [items, setItems] = useState<string[]>([]);

  return (
    <main>
      <h1>Todos</h1>
      <button type="button" onClick={async () => setItems(await fetchTodos())}>
        Load
      </button>
      <ul>
        {items.map((todo) => (
          <li key={todo}>{todo}</li>
        ))}
      </ul>
    </main>
  );
}
