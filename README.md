# Node Chat

This application is a simple chat application built with GraphQL and Prisma (back-end) and React (front-end).

## Installation instructions

1. Install Node

- If you don't already Node installed, you can download it [here](https://nodejs.org/en/download/) or via a [package manager](https://nodejs.org/en/download/package-manager/)

2. Install Docker

- If you don't already have Docker installed, you can download it [here](https://www.docker.com/products/docker-engine)

3. Clone the github repo
4. Open the file react-chat/src/currentEndpoint.js and replace the IP address with your machine's IP address
5. Run the following commands in the root of the project (react-chat)

- `npm run install-dependencies`

  - Wait a minute after this command has finished running before running the next command

- `npm run start`

6. You can connect to the application on the local machine at `http://localhost:4000` or on the network at `http://[Your IP address]:4000`

## Usage instructions

1. Connect to either `http://localhost:4000` or `http://[Your IP address]:4000`
2. Create a new account by entering a username and email address
3. Either have someone else connect to `http://[Your IP address]:4000` and create an account or open a new window and create a new account
4. Click the plus button in the bottom left and search for the other user by their username or email address
5. Click their name to start a new conversation with them
6. Select the conversation from the list on the left and start sending messages

## Architecture

The back-end is written with Prisma and GraphQL and can be seen in the `yoga-server` directory. Prisma handles the database and CRUD operations on data elements through a private GraphQL API. The data schema and types are defined in `yoga-server/datamodel.graphql`. A public GraphQL API schema is outlined in `yoga-server/schema.graphql` and it is defined in `yoga-server/src/index.js` which defines resolvers for user requests that interface with Prisma. This API secures the data in the database, ensures that only specific CRUD operations can occur, and simplifies various requests.

The front-end is written with React and can be seen in the `src` directory. It is fairly straightforward and uses `styled-components` so most of the component styling is in the same file in which the component is used. The `serviceWorker.js` file is not enabled, but with a little bit of configuring could easily be used to make this app a progressive web app.
