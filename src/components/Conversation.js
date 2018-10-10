import React, { Component } from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import Snackbar from "@material-ui/core/Snackbar";
import { request } from "graphql-request";

const Wrapper = styled.div`
  max-width: 100%;
  height: 100%;
  padding-left: 5%;
  padding-right: 5%;
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
  margin: 0;
  flex: 1;

  &:focus {
    outline: none;
  }
`;
const InputAddOn = styled.div`
  display: flex;
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

  render() {
    const { data } = this.props;
    const messagesContainer = document.getElementById("messagesContainer");
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    return (
      <Wrapper>
        {data.conversationData ? (
          [
            <div key="1" style={{ overflowY: "scroll" }} id="messagesContainer">
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
