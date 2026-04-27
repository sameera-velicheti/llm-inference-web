Feature: Multi-Model LLM Chat
  Scenario: User sees available models in the selector bar
    Given the user is logged in
    When the user requests the list of available models
    Then a list of models should be returned

  Scenario: User queries multiple models simultaneously
    Given the user is logged in on the authenticated chat page
    When the user sends a message to multiple models
    Then a response from each selected model should be returned

  Scenario: User queries a single selected model
    Given the user is logged in on the authenticated chat page
    When the user sends a message to one model
    Then only one model response should be returned

  Scenario: Multi-model responses are saved to chat history
    Given the user is logged in on the authenticated chat page
    When the user sends a message to multiple models
    Then each model response should be saved to the chat history

  Scenario: Chat history preserves which model produced each response
    Given the user is logged in on the authenticated chat page
    When the user sends a message to multiple models
    Then each saved message should have a model name attached

  Scenario: User cannot query with no models selected
    Given the user is logged in on the authenticated chat page
    When the user sends a message with no models selected
    Then the server should return a 400 error
