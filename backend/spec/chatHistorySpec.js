const db = require("../src/config/db");
const chatModel = require("../src/models/chatModel");

describe("chatModel (chat history)", () => {

  let mockStmt;

  beforeEach(() => {
    // Create the mock statement once and hold a reference to it
    mockStmt = {
      run: jasmine.createSpy("run").and.returnValue({ lastInsertRowid: 10 }),
      get: jasmine.createSpy("get"),
      all: jasmine.createSpy("all").and.returnValue([])
    };
    spyOn(db, "prepare").and.returnValue(mockStmt);
  });

  it("should create a new chat", () => {
    const result = chatModel.createChat(1, "Test Chat");

    expect(db.prepare).toHaveBeenCalled();
    // createChat returns { id: lastInsertRowid } so check result.id
    expect(result.id).toBe(10);
  });

  it("should add a message to chat", () => {
    chatModel.addMessage(1, "user", "Hello");

    // Use mockStmt directly — no second prepare() call needed
    expect(mockStmt.run).toHaveBeenCalledWith(1, "user", "Hello");
  });

  it("should retrieve messages for a chat", () => {
    // Set the return value on mockStmt before calling the model
    mockStmt.all.and.returnValue([
      { role: "user", message: "Hi" }
    ]);

    const result = chatModel.getMessages(1);

    expect(result.length).toBe(1);
    expect(result[0].message).toBe("Hi");
  });

  it("should search chats", () => {
    mockStmt.all.and.returnValue([{ id: 1, title: "Test" }]);

    const result = chatModel.searchChats(1, "Test");

    expect(result.length).toBeGreaterThan(0);
  });

});