Feature: User Registration

  Scenario: User creates an account successfully
    Given the user is on the registration page
    When the user enters a valid username, email, and password
    Then the account should be created successfully