// All external dependencies (userModel, bcrypt, uuid) are spied on,
// so no real DB or crypto operations run during these unit tests.

const userModel = require("../src/models/userModel");
const bcrypt    = require("bcrypt");
const uuid      = require("uuid");

// Helper: builds a mock Express request
function mockReq({ body = {}, session = {}, query = {} } = {}) {
  return { body, session, query };
}

// Helper: builds a mock Express response that chains .status().json()
function mockRes() {
  const res = {};
  res.status = jasmine.createSpy("status").and.returnValue(res);
  res.json   = jasmine.createSpy("json").and.returnValue(res);
  return res;
}

describe("authController", () => {

  let authController;

  beforeEach(() => {
    authController = require("../src/controllers/authController");
  });

  // ─── register ───────────────────────────────────────────────────────────────

  describe("register()", () => {

    it("should return 400 if username is missing", async () => {
      const req = mockReq({ body: { email: "a@b.com", password: "Password1!" } });
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if email is missing", async () => {
      const req = mockReq({ body: { username: "alice", password: "Password1!" } });
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if password is missing", async () => {
      const req = mockReq({ body: { username: "alice", email: "a@b.com" } });
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if username is already taken", async () => {
      spyOn(userModel, "findUserByUsername").and.returnValue({ id: 2, username: "alice", email: "other@b.com" });

      const req = mockReq({ body: { username: "alice", email: "new@b.com", password: "Password1!" } });
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if user already exists", async () => {
      spyOn(userModel, "findUserByUsername").and.returnValue(undefined);
      spyOn(userModel, "findUserByEmail").and.returnValue({ id: 1, username: "alice", email: "a@b.com" });

      const req = mockReq({ body: { username: "alice", email: "a@b.com", password: "Password1!" } });
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 201 and set session on successful registration", async () => {
      spyOn(userModel, "findUserByUsername").and.returnValue(undefined);
      spyOn(userModel, "findUserByEmail").and.returnValue(undefined);
      spyOn(bcrypt, "hash").and.resolveTo("hashedpw");
      spyOn(userModel, "createUser").and.returnValue({ id: 5, username: "alice", email: "new@b.com" });

      const req = mockReq({ body: { username: "alice", email: "new@b.com", password: "Password1!" } });
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(req.session.user).toEqual({ id: 5, username: "alice", email: "new@b.com" });
    });

    it("should hash the password before storing it", async () => {
      spyOn(userModel, "findUserByUsername").and.returnValue(undefined);
      spyOn(userModel, "findUserByEmail").and.returnValue(undefined);
      spyOn(bcrypt, "hash").and.resolveTo("hashedpw");
      spyOn(userModel, "createUser").and.returnValue({ id: 5, username: "alice", email: "new@b.com" });

      const req = mockReq({ body: { username: "alice", email: "new@b.com", password: "Password1!" } });
      const res = mockRes();

      await authController.register(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith("Password1!", 10);
      expect(userModel.createUser).toHaveBeenCalledWith("alice", "new@b.com", "hashedpw");
    });

    it("should return 500 if an unexpected error occurs", async () => {
      spyOn(userModel, "findUserByUsername").and.throwError("DB crash");

      const req = mockReq({ body: { username: "alice", email: "a@b.com", password: "pw" } });
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

  });

  // ─── login ───────────────────────────────────────────────────────────────────

  describe("login()", () => {

    it("should return 400 if email is missing", async () => {
      const req = mockReq({ body: { password: "pw" } });
      const res = mockRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if password is missing", async () => {
      const req = mockReq({ body: { email: "a@b.com" } });
      const res = mockRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 401 if user is not found", async () => {
      spyOn(userModel, "findUserByEmail").and.returnValue(undefined);

      const req = mockReq({ body: { email: "ghost@b.com", password: "pw" } });
      const res = mockRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 401 if password does not match", async () => {
      spyOn(userModel, "findUserByEmail").and.returnValue({
        id: 1, username: "alice", email: "a@b.com", password_hash: "oldhash"
      });
      spyOn(bcrypt, "compare").and.resolveTo(false);

      const req = mockReq({ body: { email: "a@b.com", password: "wrongpw" } });
      const res = mockRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 200 and set session on successful login", async () => {
      spyOn(userModel, "findUserByEmail").and.returnValue({
        id: 1, username: "alice", email: "a@b.com", password_hash: "correcthash"
      });
      spyOn(bcrypt, "compare").and.resolveTo(true);

      const req = mockReq({ body: { email: "a@b.com", password: "correctpw" } });
      const res = mockRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(req.session.user).toEqual({ id: 1, username: "alice", email: "a@b.com" });
    });

    it("should return 500 on unexpected error", async () => {
      spyOn(userModel, "findUserByEmail").and.throwError("DB crash");

      const req = mockReq({ body: { email: "a@b.com", password: "pw" } });
      const res = mockRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

  });

  // ─── logout ──────────────────────────────────────────────────────────────────

  describe("logout()", () => {

    it("should call session.destroy()", () => {
      const req = mockReq({ session: { destroy: jasmine.createSpy("destroy").and.callFake(cb => cb()) } });
      const res = mockRes();

      authController.logout(req, res);

      expect(req.session.destroy).toHaveBeenCalled();
    });

    it("should return 200 after destroying session", () => {
      const req = mockReq({ session: { destroy: jasmine.createSpy("destroy").and.callFake(cb => cb()) } });
      const res = mockRes();

      authController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

  });

  // ─── guest ───────────────────────────────────────────────────────────────────

  describe("guest()", () => {

    it("should set session.guest to true", () => {
      spyOn(userModel, "logSession");

      const req = mockReq();
      const res = mockRes();

      authController.guest(req, res);

      expect(req.session.guest).toBe(true);
    });

    it("should return 200 on success", () => {
      spyOn(userModel, "logSession");

      const req = mockReq();
      const res = mockRes();

      authController.guest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should log the guest session in the database", () => {
      spyOn(userModel, "logSession");

      const req = mockReq();
      const res = mockRes();

      authController.guest(req, res);

      expect(userModel.logSession).toHaveBeenCalledWith(null, true);
    });

    it("should return 500 if logSession throws", () => {
      spyOn(userModel, "logSession").and.throwError("DB error");

      const req = mockReq();
      const res = mockRes();

      authController.guest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

  });

  // ─── forgotPassword ──────────────────────────────────────────────────────────

  describe("forgotPassword()", () => {

    it("should return 400 if email is missing", () => {
      const req = mockReq({ body: {} });
      const res = mockRes();

      authController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if user is not found", () => {
      spyOn(userModel, "findUserByEmail").and.returnValue(undefined);

      const req = mockReq({ body: { email: "ghost@b.com" } });
      const res = mockRes();

      authController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 200 and a token if user exists", () => {
      spyOn(userModel, "findUserByEmail").and.returnValue({ id: 2, email: "a@b.com" });
      spyOn(userModel, "saveResetToken");

      const req = mockReq({ body: { email: "a@b.com" } });
      const res = mockRes();

      authController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        jasmine.objectContaining({ token: jasmine.any(String) })
      );
    });

    it("should save the reset token to the database", () => {
      spyOn(userModel, "findUserByEmail").and.returnValue({ id: 2, email: "a@b.com" });
      spyOn(userModel, "saveResetToken");

      const req = mockReq({ body: { email: "a@b.com" } });
      const res = mockRes();

      authController.forgotPassword(req, res);

      expect(userModel.saveResetToken).toHaveBeenCalledWith(2, jasmine.any(String));
    });

  });

  // ─── resetPassword ───────────────────────────────────────────────────────────

  describe("resetPassword()", () => {

    it("should return 400 if token is missing", async () => {
      const req = mockReq({ body: { newPassword: "NewPw1!" } });
      const res = mockRes();

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if newPassword is missing", async () => {
      const req = mockReq({ body: { token: "some-token" } });
      const res = mockRes();

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if token is invalid or already used", async () => {
      spyOn(userModel, "findResetToken").and.returnValue(undefined);

      const req = mockReq({ body: { token: "bad-token", newPassword: "NewPw1!" } });
      const res = mockRes();

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 200 on successful password reset", async () => {
      spyOn(userModel, "findResetToken").and.returnValue({ id: 1, user_id: 3, token: "good-token", used: 0 });
      spyOn(bcrypt, "hash").and.resolveTo("newhashedpw");
      spyOn(userModel, "updatePassword");
      spyOn(userModel, "markResetTokenUsed");

      const req = mockReq({ body: { token: "good-token", newPassword: "NewPw1!" } });
      const res = mockRes();

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should update the password and mark token as used", async () => {
      spyOn(userModel, "findResetToken").and.returnValue({ id: 1, user_id: 3, token: "good-token", used: 0 });
      spyOn(bcrypt, "hash").and.resolveTo("newhashedpw");
      spyOn(userModel, "updatePassword");
      spyOn(userModel, "markResetTokenUsed");

      const req = mockReq({ body: { token: "good-token", newPassword: "NewPw1!" } });
      const res = mockRes();

      await authController.resetPassword(req, res);

      expect(userModel.updatePassword).toHaveBeenCalledWith(3, "newhashedpw");
      expect(userModel.markResetTokenUsed).toHaveBeenCalledWith("good-token");
    });

    it("should return 500 on unexpected error", async () => {
      spyOn(userModel, "findResetToken").and.throwError("DB crash");

      const req = mockReq({ body: { token: "t", newPassword: "pw" } });
      const res = mockRes();

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

  });

  // ─── me ──────────────────────────────────────────────────────────────────────

  describe("me()", () => {

    it("should return 200", () => {
      const req = mockReq({ session: {} });
      const res = mockRes();

      authController.me(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return user from session if logged in", () => {
      const req = mockReq({ session: { user: { id: 1, username: "alice", email: "a@b.com" } } });
      const res = mockRes();

      authController.me(req, res);

      expect(res.json).toHaveBeenCalledWith(
        jasmine.objectContaining({ user: { id: 1, username: "alice", email: "a@b.com" } })
      );
    });

    it("should return guest: true if in a guest session", () => {
      const req = mockReq({ session: { guest: true } });
      const res = mockRes();

      authController.me(req, res);

      expect(res.json).toHaveBeenCalledWith(
        jasmine.objectContaining({ guest: true })
      );
    });

    it("should return null user and false guest when no session", () => {
      const req = mockReq({ session: {} });
      const res = mockRes();

      authController.me(req, res);

      expect(res.json).toHaveBeenCalledWith(
        jasmine.objectContaining({ user: null, guest: false })
      );
    });

  });

});