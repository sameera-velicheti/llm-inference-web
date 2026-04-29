Feature: Multi-LLM Response Comparison

  Scenario: User sends prompt and receives responses from multiple LMMs
    Given the user is logged into their account
    And the user is on the chat page
    When the user enters "What is machine learning?"
    And clicks the send button
    Then OpenAI should generate a response
    And Gemini should generate a response
    And Claude should generate a response
