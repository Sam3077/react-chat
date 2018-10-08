"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var express_graphql_1 = __importDefault(require("express-graphql"));
var crypto = require("crypto");
var graphql_1 = require("graphql");
// Construct a schema, using GraphQL schema language
var schema = graphql_1.buildSchema("\n  type User {\n    id: ID!\n    username: String\n  }\n\n  type Chat {\n    id: ID!\n    content: String\n    from: User!\n  }\n\n  type Conversation {\n    id: ID!\n    members: [User!]!\n    chats: [Chat]!\n  }\n\n  type Operation {\n    success: Boolean\n  }\n\n  type Query {\n    getChats(conversationId: ID!): [Chat]!\n    getConversations(userId: ID!): [Conversation]!\n  }\n\n  type Mutation {\n    createUser(username: String!): User!\n    sendChat(from: ID!, conversationId: ID!, content: String): Chat!\n    createConversation(members: [ID!]!): Conversation!\n  }\n");
var Chat = /** @class */ (function () {
    function Chat(id, content, from) {
        this.id = id;
        this.content = content;
        this.from = from;
    }
    return Chat;
}());
var Conversation = /** @class */ (function () {
    function Conversation(id, members) {
        this.id = id;
        this.members = members;
        this.chats = [];
    }
    return Conversation;
}());
var User = /** @class */ (function () {
    function User(id, username) {
        this.id = id;
        this.username = username;
    }
    return User;
}());
var database = { users: {}, conversations: {} };
// The root provides a resolver function for each API endpoint
var root = {
    createUser: function (_a) {
        var username = _a.username;
        var id = crypto.randomBytes(20).toString("hex");
        var user = new User(id, username);
        database.users[id] = { user: user, conversations: [] };
        return user;
    },
    createConversation: function (_a) {
        var members = _a.members;
        var id = crypto.randomBytes(20).toString("hex");
        var users = members.map(function (id) {
            if (database.users[id]) {
                return database.users[id].user;
            }
            else {
                throw new Error("User not found");
            }
        });
        var conversation = new Conversation(id, users);
        database.conversations[id] = conversation;
        members.forEach(function (member) {
            database.users[member].conversations.push(id);
        });
        return conversation;
    },
    sendChat: function (_a) {
        var from = _a.from, conversationId = _a.conversationId, content = _a.content;
        var id = crypto.randomBytes(20).toString("hex");
        if (database.users[from]) {
            var chat = new Chat(id, content, database.users[from].user);
            database.conversations[conversationId].chats.push(chat);
            return chat;
        }
        else {
            throw new Error("User not found");
        }
    },
    getChats: function (_a) {
        var conversationId = _a.conversationId;
        if (database.conversations[conversationId]) {
            return database.conversations[conversationId].chats;
        }
        else {
            throw new Error("Conversation not found");
        }
    },
    getConversations: function (_a) {
        var userId = _a.userId;
        if (database.users[userId]) {
            return database.users[userId].conversations.map(function (id) { return database.conversations[id]; });
        }
        else {
            throw new Error("User not found");
        }
    }
};
var app = express_1.default();
var endpoint = "/graphql";
app.use(endpoint, express_graphql_1.default({
    schema: schema,
    rootValue: root,
    graphiql: true
}));
app.listen(4000);
console.log("Running a GraphQL API server at localhost:4000" + endpoint);
