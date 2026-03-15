Feature: User Logout

  Scenario: Authenticated user logs out successfully
    Given the user is logged in
    When the user logs out
    Then the session should be destroyed successfully