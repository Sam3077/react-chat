import express from "express";
import graphqlHTTP from "express-graphql";
import jwt from "jsonwebtoken";
const crypto = require("crypto");
import { buildSchema } from "graphql";

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type User {
    id: ID!
    username: String
  }

  type Chat {
    id: ID!
    content: String
    from: User!
  }

  type Conversation {
    id: ID!
    members: [User!]!
    chats: [Chat]!
  }

  type Query {
    getChats(conversationId: ID!): [Chat]!
    getConversations(userId: ID!): [Conversation]!
  }

  type Mutation {
    createUser(username: String!): User!
    sendChat(from: ID!, conversationId: ID!, content: String): Chat!
    createConversation(members: [ID!]!): Conversation!
  }
`);

class Chat {
  id: string;
  content: string;
  from: User;

  constructor(id: string, content: string, from: User) {
    this.id = id;
    this.content = content;
    this.from = from;
  }
}

class Conversation {
  id: string;
  members: User[];
  chats: Chat[];

  constructor(id: string, members: User[]) {
    this.id = id;
    this.members = members;
    this.chats = [];
  }
}

class User {
  id: string;
  username: string;

  constructor(id: string, username: string) {
    this.id = id;
    this.username = username;
  }
}

let database: {
  users: {
    [userId: string]: {
      user: User;
      conversations: string[];
    };
  };
  conversations: {
    [conversationId: string]: Conversation;
  };
} = { users: {}, conversations: {} };

// The root provides a resolver function for each API endpoint
const root = {
  createUser: function({ username }: { username: string }): User {
    const id = crypto.randomBytes(20).toString("hex");
    const user = new User(id, username);
    database.users[id] = { user: user, conversations: [] };
    return user;
  },
  createConversation: function({
    members
  }: {
    members: string[];
  }): Conversation {
    const id = crypto.randomBytes(20).toString("hex");
    const users = members.map(id => {
      if (database.users[id]) {
        return database.users[id].user;
      } else {
        throw new Error("User not found");
      }
    });

    const conversation = new Conversation(id, users);
    database.conversations[id] = conversation;
    members.forEach(member => {
      database.users[member].conversations.push(id);
    });
    return conversation;
  },
  sendChat: function({
    from,
    conversationId,
    content
  }: {
    from: string;
    conversationId: string;
    content: string;
  }): Chat {
    const id = crypto.randomBytes(20).toString("hex");

    if (database.users[from]) {
      const chat = new Chat(id, content, database.users[from].user);
      database.conversations[conversationId].chats.push(chat);
      return chat;
    } else {
      throw new Error("User not found");
    }
  },
  getChats: function(
    { conversationId }: { conversationId: string },
    root: any,
    ctx: { token: string }
  ): Chat[] {
    if (database.conversations[conversationId]) {
      return database.conversations[conversationId].chats;
    } else {
      throw new Error("Conversation not found");
    }
  },
  getConversations: function({ userId }: { userId: string }): Conversation[] {
    if (database.users[userId]) {
      return database.users[userId].conversations.map(
        id => database.conversations[id]
      );
    } else {
      throw new Error("User not found");
    }
  }
};

const app = express();
const endpoint = "/graphql";
app.use(
  endpoint,
  graphqlHTTP(request => ({
    schema: schema,
    rootValue: root,
    graphiql: true,
    context: { token: request.headers.authorization || "" }
  }))
);
app.listen(4000);
console.log("Running a GraphQL API server at localhost:4000" + endpoint);
