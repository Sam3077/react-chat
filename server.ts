const express = require("express");
const graphqlHTTP = require("express-graphql");
const crypto = require("crypto");
import { buildSchema } from "graphql";

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type User {
    id: ID!
  }

  type Chat {
    id: ID!
    content: String
    from: ID!
    to: ID!
  }

  type Query {
    getChats(from: ID!, to: ID!): [Chat]!
    getLastChat(from: ID!, to: ID!): Chat
  }

  type Mutation {
    createUser: User
    sendChat(from: ID!, to: ID!, content: String): Chat
  }
`);

class Chat {
  id: string;
  content: string;
  to: string;
  from: string;

  constructor(id: string, content: string, to: string, from: string) {
    this.id = id;
    this.content = content;
    this.to = to;
    this.from = from;
  }
}

class User {
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}

let database: {
  [userId: string]: {
    [fromId: string]: Chat[];
  };
} = {};

// The root provides a resolver function for each API endpoint
const root = {
  createUser: function(): User {
    const id = crypto.randomBytes(20).toString("hex");
    database[id] = {};
    return new User(id);
  },
  sendChat: function({
    to,
    from,
    content
  }: {
    to: string;
    from: string;
    content: string;
  }): Chat {
    const id = crypto.randomBytes(20).toString("hex");
    const chat = new Chat(id, content, to, from);

    if (database[from][to]) {
      database[from][to].push(chat);
    } else {
      database[from][to] = [chat];
    }

    if (database[to][from]) {
      database[to][from].push(chat);
    } else {
      database[to][from] = [chat];
    }

    return chat;
  },
  getChats: function({ to, from }: { to: string; from: string }): Chat[] {
    console.log(`to: ${to}`, `from: ${from}`);
    return database[to][from] || new Array<Chat>();
  },
  getLastChat: function({
    to,
    from
  }: {
    to: string;
    from: string;
  }): Chat | undefined {
    if (!database[to][from][database[to][from].length - 1]) {
      throw new Error("No chat found");
    }
    return database[to][from][database[to][from].length - 1];
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
