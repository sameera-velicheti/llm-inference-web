const authView = require("../src/views/authView");

describe("authView", () => {

  // --- successResponse ---
  describe("successResponse()", () => {

    it("should return success: true", () => {
      const result = authView.successResponse("OK");
      expect(result.success).toBe(true);
    });

    it("should include the provided message", () => {
      const result = authView.successResponse("Login successful");
      expect(result.message).toBe("Login successful");
    });

    it("should spread extra data into the response", () => {
      const result = authView.successResponse("Done", { user: { id: 1, email: "a@b.com" } });
      expect(result.user).toEqual({ id: 1, email: "a@b.com" });
    });

    it("should work with no extra data provided", () => {
      const result = authView.successResponse("Logout successful");
      expect(result.success).toBe(true);
      expect(result.message).toBe("Logout successful");
    });

    it("should not include an error field", () => {
      const result = authView.successResponse("OK");
      expect(result.error).toBeUndefined();
    });

  });

  // --- errorResponse ---
  describe("errorResponse()", () => {

    it("should return success: false", () => {
      const result = authView.errorResponse("Something went wrong");
      expect(result.success).toBe(false);
    });

    it("should include the provided error message", () => {
      const result = authView.errorResponse("Email and password are required");
      expect(result.error).toBe("Email and password are required");
    });

    it("should not include a message field", () => {
      const result = authView.errorResponse("Bad input");
      expect(result.message).toBeUndefined();
    });

    it("should not include a user field", () => {
      const result = authView.errorResponse("Unauthorized");
      expect(result.user).toBeUndefined();
    });

  });

});