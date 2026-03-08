// Format a successful JSON response 
function successResponse(message, data = {}) {
    return {
      success: true,
      message,
      ...data
    };
  }
  
  // Error response format
  function errorResponse(message) {
    return {
      success: false,
      error: message
    };
  }
  
  module.exports = {
    successResponse,
    errorResponse
  };