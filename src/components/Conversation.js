import React, { Component } from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import Snackbar from "@material-ui/core/Snackbar";
import { GraphQLClient } from "graphql-request";
import { httpEndpoint } from "../currentEndpoint";

const Wrapper = styled.div`
  height: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow-x: hidden;
`;
const Input = styled.input`
  maxwidth: 100%;
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
const Messages = styled.div`
  overflow-y: scroll;
  height: 100%;
  padding-left: 10px;
  margin-right: 10px;
`;
const SingleMessage = styled.p`
  max-width: 100%;
  word-break: break-word;
  border-bottom-style: dotted;
  border-color: rgba(255, 255, 255, 0.2);
  borer-width: 1px;
  padding-bottom: 25px;
`;

/**
 * This class defined the UI and functionality of the Conversation element.
 * It will parse and display conversation data passed to it as well as perform mutation queries
 * to send new messages.
 */
export default class Conversation extends Component {
  static propTypes = { data: PropTypes.object };

  constructor(props) {
    super(props);
    this.state = { error: false };
  }

  // Creates a client for handling queries.
  client = new GraphQLClient(httpEndpoint);

  componentDidUpdate() {
    // Scrolls to the bottom when the component is rendered and when new chats show up
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
            <Title key="title">
              {data.conversationData.users
                .filter(user => user.email !== data.email)
                .map(user => user.username)
                .join(", ")}
            </Title>,
            <Messages key="1" id="messagesContainer" key="container">
              {data.conversationData.chats.map((chat, index) => {
                let from;
                if (chat.from.email === data.email) {
                  from = "You";
                } else {
                  from = chat.from.username;
                }
                return (
                  <SingleMessage key={index}>
                    <i>{from}</i>: {decodeURI(chat.content)}
                  </SingleMessage>
                );
              })}
            </Messages>,
            <form
              key="form"
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
            <p
              style={{
                fontSize: "20px",
                margin: "5px",
                userSelect: "none"
              }}
            >
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

    // the input must be encoded so that it doesn't mess with the query
    const message = encodeURI(input.value);

    // remove message from the input field
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

      this.client.request(query).catch(e => {
        console.error(e);
        this.setState({ error: true });
      });
    }
  };
}
