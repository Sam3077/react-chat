// @ts-nocheck
const { GraphQLServer } = require("graphql-yoga");
const { Prisma } = require("prisma-binding");

const resolvers = {
  Subscription: {
    conversations: {
      subscribe: (_, args, context, info) => {
        return context.prisma.subscription.conversation(
          {
            where: {
              node: {
                users_some: { id: args.userId }
              }
            }
          },
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
        { where: { email: args.email } },
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
      const identifier = args.identifier.toLowerCase();
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
              create: {
                content: args.content,
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
      const email = args.email.toLowerCase();
      if (args.username.includes("@")) {
        throw new Error("Usernames may not contain the @ symbol");
      }
      if (!email.includes("@") || !email.includes(".")) {
        throw new Error("Invalid email");
      }
      return context.prisma.mutation.createUser(
        {
          data: {
            email: email,
            username: args.username,
            username_lower: args.username.toLowerCase()
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
  context: req => ({
    ...req,
    prisma: new Prisma({
      typeDefs: "src/generated/prisma.graphql",
      endpoint: "http://localhost:4466",
      secret: "4iTvmdwNvt9y"
    })
  })
});
server.start({ playground: false }, () =>
  console.log(`GraphQL server is running on http://localhost:4000`)
);
