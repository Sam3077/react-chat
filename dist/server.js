"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var graphqlHTTP = require("express-graphql");
var crypto = require("crypto");
var graphql_1 = require("graphql");
// Construct a schema, using GraphQL schema language
var schema = graphql_1.buildSchema("\n  type User {\n    id: ID!\n  }\n\n  type Chat {\n    id: ID!\n    content: String\n    from: ID!\n    to: ID!\n  }\n\n  type Query {\n    getChats(from: ID!, to: ID!): [Chat]!\n    getLastChat(from: ID!, to: ID!): Chat\n  }\n\n  type Mutation {\n    createUser: User\n    sendChat(from: ID!, to: ID!, content: String): Chat\n  }\n");
var Chat = /** @class */ (function () {
    function Chat(id, content, to, from) {
        this.id = id;
        this.content = content;
        this.to = to;
        this.from = from;
    }
    return Chat;
}());
var User = /** @class */ (function () {
    function User(id) {
        this.id = id;
    }
    return User;
}());
var database = {};
// The root provides a resolver function for each API endpoint
var root = {
    createUser: function () {
        var id = crypto.randomBytes(20).toString("hex");
        database[id] = {};
        console.clear();
        console.log(database);
        return new User(id);
    },
    sendChat: function (_a) {
        var to = _a.to, from = _a.from, content = _a.content;
        var id = crypto.randomBytes(20).toString("hex");
        var chat = new Chat(id, content, to, from);
        if (database[from][to]) {
            database[from][to].push(chat);
        }
        else {
            database[from][to] = [chat];
        }
        if (database[to][from]) {
            database[to][from].push(chat);
        }
        else {
            database[to][from] = [chat];
        }
        console.clear();
        console.log(database);
        return chat;
    },
    getChats: function (_a) {
        var to = _a.to, from = _a.from;
        console.log("to: " + to, "from: " + from);
        return database[to][from] || new Array();
    },
    getLastChat: function (_a) {
        var to = _a.to, from = _a.from;
        if (!database[to][from][database[to][from].length - 1]) {
            throw new Error("No chat found");
        }
        return database[to][from][database[to][from].length - 1];
    }
};
var app = express();
var endpoint = "/graphql";
app.use(endpoint, graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
}));
app.listen(4000);
console.log("Running a GraphQL API server at localhost:4000" + endpoint);
