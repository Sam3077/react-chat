const express = require("express");
const graphqlHTTP = require("express-graphql");
import { buildSchema } from "graphql";

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type Query {
    hello: String,
    test: String
  }
`);

// The root provides a resolver function for each API endpoint
const root = {
  hello: () => {
    return "Hello world!";
  },
  test: () => {
    return "This was a test!";
  }
};

const app = express();
const endpoint = "/graphql";
app.use(
  endpoint,
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
  })
);
app.listen(4000);
console.log("Running a GraphQL API server at localhost:4000" + endpoint);
