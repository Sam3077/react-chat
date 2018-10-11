import React, { Component } from "react";
import styled from "styled-components";
import PropTypes from "prop-types";

const Wrapper = styled.div`
  border-color: rgba(255, 255, 255, 0.5);
  border-width: 1px;
  border-top-style: solid;
  border-bottom-style: solid;
  max-height: 75px;
  transition: background-color 0.1s ease;
  padding: 5px;
  padding-left: 10px;
  padding-right: 10px;
  user-select: none;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    cursor: pointer;
  }

  &:active {
    background-color: rgba(255, 255, 255, 0.025);
  }
`;
const Title = styled.p`
  font-size: 18px;
  margin: 0;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  display: block;
  text-overflow: ellipsis;
  max-width: 100%;
`;
const LastMessage = styled.p`
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  display: inline-block;
  text-overflow: ellipsis;
  text-align: left;
  width: 100%;
  margin-right: 100px;
  margin: 0;
`;

/**
 * This class defines a ChatListItem UI.
 * ChatListItems simply display who is in the chat and the previous message sent
 */
export default class ChatListItem extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    lastMessage: PropTypes.string.isRequired,
    from: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired
  };

  render() {
    const { title, lastMessage, from, onClick } = this.props;

    return (
      <Wrapper onClick={onClick}>
        <Title>{title}</Title>
        {from && from !== "" ? (
          <LastMessage>
            <i>{from}</i>: {lastMessage}
          </LastMessage>
        ) : (
          <LastMessage>New conversation</LastMessage>
        )}
      </Wrapper>
    );
  }
}
