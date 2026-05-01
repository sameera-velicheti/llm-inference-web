Feature: Chat System Features

  Scenario: Create a new chat thread
    Given I am logged in
    When I click the "New Chat" button
    Then a new chat thread should be created
    And the chat list should include the new chat

  Scenario: Select a model from dropdown
    Given I am on the chat page
    When I open the model dropdown
    And I select "GPT"
    Then the selected model should be "GPT"

  Scenario: View locally installed models
    Given I am on the chat page
    When I open the model dropdown
    Then I should see locally installed models listed

  Scenario: View public models
    Given I am on the chat page
    When I open the model dropdown
    Then I should see "GPT"
    And I should see "Gemini"
    And I should see "Claude"

  Scenario: Conversation memory is preserved
    Given I send a message "Hello"
    And I send another message "What did I just say?"
    Then the response should reference "Hello"

  Scenario: Enable math mode
    Given I am on the chat page
    When I enable math mode
    And I send a message "Solve 2+2"
    Then the response should contain "4"

  Scenario: Enable weather mode
    Given I am on the chat page
    When I enable weather mode
    And I send a message "What is the weather today?"
    Then the response should contain weather information
