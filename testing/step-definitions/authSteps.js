const { Given, When, Then } = require('@cucumber/cucumber');

Given('the user is on the landing page', function () {
  console.log('User is on the landing page');
});

When('the user selects guest access', function () {
  console.log('User selects guest access');
});

Then('the user should be redirected to the guest chat page', function () {
  console.log('User is redirected to the guest chat page');
});

Given('the user is on the login page', function () {
  console.log('User is on the login page');
});

When('the user enters a valid email and password', function () {
  console.log('User enters valid login credentials');
});

Then('the user should be redirected to the authenticated chat page', function () {
  console.log('User is redirected to the authenticated chat page');
});

Given('the user is on the registration page', function () {
  console.log('User is on the registration page');
});

When('the user enters a unique username, valid email, and valid password', function () {
  console.log('User enters unique username, valid email, and valid password');
});

Then('the account should be created successfully', function () {
  console.log('Account created successfully');
});

Given('the user is on the reset password page', function () {
  console.log('User is on the reset password page');
});

When('the user submits a registered email address', function () {
  console.log('User submits a registered email address');
});

Then('a password reset token should be generated', function () {
  console.log('Password reset token is generated');
});

Given('the user has requested a password reset', function () {
  console.log('User has requested a password reset');
});

When('the user enters a valid reset token and a new password', function () {
  console.log('User enters a valid reset token and a new password');
});

Then('the password should be updated successfully', function () {
  console.log('Password updated successfully');
});

Given('the user is logged in', function () {
  console.log('User is logged in');
});

When('the user logs out', function () {
  console.log('User logs out');
});

Then('the session should be destroyed successfully', function () {
  console.log('Session destroyed successfully');
});

Given('the user is logged in on the authenticated chat page', function () {
  console.log('User is logged in and on the authenticated chat page');
});

When('the user opens the authenticated chat page', function () {
  console.log('User opens the authenticated chat page');
});

Then("the user's previous chats should be displayed", function () {
  console.log("User's previous chats are displayed");
});

When('the user selects a previous chat', function () {
  console.log('User selects a previous chat');
});

Then('the messages from that chat should be displayed', function () {
  console.log('Messages from the selected chat are displayed');
});

When('the user enters a keyword into the chat search bar', function () {
  console.log('User enters a keyword into the chat search bar');
});

Then('matching chats should be displayed', function () {
  console.log('Matching chats are displayed');
});
