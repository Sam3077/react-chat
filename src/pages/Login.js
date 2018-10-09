import React, { Component } from "react";
import Button from "@material-ui/core/Button";
import Input from "@material-ui/core/Input";
import Modal from "@material-ui/core/Modal";
import styled from "styled-components";
import { request } from "graphql-request";

const Wrapper = styled.div`
  text-align: center;
`;
const Header = styled.header`
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
`;
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

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      create: true,
      errorMessage: "",
      error: false
    };
  }

  componentDidMount() {
    document.getElementById("email").setCustomValidity(this.state.errorMessage);
  }

  render() {
    return (
      <Wrapper>
        <Header>
          <p>Please Login or Create an Account</p>
          <Row>
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
          </Row>
          <Form onSubmit={this.authenticate} id="form">
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
          </Form>
          <Modal
            open={this.state.error}
            onBackdropClick={() => this.setState({ error: false })}
            onClose={() => this.setState({ error: false })}
            onClick={() => this.setState({ error: false })}
            disableAutoFocus={true}
          >
            <ErrorPopup>
              <NoMarginPopup>{this.state.errorMessage}</NoMarginPopup>
            </ErrorPopup>
          </Modal>
        </Header>
      </Wrapper>
    );
  }

  authenticate = e => {
    e.preventDefault();
    const usernameTextBox = document.getElementById("username");
    const emailTextBox = document.getElementById("email");

    let query;
    let action;
    if (usernameTextBox) {
      action = "signup";
      query = `
        mutation {
          signup(username: "${usernameTextBox.value}", email: "${
        emailTextBox.value
      }") {
            id
          }
        }
      `;
    } else {
      action = "login";
      query = `
      query {
        login(email: "${emailTextBox.value}") {
          id
        }
      }
      `;
    }

    request("http://localhost:4000", query)
      .then(data => {
        console.log(data[action].id);
      })
      .catch(e => {
        console.error(JSON.stringify(e, undefined, 2));
        // const code = e.response.errors[0].code;
        const code = 0;
        console.log(code);

        let errorMessage;
        switch (code) {
          case 20:
            errorMessage = "We couldn't find any users with that email.";
            break;
          case 3010:
            errorMessage = "A user already exists for that email.";
            break;
          default:
            errorMessage = "An error occurred. Please try again.";
        }
        this.setState({ errorMessage, error: true });
      });
  };
}

export default Login;
