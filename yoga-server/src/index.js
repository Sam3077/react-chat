// @ts-nocheck
const { GraphQLServer } = require("graphql-yoga");
const { Prisma } = require("prisma-binding");

const resolvers = {
  Subscription: {
    conversations: (_, args, context, info) => {
      console.log("made it here!");
      return context.prisma.subsciption.conversation(
        {
          where: {
            node: {
              user_some: {
                id: args.userId
              }
            }
          }
        },
        "{ node { id chats { from { username } content } } }"
      );
    }
  },
  Query: {
    user: (_, args, context, info) => {
      return context.prisma.query.user(
        {
          where: { id: args.userId }
        },
        "{ username conversations { id users { username } } }"
      );
    },
    conversation: (_, args, context, info) => {
      return context.prisma.query.conversation(
        {
          where: { id: args.conversationId }
        },
        "{ chats { content from { username } } }"
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
        "{ chats { content from { username } } }"
      );
    },
    newConversation: (_, args, context, info) => {
      const conversation = context.prisma.mutation.createConversation(
        {
          data: {
            users: {
              connect: args.userIds.map(id => ({ id: id }))
            }
          }
        },
        info
      );

      context.prisma.mutation.updateManyUsers({
        where: {
          OR: args.userIds.map(id => ({ id: id }))
        },
        data: {
          conversations: {
            connect: { id: conversation.id }
          }
        }
      });
      return conversation;
    },
    signup: (_, args, context, info) => {
      return context.prisma.mutation.createUser(
        {
          data: {
            username: args.username
          }
        },
        info
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
      endpoint: "http://localhost:4466"
    })
  })
});
server.start(() =>
  console.log(`GraphQL server is running on http://localhost:4000`)
);
