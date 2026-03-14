const { requireAuth } = require("../src/middleware/authMiddleware");

// Helper to build a mock request with a given session
function mockReq(session = {}) {
  return { session };
}

// Helper to build a mock response that captures status and json calls
function mockRes() {
  const res = {};
  res.status = jasmine.createSpy("status").and.returnValue(res);
  res.json   = jasmine.createSpy("json").and.returnValue(res);
  return res;
}

describe("authMiddleware", () => {

  describe("requireAuth()", () => {

    it("should call next() when a regular user session exists", () => {
      const req  = mockReq({ user: { id: 1, email: "a@b.com" } });
      const res  = mockRes();
      const next = jasmine.createSpy("next");

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should call next() when a CAS user session exists", () => {
      const req  = mockReq({ casUser: { netid: "abc123" } });
      const res  = mockRes();
      const next = jasmine.createSpy("next");

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should call next() when a guest session exists", () => {
      const req  = mockReq({ guest: true });
      const res  = mockRes();
      const next = jasmine.createSpy("next");

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should return 401 when no session exists", () => {
      const req  = mockReq({});
      const res  = mockRes();
      const next = jasmine.createSpy("next");

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("should return a JSON error body when no session exists", () => {
      const req  = mockReq({});
      const res  = mockRes();
      const next = jasmine.createSpy("next");

      requireAuth(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        jasmine.objectContaining({ success: false })
      );
    });

    it("should not call next() when session exists but is empty object", () => {
      const req  = mockReq({ user: null, guest: false, casUser: null });
      const res  = mockRes();
      const next = jasmine.createSpy("next");

      requireAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });

  });

});