import type { Component } from "solid-js";
import { createResource, For, Show, createSignal } from "solid-js";
import { createClient } from "@urql/core";
import styles from "./App.module.css";

const client = createClient({
  url: "http://localhost:4000/graphql",
});

const todoId = 1;
const fetchTodos = async () => {
  const response = await client
    .query(
      /* GraphQL */ `
        query {
          getTodos {
            id
            done
            text
          }
        }
      `,
      {} // variables
    )
    .toPromise();
  console.log(response.data.getTodos);
  return await response.data.getTodos;
};

type Todo = {
  id: string;
  text: string;
  done: boolean;
};

const [todos, { refetch }] = createResource(todoId, fetchTodos);

const Spinner = () => <div>Loading...</div>;

const App: Component = () => {
  const [text, setText] = createSignal("");
  const toggle = async (id: string) => {
    await client
      .mutation(
        `
      mutation($id: ID!, $done: Boolean!) {
        setDone(id: $id, done: $done) {
          id
        }
      }
    `,
        { id, done: !todos().find((todo: Todo) => todo.id === id).done }
      )
      .toPromise();
    refetch();
  };
  const onAdd = async () => {
    await client
      .mutation(
        `
      mutation($text: String!) {
        addTodo(text: $text) {
          id
        }
      }
    `,
        { text: text() }
      )
      .toPromise();
    setText("");
    refetch();
  };
  return (
    <div class={styles.App}>
      <header class={styles.header}>Hello</header>
      <Show when={todos()} fallback={Spinner}>
        <ul>
          <For each={todos()}>
            {(todo: Todo) => {
              return (
                <li>
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onClick={() => toggle(todo.id)}
                  />
                  <span style={{ "text-transform": "capitalize" }}>
                    {todo.text}
                  </span>
                </li>
              );
            }}
          </For>
        </ul>
      </Show>
      <div>
        <input
          type="text"
          value={text()}
          onInput={(e) => setText(e.currentTarget.value)}
        />
        <button onClick={onAdd}>Add</button>
      </div>
    </div>
  );
};

export default App;
