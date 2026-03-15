Feature: Guest Access

  Scenario: User starts a guest session
    Given the user is on the landing page
    When the user selects guest access
    Then the user should be redirected to the guest chat page