import { createPubSub, createServer, PubSub } from '@graphql-yoga/node'
import { makeExecutableSchema } from '@graphql-tools/schema'

const TODOS_CHANNEL =  "TODOS_CHANNEL"
const pubsub = createPubSub<{TODOS_CHANNEL: [payload: {id: string, done: boolean, text: string}[]] }>()

let todos = [
  {
    id: '1',
    text: 'Learn Solid',
    done: false
  }
]

const typeDefs = /* GraphQL */`
  type Todo {
    id: ID!
    done: Boolean!
    text: String!
  }
  type Query {
    getTodos: [Todo]!
  }
  type Mutation {
    addTodo(text: String!): Todo
    setDone(id: ID!, done: Boolean!): Todo
  }
  type Subscription {
    ${TODOS_CHANNEL}: [Todo]!
  }
`;

const resolvers = {
  Query: {
    getTodos: () => {
      return todos;
    }
  },
  Mutation: {
    addTodo: (_: unknown, {text}: {text: string}) => {
      const newTodo = {
        id: String(todos.length+1),
        text,
        done: false
      }
      todos.push(newTodo)
      pubsub.publish(TODOS_CHANNEL, todos)
      return newTodo
    },
    setDone: (_: unknown, {id, done}: {id: string, done: boolean}) => {
      const todo = todos.find(todo => todo.id === id);
      if(!todo) {
        throw new Error('Todo not found')
      }
      todo.done = done
      pubsub.publish(TODOS_CHANNEL, todos)
      return todo
    }
  },
  Subscription: {
    [TODOS_CHANNEL]: {
      subscribe: () => {
        const sub = pubsub.subscribe(TODOS_CHANNEL)
        pubsub.publish(TODOS_CHANNEL, todos)
        return sub
      },
      resolve: (payload: any) => payload
    }
  }
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

const cors = {
  origin: '*',
}

async function main() {
  const server = createServer({ cors, schema })
  await server.start()
}
 
main()
