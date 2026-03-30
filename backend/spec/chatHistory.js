/*
// We spy on the db module so no real SQLite file is touched during tests.
// The db object exposes db.prepare() which returns a statement with .run()/.get().
// We intercept prepare() and return a fake statement object for each test.

const db = require("../src/config/db");

// Helper: creates a fake prepared statement with controllable run/get
function fakeStmt(runResult = {}, getResult = undefined) {
  return {
    run: jasmine.createSpy("run").and.returnValue(runResult),
    get: jasmine.createSpy("get").and.returnValue(getResult)
  };
}

describe("userModel", () => {

  let userModel;

  beforeEach(() => {
    // Re-require fresh each time so spies are clean
    // (Node caches modules, so we spy on db directly instead)
    userModel = require("../src/models/userModel");
  });

  afterEach(() => {
    // Remove all spies after each test
    jasmine.getEnv().allowRespy(true);
  });

  // --- createUser ---
  describe("createUser()", () => {

    it("should call db.prepare with an INSERT statement", () => {
      const stmt = fakeStmt({ lastInsertRowid: 42 });
      spyOn(db, "prepare").and.returnValue(stmt);

      userModel.createUser("testuser", "test@test.com", "hashedpw");

      expect(db.prepare).toHaveBeenCalledWith(jasmine.stringMatching(/INSERT INTO users/i));
    });

    it("should return the new user's id, username, and email", () => {
      const stmt = fakeStmt({ lastInsertRowid: 7 });
      spyOn(db, "prepare").and.returnValue(stmt);

      const result = userModel.createUser("testuser", "user@example.com", "hashedpw");

      expect(result).toEqual({ id: 7, username: "testuser", email: "user@example.com" });
    });

    it("should pass username, email, and passwordHash to stmt.run()", () => {
      const stmt = fakeStmt({ lastInsertRowid: 1 });
      spyOn(db, "prepare").and.returnValue(stmt);

      userModel.createUser("alice", "a@b.com", "abc123");

      expect(stmt.run).toHaveBeenCalledWith("alice", "a@b.com", "abc123");
    });

  });

  // --- findUserByUsername ---
  describe("findUserByUsername()", () => {

    it("should call db.prepare with a SELECT statement", () => {
      const stmt = fakeStmt({}, { id: 1, username: "alice", email: "a@b.com" });
      spyOn(db, "prepare").and.returnValue(stmt);

      userModel.findUserByUsername("alice");

      expect(db.prepare).toHaveBeenCalledWith(jasmine.stringMatching(/SELECT/i));
    });

    it("should return the user object when username is found", () => {
      const fakeUser = { id: 1, username: "alice", email: "a@b.com", password_hash: "hash" };
      const stmt = fakeStmt({}, fakeUser);
      spyOn(db, "prepare").and.returnValue(stmt);

      const result = userModel.findUserByUsername("alice");

      expect(result).toEqual(fakeUser);
    });

    it("should return undefined when username is not found", () => {
      const stmt = fakeStmt({}, undefined);
      spyOn(db, "prepare").and.returnValue(stmt);

      const result = userModel.findUserByUsername("ghost");

      expect(result).toBeUndefined();
    });

  });

  // --- findUserByEmail ---
  describe("findUserByEmail()", () => {

    it("should call db.prepare with a SELECT statement", () => {
      const stmt = fakeStmt({}, { id: 1, username: "alice", email: "a@b.com" });
      spyOn(db, "prepare").and.returnValue(stmt);

      userModel.findUserByEmail("a@b.com");

      expect(db.prepare).toHaveBeenCalledWith(jasmine.stringMatching(/SELECT/i));
    });

    it("should return the user object when found", () => {
      const fakeUser = { id: 1, username: "alice", email: "a@b.com", password_hash: "hash" };
      const stmt = fakeStmt({}, fakeUser);
      spyOn(db, "prepare").and.returnValue(stmt);

      const result = userModel.findUserByEmail("a@b.com");

      expect(result).toEqual(fakeUser);
    });

    it("should return undefined when user is not found", () => {
      const stmt = fakeStmt({}, undefined);
      spyOn(db, "prepare").and.returnValue(stmt);

      const result = userModel.findUserByEmail("notfound@test.com");

      expect(result).toBeUndefined();
    });

  });

  // --- saveResetToken ---
  describe("saveResetToken()", () => {

    it("should call db.prepare with an INSERT into password_reset_tokens", () => {
      const stmt = fakeStmt();
      spyOn(db, "prepare").and.returnValue(stmt);

      userModel.saveResetToken(1, "some-uuid-token");

      expect(db.prepare).toHaveBeenCalledWith(
        jasmine.stringMatching(/INSERT INTO password_reset_tokens/i)
      );
    });

    it("should pass userId and token to stmt.run()", () => {
      const stmt = fakeStmt();
      spyOn(db, "prepare").and.returnValue(stmt);

      userModel.saveResetToken(5, "my-token");

      expect(stmt.run).toHaveBeenCalledWith(5, "my-token");
    });

  });

  // --- findResetToken ---
  describe("findResetToken()", () => {

    it("should return the token record when a valid unused token is found", () => {
      const fakeRecord = { id: 1, user_id: 3, token: "abc", used: 0 };
      const stmt = fakeStmt({}, fakeRecord);
      spyOn(db, "prepare").and.returnValue(stmt);

      const result = userModel.findResetToken("abc");

      expect(result).toEqual(fakeRecord);
    });

    it("should return undefined when token is not found", () => {
      const stmt = fakeStmt({}, undefined);
      spyOn(db, "prepare").and.returnValue(stmt);

      const result = userModel.findResetToken("bad-token");

      expect(result).toBeUndefined();
    });

  });

  // --- markResetTokenUsed ---
  describe("markResetTokenUsed()", () => {

    it("should call db.prepare with an UPDATE statement", () => {
      const stmt = fakeStmt();
      spyOn(db, "prepare").and.returnValue(stmt);

      userModel.markResetTokenUsed("some-token");

      expect(db.prepare).toHaveBeenCalledWith(jasmine.stringMatching(/UPDATE password_reset_tokens/i));
    });

    it("should pass the token to stmt.run()", () => {
      const stmt = fakeStmt();
      spyOn(db, "prepare").and.returnValue(stmt);

      userModel.markResetTokenUsed("some-token");

      expect(stmt.run).toHaveBeenCalledWith("some-token");
    });

  });

  // --- updatePassword ---
  describe("updatePassword()", () => {

    it("should call db.prepare with an UPDATE users statement", () => {
      const stmt = fakeStmt();
      spyOn(db, "prepare").and.returnValue(stmt);

      userModel.updatePassword(1, "newhashedpw");

      expect(db.prepare).toHaveBeenCalledWith(jasmine.stringMatching(/UPDATE users/i));
    });

    it("should pass newHash and userId to stmt.run()", () => {
      const stmt = fakeStmt();
      spyOn(db, "prepare").and.returnValue(stmt);

      userModel.updatePassword(2, "newhash");

      // updatePassword does stmt.run(passwordHash, userId)
      expect(stmt.run).toHaveBeenCalledWith("newhash", 2);
    });

  });

  // --- logSession ---
  describe("logSession()", () => {

    it("should call db.prepare with an INSERT into sessions_log", () => {
      const stmt = fakeStmt();
      spyOn(db, "prepare").and.returnValue(stmt);

      userModel.logSession(1, false);

      expect(db.prepare).toHaveBeenCalledWith(
        jasmine.stringMatching(/INSERT INTO sessions_log/i)
      );
    });

    it("should pass 1 for isGuest when guest is true", () => {
      const stmt = fakeStmt();
      spyOn(db, "prepare").and.returnValue(stmt);

      userModel.logSession(null, true);

      expect(stmt.run).toHaveBeenCalledWith(null, 1);
    });

    it("should pass 0 for isGuest when guest is false", () => {
      const stmt = fakeStmt();
      spyOn(db, "prepare").and.returnValue(stmt);

      userModel.logSession(3, false);

      expect(stmt.run).toHaveBeenCalledWith(3, 0);
    });
  
  });

});
*/
