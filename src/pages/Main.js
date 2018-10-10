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
  height: 100vh;
  display: flex;
  flex-diretion: row;
`;
const ListContainer = styled.div`
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.5);
  border-width: 1px;
  height: 100vh;
  width: 500px;
  overflow-y: scroll;
`;
const ConversationContainer = styled.div`
  width: 100%;
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

class Main extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
  };
  client = new GraphQLClient(httpEndpoint);

  constructor(props) {
    super(props);
    this.state = {
      currentConversation: null,
      conversations: [],
      searchedUsers: [],
      searchOpen: false,
      error: false
    };
  }

  componentWillMount() {
    const client = new SubscriptionClient(wsEndpoint, {
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2UiOiJkZWZhdWx0QGRlZmF1bHQiLCJyb2xlcyI6WyJhZG1pbiJdfSwiaWF0IjoxNTM5MTk1OTI2LCJleHAiOjE1Mzk4MDA3MjZ9.hNaku3QzydaRc4lMzcXTVNaJxD4MjrWFPBHAVe82mhU"
      },
      reconnect: true
    });

    // Request initial chat stat
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
        console.log(x);
        const index = this.state.conversations.findIndex(
          element => element.id === x.data.conversations.node.id
        );
        let conversations = this.state.conversations;
        if (index >= 0) {
          conversations.splice(index, 1);
        }
        conversations.unshift(x.data.conversations.node);
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
    if (!location.state || !location.state.id) {
      history.replace("/");
    }
    return (
      <div>
        <SuperContainer>
          <ListContainer>
            <h5 style={{ margin: 0 }}>Conversations</h5>
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
            searchUsers(identifier: "${search.value}") {
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
      this.setState({ searchedUsers: [] });
    }
  };
}

export default withRouter(Main);
