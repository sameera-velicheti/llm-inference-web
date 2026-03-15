Feature: Password Reset

  Scenario: User resets password with a valid token
    Given the user has requested a password reset
    When the user enters a valid reset token and a new password
    Then the password should be updated successfully