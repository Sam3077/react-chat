import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import PropTypes from "prop-types";
import ChatListItem from "../components/ChatListItem";
import Conversation from "../components/Conversation";
import styled from "styled-components";
import { GraphQLClient } from "graphql-request";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { Button, Modal, Input, Snackbar } from "@material-ui/core";
import { httpEndpoint, wsEndpoint } from "../currentEndpoint";

const SuperContainer = styled.div`
  width: 100vw;
  max-width: 100vw;
  height: 100vh;
  display: flex;
  flex-diretion: row;
`;
const ListContainer = styled.div`
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.5);
  border-width: 1px;
  height: 100vh;
  min-width: 250px;
  overflow-y: scroll;
  flex: 1;
`;
const ConversationContainer = styled.div`
  flex: 2;
  overflow-x: auto;
`;
const SearchContainer = styled.div`
    position: absolute;
    top: 40%;
    left: 25%;
    right 25%;
    background-color: white;
    border-radius: 5px;
`;
const SearchResult = styled.p`
  margin: 0;
  padding: 10px;
  user-select: none;
  border-bottom-style: solid;
  border-color: black;
  border-width: 1px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.2);
    cursor: pointer;
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

/**
 * This class is the main portion of the application.
 * This contains the UI for the list of conversations as well as a specific conversation
 * (although those UIs are actually implemented as seperate components).
 *
 * This class also performs network requests for receiving conversation data.
 */
class Main extends Component {
  // History and location are again provided by react-router-dom
  static propTypes = {
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
  };

  // Creates a new client for handling requests to our API
  client = new GraphQLClient(httpEndpoint);

  constructor(props) {
    super(props);
    this.state = {
      // currentConversation will be set when the user selects a conversation
      currentConversation: null,
      // conversations will be set when the data request returns
      conversations: [],
      searchedUsers: [],
      searchOpen: false,
      error: false
    };
  }

  componentWillMount() {
    // This client will manage listening for conversation updates
    const client = new SubscriptionClient(wsEndpoint, {
      reconnect: true
    });

    // Request initial chat information
    const query = `
        query {
            userInfo(id: "${this.props.location.state.id}") {
                id 
                username 
                conversations { 
                    id 
                    users { 
                        username
                        email
                    } 
                    chats { 
                        content 
                        from { 
                            username 
                            email
                        } 
                    } 
                }
            }
        }
    `;
    this.client.request(query).then(r => {
      this.setState({ conversations: r.userInfo.conversations });
    });

    // Listen for chat updates
    const subscriptionQuery = `
        subscription {
            conversations(userId: "${this.props.location.state.id}") {
                node {
                    id
                    users {
                        username
                        email
                    }
                    chats {
                        from {
                            username
                            email
                        }
                        content
                    }
                }
            }
        }
      `;
    client.request({ query: subscriptionQuery }).subscribe({
      next: x => {
        const index = this.state.conversations.findIndex(
          element => element.id === x.data.conversations.node.id
        );
        let conversations = this.state.conversations;

        // If the conversation is already in the list of conversations, remove it from the list
        if (index >= 0) {
          conversations.splice(index, 1);
        }
        // Push the updated conversation to the front of the list (will bring it to the top of the list in the UI)
        conversations.unshift(x.data.conversations.node);

        // If the conversation is currently open, update the currentConversation data as well
        if (
          this.state.currentConversation &&
          this.state.currentConversation.id === x.data.conversations.node.id
        ) {
          this.setState({
            currentConversation: x.data.conversations.node,
            conversations
          });
        } else {
          this.setState({ conversations });
        }
      },
      error: err => {
        console.error(err);
        this.setState({ error: true });
      },
      complete: () => console.log("done!")
    });
  }

  render() {
    const { history, location } = this.props;

    // If we don't have user account data redirect to the login page
    if (!location.state || !location.state.id) {
      history.replace("/");
    }
    return (
      <div>
        <SuperContainer>
          <ListContainer>
            <h5 style={{ margin: 0 }}>Conversations</h5>
            {/*The following parses conversation data and renders the conversation list*/}
            {this.state.conversations.map((conversation, index) => {
              const title = conversation.users
                .map(user => user.username)
                .filter(username => username !== location.state.username)
                .join(", ");
              let lastMessage;
              let from;
              if (conversation.chats.length > 0) {
                const message =
                  conversation.chats[conversation.chats.length - 1];
                lastMessage = message.content;
                if (message.from.email === location.state.email) {
                  from = "You";
                } else {
                  from = message.from.username;
                }
              }

              return (
                <ChatListItem
                  title={title}
                  lastMessage={lastMessage || ""}
                  from={from || ""}
                  onClick={() =>
                    this.setState({
                      currentConversation: this.state.conversations[index]
                    })
                  }
                  key={index}
                />
              );
            })}
          </ListContainer>
          <ConversationContainer>
            {/*The data inside this conversation will be updated whenever currentConversation is changed*/}
            <Conversation
              data={{
                userId: location.state.id,
                username: location.state.username,
                email: location.state.email,
                conversationData: this.state.currentConversation
              }}
            />
          </ConversationContainer>
          <Button
            variant="fab"
            style={{
              position: "absolute",
              left: "25px",
              bottom: "25px"
            }}
            onClick={() => this.setState({ searchOpen: true })}
          >
            <h3>+</h3>
          </Button>
        </SuperContainer>
        <Modal
          open={this.state.searchOpen}
          disableAutoFocus
          onClose={() =>
            this.setState({ searchOpen: false, searchedUsers: [] })
          }
        >
          <SearchContainer>
            <Input
              fullWidth
              id="userSearch"
              onChange={this.performUserSearch}
              placeholder="Search for a user..."
            />
            {this.state.searchedUsers.map((user, index) => (
              <SearchResult
                key={index}
                onClick={() => this.createNewChat(index)}
              >
                {user.username}: <i>{user.email}</i>
              </SearchResult>
            ))}
          </SearchContainer>
        </Modal>
        <Snackbar
          open={this.state.error}
          message={
            <p style={{ fontSize: "20px", margin: "5px", userSelect: "none" }}>
              An error occurred
            </p>
          }
          autoHideDuration={2000}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          onClose={() => this.setState({ error: false })}
        />
      </div>
    );
  }

  createNewChat = index => {
    const query = `
        mutation {
            newConversation(emails: ["${this.props.location.state.email}", "${
      this.state.searchedUsers[index].email
    }"]) {
                id
            }
        }
    `;

    // Closes the search modal
    this.setState({ searchedUsers: [], searchOpen: false });
    this.client.request(query).catch(e => {
      console.error(e);
      this.setState({ error: true });
    });
  };

  performUserSearch = () => {
    const search = document.getElementById("userSearch");
    if (search.value !== "") {
      const query = `
        query {
            searchUsers(identifier: "${encodeURI(search.value)}") {
                username
                email
            }
        }
    `;
      this.client
        .request(query)
        .then(r => {
          this.setState({
            searchedUsers: r.searchUsers.filter(
              user => user.email !== this.props.location.state.email
            )
          });
        })
        .catch(e => {
          console.error(e);
          this.setState({ error: true });
        });
    } else {
      // When the search bar is empty, just clear the returned users
      this.setState({ searchedUsers: [] });
    }
  };
}

export default withRouter(Main);
