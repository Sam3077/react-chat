import React, { Component } from "react";
import Button from "@material-ui/core/Button";
import Input from "@material-ui/core/Input";
import Modal from "@material-ui/core/Modal";
import styled from "styled-components";
import { GraphQLClient } from "graphql-request";
import { withRouter } from "react-router-dom";
import PropTypes from "prop-types";
import { httpEndpoint } from "../currentEndpoint";

const Row = styled.div`
  display: flex;
  flex-direction: row;
  width: 40%;
  justify-content: space-around;
`;
const StyledButton = styled(Button)`
  flex: 1;
`;
const StyledInput = styled(Input)`
  flex: 1;
  margin-bottom: 25px;
`;
const ButtonText = styled.p`
  height: 100%;
  margin-top: -9px;
  color: white;
`;
const Spacer = styled.div`
  flex: 0.5;
`;
const Form = styled.form`
  width: 40%;
  margin-top: 25px;
  display: flex;
  flex-direction: column;
`;
const ErrorPopup = styled.div`
  position: absolute;
  left: 25%;
  right: 25%;
  top: 40%;
  background-color: white;
  text-align: center;
  padding: 10px;
  border-radius: 5px;
`;
const NoMarginPopup = styled.h5`
  margin: 0;
  padding: 0;
`;

/**
 * This class is the first page the user sees that prompts them to either create an
 * account or to log in. When submitted, the application receives either the username, email,
 * and id of the user, or an error message that is handled with a popup shown to the user.
 */
class Login extends Component {
  // History is provided by the withRouter method from react-router-dom and gives a way to navigate.
  static propTypes = {
    history: PropTypes.object.isRequired
  };

  client = new GraphQLClient(httpEndpoint);

  constructor(props) {
    super(props);
    this.state = {
      create: true,
      errorMessage: "",
      error: false
    };
  }

  render() {
    return [
      <p key="1">Please Login or Create an Account</p>,
      <Row key="2">
        <StyledButton
          color="primary"
          variant="outlined"
          onClick={() => this.setState({ create: false })}
        >
          <ButtonText>Login</ButtonText>
        </StyledButton>
        <Spacer />
        <StyledButton
          color="primary"
          variant="outlined"
          onClick={() => this.setState({ create: true })}
          autoFocus
        >
          <ButtonText>Create Account</ButtonText>
        </StyledButton>
      </Row>,
      <Form onSubmit={this.authenticate} id="form" key="3">
        {this.state.create ? (
          [
            <StyledInput
              type="text"
              placeholder="Username"
              required
              name="username"
              id="username"
              key={1}
            />,
            <StyledInput
              type="email"
              placeholder="Email"
              required
              name="email"
              id="email"
              key={2}
              onChange={() =>
                document.getElementById("email").setCustomValidity("")
              }
            />
          ]
        ) : (
          <StyledInput
            type="email"
            placeholder="Email"
            required
            name="email"
            id="email"
            onChange={() =>
              document.getElementById("email").setCustomValidity("")
            }
          />
        )}
        <Input type="submit" readOnly disableUnderline>
          <ButtonText>Submit</ButtonText>
        </Input>
      </Form>,
      <Modal
        open={this.state.error}
        onBackdropClick={() => this.setState({ error: false })}
        onClose={() => this.setState({ error: false })}
        onClick={() => this.setState({ error: false })}
        disableAutoFocus
        key="4"
      >
        <ErrorPopup>
          <NoMarginPopup>{this.state.errorMessage}</NoMarginPopup>
        </ErrorPopup>
      </Modal>
    ];
  }

  authenticate = e => {
    e.preventDefault();
    const usernameTextBox = document.getElementById("username");
    const emailTextBox = document.getElementById("email");

    let query;

    // action is needed because the query action is the first element in the response JSON
    let action;

    // if the username text box rendered, the user is trying to create a new account
    if (usernameTextBox) {
      action = "signup";
      query = `
        mutation {
          signup(username: "${encodeURI(
            usernameTextBox.value
          )}", email: "${encodeURI(emailTextBox.value)}") {
            id
            username
            email
        }
      }
      `;
    } else {
      action = "login";
      query = `
      query {
        login(email: "${encodeURI(emailTextBox.value)}") {
            id
            username
            email
        }
      }
      `;
    }

    // performs a request to the public GraphQL API
    this.client
      .request(query)
      .then(data => {
        console.log(data);
        if (!data || !data[action]) {
          this.setState({
            errorMessage: "We couldn't find any users with that email.",
            error: true
          });
          return;
        }
        this.props.history.replace("/chats", data[action]);
      })
      .catch(e => {
        console.error(e);
        let errorMessage;

        if (e.message && e.message === "Cannot read property 'id' of null") {
          errorMessage = "We couldn't find any users with that email.";
        } else if (
          e.response &&
          e.response.errors[0].message ===
            "Usernames may not contain the @ symbol"
        ) {
          errorMessage = "Usernames may not contain the @ symbol.";
        } else if (e.response && e.response.errors[0].code === 3010) {
          errorMessage =
            'A user is already registered under that email. Please select "Login"';
        } else {
          errorMessage = "An error occurred. Please try again.";
        }
        this.setState({ errorMessage, error: true });
      });
  };
}

export default withRouter(Login);
