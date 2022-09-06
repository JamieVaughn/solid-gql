import { createServer } from '@graphql-yoga/node'
import { makeExecutableSchema } from '@graphql-tools/schema'

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
        return newTodo
    },
    setDone: (_: unknown, {id, done}: {id: string, done: boolean}) => {
      const todo = todos.find(todo => todo.id === id);
      if(!todo) {
        throw new Error('Todo not found')
      }
      todo.done = done
      return todo
    }
  }
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

const cors = {
  origin: '*',
}

async function main() {
  const server = createServer({ cors, schema })
  await server.start()
}
 
main()
