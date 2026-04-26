# testing/features/multi-model-chat.feature
# Acceptance tests for the "query multiple LLMs simultaneously" feature.

Feature: Query multiple LLMs simultaneously
  As a registered user
  I want to send a message to multiple language models at the same time
  So that I can compare their responses side by side in a single chat

  Background:
    Given I am logged in as a registered user
    And I have an existing chat session

  Scenario: User sees available models in the model selector bar
    When I open the chat page
    Then I should see a list of selectable models
    And each model should have a checkbox

  Scenario: All models are selected by default
    When I open the chat page
    Then all model checkboxes should be checked by default

  Scenario: User sends a message to multiple models
    Given I have selected models "Model A" and "Model B"
    When I type "What is the capital of France?" in the message input
    And I click the Send button
    Then I should see a response card for "Model A"
    And I should see a response card for "Model B"

  Scenario: Response cards appear in the same chat turn
    Given I have selected models "Model A" and "Model B"
    When I type "Tell me a joke" in the message input
    And I click the Send button
    Then the response cards for "Model A" and "Model B" should appear together in one group

  Scenario: User deselects a model before sending
    Given all models are selected
    When I uncheck the checkbox for "Model C"
    And I type "Hello" in the message input
    And I click the Send button
    Then I should see a response card for "Model A"
    And I should see a response card for "Model B"
    And I should not see a response card for "Model C"

  Scenario: User cannot send without selecting at least one model
    Given all model checkboxes are unchecked
    When I type "Hello" in the message input
    And I click the Send button
    Then I should see an alert saying "Please select at least one model"

  Scenario: A failing model shows an error card instead of blocking other responses
    Given model "Model B" is unavailable
    And I have selected models "Model A" and "Model B"
    When I type "Ping" in the message input
    And I click the Send button
    Then I should see a response card for "Model A" with a response
    And I should see an error card for "Model B"

  Scenario: Chat history preserves which model produced each response
    Given I have previously sent a message to "Model A" and "Model B"
    When I reload the chat
    Then I should see the response card for "Model A" with its previous reply
    And I should see the response card for "Model B" with its previous reply

  Scenario: User can search chats and reopen a multi-model conversation
    Given I have a chat titled "Paris question" with multi-model responses
    When I type "Paris" in the search box
    Then I should see "Paris question" in the chat list
    When I click on "Paris question"
    Then I should see the multi-model response cards from that conversation
