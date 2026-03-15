const { Given, When, Then } = require('@cucumber/cucumber');

Given('the user is on the login page', function () {
  console.log('User is on the login page');
});

When('the user enters a valid email and password', function () {
  console.log('User enters valid login credentials');
});

Then('the user should be redirected to the user chat page', function () {
  console.log('User is redirected to the user chat page');
});

Given('the user is on the registration page', function () {
  console.log('User is on the registration page');
});

When('the user enters a valid username, email, and password', function () {
  console.log('User enters valid registration information');
});

Then('the account should be created successfully', function () {
  console.log('Account created successfully');
});

Given('the user is on the landing page', function () {
  console.log('User is on the landing page');
});

When('the user selects guest access', function () {
  console.log('User selects guest access');
});

Then('the user should be redirected to the guest chat page', function () {
  console.log('User is redirected to the guest chat page');
});

Given('the user has requested a password reset', function () {
  console.log('User requested password reset');
});

When('the user enters a valid reset token and a new password', function () {
  console.log('User enters reset token and new password');
});

Then('the password should be updated successfully', function () {
  console.log('Password updated successfully');
});