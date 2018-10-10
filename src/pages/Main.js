import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import PropTypes from "prop-types";
import ChatListItem from "../components/ChatListItem";
import styled from "styled-components";

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
  overflow-y: scroll;
`;
const ChatContainer = styled.div`
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
      currentConversation: null
    };
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
            {location.state.conversations.map((conversation, index) => {
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
                      currentConversation: location.state.conversations[index]
                    })
                  }
                  key={index}
                />
              );
            })}
          </ListContainer>
          <ChatContainer />
        </SuperContainer>
      </div>
    );
  }
}

export default withRouter(Main);
