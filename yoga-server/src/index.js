const { GraphQLServer } = require("graphql-yoga");
const { Prisma } = require("prisma-binding");

/**
 * This resolvers object maps user requests to their functionality and return data.
 * For the most part, these are just bindings to prisma plus connecting or creating new Nodes
 */
const resolvers = {
  Subscription: {
    conversations: {
      subscribe: (_, args, context, info) => {
        return context.prisma.subscription.conversation(
          {
            where: {
              node: {
                // Listen for changes in any conversations where the current user is in the list of users for the conversation
                users_some: { id: args.userId }
              }
            }
          },
          // Defines what data the client should be able to request
          "{ node { id users { username email } chats { content from { username email } } } }"
        );
      },
      resolve: (payload, args, context, info) => {
        return payload ? payload.conversation : payload; // sanity check
      }
    }
  },
  Query: {
    login: (_, args, context, info) => {
      return context.prisma.query.user(
        { where: { email: decodeURI(args.email) } },
        "{ id username email }"
      );
    },
    conversation: (_, args, context, info) => {
      return context.prisma.query.conversation(
        {
          where: { id: args.conversationId }
        },
        "{ users { username } chats { content from { username } } }"
      );
    },
    searchUsers: (_, args, context, info) => {
      const identifier = decodeURI(args.identifier).toLowerCase();

      // search by either username_lower or email
      // note that this is the only place that username_lower is ever used to make this search case insensitive
      return context.prisma.query.users(
        {
          where: {
            OR: [
              { email_starts_with: identifier },
              { username_lower_starts_with: identifier }
            ]
          }
        },
        "{ username email }"
      );
    },
    userInfo: (_, args, context, info) => {
      // This gets all the users info, including all the content from all their conversations
      return context.prisma.query.user(
        { where: { id: args.id } },
        "{ id username conversations { id users { username email } chats { content from { username email } } } }"
      );
    }
  },
  Mutation: {
    sendChat: (_, args, context, info) => {
      return context.prisma.mutation.updateConversation(
        {
          where: {
            id: args.conversationId
          },
          data: {
            chats: {
              // create and link new Chat object
              create: {
                content: decodeURI(args.content),
                from: {
                  connect: { id: args.from }
                }
              }
            }
          }
        },
        "{ id }"
      );
    },
    newConversation: (_, args, context, info) => {
      if (args.emails.length < 2) {
        throw new Error("Conversation must have at lease 2 members");
      }
      // create the new conversation
      const conversation = context.prisma.mutation.createConversation(
        {
          data: {
            users: {
              connect: args.emails.map(email => ({ email: email }))
            }
          }
        },
        info
      );

      // link the conversation to all the users
      context.prisma.mutation.updateManyUsers(
        {
          where: {
            OR: args.emails.map(email => ({ email: email }))
          },
          data: {
            conversations: {
              connect: { id: conversation.id }
            }
          }
        },
        "{ id users { username } }"
      );
      return conversation;
    },
    signup: (_, args, context, info) => {
      const email = decodeURI(args.email.toLowerCase());
      const username = decodeURI(args.username);
      if (username.includes("@")) {
        throw new Error("Usernames may not contain the @ symbol");
      }
      if (!email.includes("@") || !email.includes(".")) {
        throw new Error("Invalid email");
      }
      return context.prisma.mutation.createUser(
        {
          data: {
            email: email,
            username: username,
            username_lower: username.toLowerCase()
          }
        },
        "{ id username email }"
      );
    }
  }
};

const server = new GraphQLServer({
  typeDefs: "src/schema.graphql",
  resolvers,
  resolverValidationOptions: {
    requireResolversForResolveType: false
  },
  context: req => ({
    ...req,
    prisma: new Prisma({
      typeDefs: "src/generated/prisma.graphql",
      endpoint: "http://localhost:4466",
      secret: "4iTvmdwNvt9y"
    })
  })
});
server.start({ playground: true }, () =>
  console.log(`GraphQL server is running on http://localhost:4000`)
);
