import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import PropTypes from "prop-types";
import ChatListItem from "../components/ChatListItem";
import Conversation from "../components/Conversation";
import styled from "styled-components";
import { request } from "graphql-request";
import { SubscriptionClient } from "subscriptions-transport-ws";

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

class Main extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      currentConversation: null,
      conversations: []
    };
  }

  componentWillMount() {
    const client = new SubscriptionClient("ws://localhost:4000", {
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
                    } 
                    chats { 
                        content 
                        from { 
                            username 
                        } 
                    } 
                }
            }
        }
    `;
    request("http://localhost:4000", query).then(r => {
      console.log(r);
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
                    }
                    chats {
                        from {
                            username
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
          conversations[index] = x.data.conversations.node;
        } else {
          conversations.push(x.data.conversations.node);
        }
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
      error: err => console.error(err),
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
                from = message.from.username;
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
                conversationData: this.state.currentConversation
              }}
            />
          </ConversationContainer>
        </SuperContainer>
      </div>
    );
  }
}

export default withRouter(Main);
