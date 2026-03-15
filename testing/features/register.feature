Feature: User Registration

  Scenario: User creates an account with valid information
    Given the user is on the registration page
    When the user enters a unique username, valid email, and valid password
    Then the account should be created successfully