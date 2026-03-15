Feature: User Login

  Scenario: Registered user logs in successfully
    Given the user is on the login page
    When the user enters a valid email and password
    Then the user should be redirected to the authenticated chat page