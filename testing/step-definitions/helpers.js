// Shared helper for all step definition files.
// Manages a single cookie jar so session state is preserved
// across Given/When/Then steps and across authSteps/chatSteps files.

const BASE_URL = 'http://localhost:3000';

let cookieJar = '';

async function apiRequest(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieJar,
      ...(options.headers || {})
    }
  });

  // Capture session cookie from response and store it
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    cookieJar = setCookie.split(';')[0];
  }

  return res;
}

function resetCookies() {
  cookieJar = '';
}

module.exports = { apiRequest, resetCookies };
