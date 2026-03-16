Feature: Forgot Password

  Scenario: Registered user requests a password reset token
    Given the user is on the reset password page
    When the user submits a registered email address
    Then a password reset token should be generated