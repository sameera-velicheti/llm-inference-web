Feature: Multi-Model Simultaneous Query

  Scenario: Authenticated user receives responses from all 3 models
    Given the user is logged in
    When the user creates a new chat and streams a message
    Then responses should be received from llama3.2, mistral, and gemma3

  Scenario: Guest user can stream multi-model responses
    Given a guest session is active
    When the guest streams a message to the multi-model endpoint
    Then the SSE stream should return tokens without error

  Scenario: User pins a chat to a single model
    Given the user is logged in
    When the user creates a chat and pins it to mistral
    Then the chat pinned_model should be set to mistral

  Scenario: User unpins a chat
    Given the user is logged in
    When the user creates a chat, pins it to gemma3, then unpins it
    Then the chat pinned_model should be null
