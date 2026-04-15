// Unit tests for chatModel.js (Iteration 3)
// Verifies new model_name and pinned_model support.

const db        = require("../src/config/db");
const chatModel = require("../src/models/chatModel");

describe("chatModel (Iteration 3)", () => {

  let mockStmt;

  beforeEach(() => {
    mockStmt = {
      run: jasmine.createSpy("run").and.returnValue({ lastInsertRowid: 10 }),
      get: jasmine.createSpy("get"),
      all: jasmine.createSpy("all").and.returnValue([])
    };
    spyOn(db, "prepare").and.returnValue(mockStmt);
  });

  describe("addMessage()", () => {
    it("should pass model_name as 4th parameter to stmt.run", () => {
      chatModel.addMessage(1, "assistant", "Hello", "mistral");
      expect(mockStmt.run).toHaveBeenCalledWith(1, "assistant", "Hello", "mistral");
    });

    it("should pass null model_name for user messages", () => {
      chatModel.addMessage(1, "user", "Hi", null);
      expect(mockStmt.run).toHaveBeenCalledWith(1, "user", "Hi", null);
    });

    it("should return the new message id", () => {
      const result = chatModel.addMessage(1, "user", "Hi", null);
      expect(result.id).toBe(10);
    });
  });

  describe("setPinnedModel()", () => {
    it("should call UPDATE chats with the model name", () => {
      chatModel.setPinnedModel(5, "gemma3");
      expect(db.prepare).toHaveBeenCalledWith(jasmine.stringMatching(/UPDATE chats/i));
      expect(mockStmt.run).toHaveBeenCalledWith("gemma3", 5);
    });

    it("should set pinned_model to null when unpinning", () => {
      chatModel.setPinnedModel(5, null);
      expect(mockStmt.run).toHaveBeenCalledWith(null, 5);
    });
  });

  describe("createChat()", () => {
    it("should return an object with the new chat id", () => {
      const result = chatModel.createChat(1, "Test");
      expect(result.id).toBe(10);
    });
  });

  describe("getMessages()", () => {
    it("should return all messages for a chat including model_name", () => {
      mockStmt.all.and.returnValue([
        { id: 1, role: "user",      message: "Hi",    model_name: null },
        { id: 2, role: "assistant", message: "Hello", model_name: "mistral" }
      ]);
      const msgs = chatModel.getMessages(1);
      expect(msgs.length).toBe(2);
      expect(msgs[1].model_name).toBe("mistral");
    });
  });

});
