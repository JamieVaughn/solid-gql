import { createPubSub, createServer, PubSub } from '@graphql-yoga/node'
import { makeExecutableSchema } from '@graphql-tools/schema'
// import ws from 'ws'
// import { useServer } from 'graphql-ws/lib/use/ws'
// import { buildSchema } from 'graphql'

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
    countdown(from: Int!): Int!
  }
`;

const resolvers = {
  Query: {
    getTodos: () => {
      return todos;
    }
  },
  Mutation: {
    addTodo: (_: unknown, {text}: {text: string}, { pubsub }: any) => {
      const newTodo = {
        id: String(todos.length+1),
        text,
        done: false
      }
      todos.push(newTodo)
      pubsub.publish(TODOS_CHANNEL, todos)
      return newTodo
    },
    setDone: (_: unknown, {id, done}: {id: string, done: boolean}, { pubsub }: any) => {
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
    TODOS_CHANNEL: {
      subscribe: async () => {
        const sub = pubsub.subscribe(TODOS_CHANNEL)
        pubsub.publish(TODOS_CHANNEL, todos)
        return sub
      },
      resolve: (payload: any) => payload
    },
    countdown: {
      subscribe: async function* countdown(_: any, { from }: {from: number}) {
        for (let i = from; i >=0; i--) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          yield { countdown: i }
        }
      }
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
  const server = createServer({
     cors, 
     schema,
     context: { pubsub }, 
  })
  await server.start()
}
 
main()

// const wsServer = new ws.Server({
//   port: 4000,
//   path: '/graphql'
// })
 
// useServer(
//   { 
//     schema: buildSchema(typeDefs),
//     roots: resolvers 
//   },
//   wsServer
// )
 
// console.log('Listening to port 4000')
