// Cucumber lifecycle hooks.
// Before each scenario: reset the cookie jar so sessions
// don't bleed between scenarios.

const { Before } = require('@cucumber/cucumber');
const { resetCookies } = require('./helpers');

Before(function () {
  resetCookies();
});
