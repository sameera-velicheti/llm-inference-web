Feature: Chat History and Search

  Scenario: User views previous chats
    Given the user is logged in
    When the user opens the authenticated chat page
    Then the user's previous chats should be displayed

  Scenario: User reopens a previous chat
    Given the user is logged in on the authenticated chat page
    When the user selects a previous chat
    Then the messages from that chat should be displayed

  Scenario: User searches chats
    Given the user is logged in on the authenticated chat page
    When the user enters a keyword into the chat search bar
    Then matching chats should be displayed

  Scenario: Messages are automatically saved to chat history
    Given the user is logged in
    When the user sends a message in a chat
    Then the message should be automatically saved to chat history
