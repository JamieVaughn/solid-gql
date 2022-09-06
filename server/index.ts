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
`;

const resolvers = {
  Query: {
    getTodos: () => {
      return todos;
    }
  }
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

const cors = {
  origin: ['http://localhost:3000', 'http://localhost:4000', 'http://0.0.0.0:4000'],
  credentials: true,
  allowedHeaders: ['X-Custom-Header'],
  methods: ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'],
  preflightContinue: true,
  optionsSuccessStatus: 200
}

async function main() {
  const server = createServer({ cors, schema })
  await server.start()
}
 
main()
