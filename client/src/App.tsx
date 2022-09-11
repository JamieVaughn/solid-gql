import type { Component } from "solid-js";
import { createResource, For, Show, createSignal } from "solid-js";
import {
  createClient,
  defaultExchanges,
  subscriptionExchange,
} from "@urql/core";
import styles from "./App.module.css";
import { pipe, subscribe } from "wonka";
import { createClient as createWSClient } from "graphql-ws";

const wsClient = createWSClient({
  url: "ws://localhost:4000/graphql",
});

wsClient;

const client = createClient({
  url: "http://localhost:4000/graphql",
  requestPolicy: "cache-first",
  exchanges: [
    ...defaultExchanges,
    subscriptionExchange({
      forwardSubscription: (operation) => {
        return {
          subscribe: (sink) => {
            const dispose = wsClient.subscribe(operation, sink);
            return {
              unsubscribe: dispose,
            };
          },
        };
      },
    }),
  ],
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

const [todos, setTodos] = createSignal<Todo[]>([]); // use this for websockets API
const [count, setCount] = createSignal<number>(10); // use this for websockets API
const sub = /* GraphQL */ `
  subscription TODOS_CHANNEL {
    todos {
      id
      done
      text
    }
  }
`;
const countdown = /* GraphQL */ `
  subscription countdown {
    countdown(from: 10)
  }
`;

type Result = any; //{ data: { todos: Todo[] }}
const { unsubscribe } = pipe(
  client.subscription(sub, {}),
  subscribe(({ data, error }) => {
    console.log("todos", data, error);
    try {
      setTodos(data?.todos || { id: "1", text: `error: ${error}` });
    } catch (err) {
      console.log(err);
    }
  })
);

const _wonka = pipe(
  client.subscription(countdown, {}),
  subscribe(({ data, error }) => {
    console.log("count", data, error);
    try {
      setCount(data?.countdown);
    } catch (err) {
      console.log(err);
    }
  })
);

// const [todos, { refetch }] = createResource(todoId, fetchTodos); // use this for simple API w/o websockets

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
        { id, done: !todos().find((todo: Todo) => todo.id === id)?.done }
      )
      .toPromise();
    // refetch(); // use for simple API
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
    // refetch(); // use for simple API
  };
  return (
    <div class={styles.App}>
      <header class={styles.header}>Hello - {count()}</header>
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
          onKeyPress={(e) => (e.code === "Enter" ? onAdd() : null)}
        />
        <button onClick={onAdd}>Add</button>
      </div>
    </div>
  );
};

export default App;
