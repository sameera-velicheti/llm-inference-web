Feature: Multiple LLM Responses

  Scenario: User submits a prompt and sees three responses
    Given the user is on the multi LLM page
    When the user submits a prompt
    Then the user should see three LLM responses