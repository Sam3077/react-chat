import React, { Component } from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import Snackbar from "@material-ui/core/Snackbar";
import { request } from "graphql-request";

const Wrapper = styled.div`
  max-width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`;
const Input = styled.input`
  width: 100%;
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
  height: 40px;
  padding-left: 10px;
  border-style: none;
  margin-top: 0;
  margin-bottom: 0;
  flex: 1;

  &:focus {
    outline: none;
  }
`;
const InputAddOn = styled.div`
  display: flex;
  margin-left: 5%;
  margin-right: 5%;
  margin-bottom: 0;
  padding-bottom: 0;
`;
const Button = styled.button`
  background-color: rgb(200, 200, 200);
  height: 42px;
  outline: none;
  border-style: none;
  border-radius: 0px;
  border-top-right-radius: 20px;
  border-bottom-right-radius: 20px;
`;
const Title = styled.h5`
  margin: 0;
  padding: 5px;
  background-color: rgba(255, 255, 255, 0.15);
  width: 100%;
`;

export default class Conversation extends Component {
  static propTypes = {
    data: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = {
      error: false
    };
  }

  componentDidUpdate() {
    const messages = document.getElementById("messagesContainer");
    if (messages) {
      messages.scrollTop = messages.scrollHeight;
    }
  }

  render() {
    const { data } = this.props;
    return (
      <Wrapper>
        {data.conversationData ? (
          [
            <Title>
              {data.conversationData.users
                .map(user => user.username)
                .filter(username => username !== data.username)
                .join(", ")}
            </Title>,
            <div
              key="1"
              style={{
                overflowY: "scroll",
                height: "100%"
              }}
              id="messagesContainer"
            >
              {data.conversationData.chats.map((chat, index) => (
                <p key={index}>
                  <i>{chat.from.username}</i>: {chat.content}
                </p>
              ))}
            </div>,
            <form
              key="2"
              onSubmit={e => {
                e.preventDefault();
                this.sendMessage();
              }}
            >
              <InputAddOn>
                <Input id="messageContainer" placeholder="Send Message..." />
                <Button>Send</Button>
              </InputAddOn>
            </form>
          ]
        ) : (
          <h5>Please select a conversation...</h5>
        )}
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
      </Wrapper>
    );
  }

  sendMessage = () => {
    const input = document.getElementById("messageContainer");
    const message = input.value;
    input.value = "";
    if (message !== "") {
      const query = `
            mutation {
                sendChat(from: "${this.props.data.userId}", conversationId: "${
        this.props.data.conversationData.id
      }", content: "${message}") {
                    id
                }
            }
        `;

      request("http://localhost:4000", query)
        .then(r => {
          this.forceUpdate();
          const messagesContainer = document.getElementById(
            "messagesContainer"
          );
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        })
        .catch(e => {
          console.error(e);
          this.setState({ error: true });
        });
    }
  };
}
