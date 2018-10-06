"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var graphqlHTTP = require("express-graphql");
var graphql_1 = require("graphql");
// Construct a schema, using GraphQL schema language
var schema = graphql_1.buildSchema("\n  type Query {\n    hello: String,\n    test: String\n  }\n");
// The root provides a resolver function for each API endpoint
var root = {
    hello: function () {
        return "Hello world!";
    },
    test: function () {
        return "This was a test!";
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
