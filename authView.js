function successResponse(message, data = {}) {
  return { success: true, message, ...data };
}
function errorResponse(message) {
  return { success: false, error: message };
}
module.exports = { successResponse, errorResponse };
