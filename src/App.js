import React, { Component } from "react";
import Login from "./pages/Login";
import Main from "./pages/Main";
import { BrowserRouter as Router, Route } from "react-router-dom";
import styled from "styled-components";

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

/**
 * This class is simply here to define some global style and routes for React Router
 */
class App extends Component {
  render() {
    return (
      <Router>
        <Wrapper>
          <Header>
            <Route exact path="/" component={Login} />
            <Route path="/chats" component={Main} />
          </Header>
        </Wrapper>
      </Router>
    );
  }
}

export default App;
