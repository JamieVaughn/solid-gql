import type { Component } from "solid-js";
import { createResource, For } from "solid-js";
import { createClient } from "@urql/core";
import styles from "./App.module.css";

const client = createClient({
  url: "http://localhost:4000/graphql",
});

const todoId = 1;

const [todos] = createResource(todoId, () => {
  client
    .query(
      `
    query {
      getTodos {
        id
        done
        text
      }
    }
  `
    )
    .toPromise()
    .then((data) => {
      console.log(data);
      data.getTodos;
    });
});

const App: Component = () => {
  return (
    <div class={styles.App}>
      <header class={styles.header}>Hello</header>
      <div>
        <For each={todos()}>
          {(todo, id) => {
            <>
              <input type="checkbox" checked={todos.done} />
              <span>{todos.text}</span>
            </>;
          }}
        </For>
      </div>
    </div>
  );
};

export default App;
