const db = require("../src/config/db");
const chatModel = require("../src/models/chatModel");

describe("chatModel (chat history)", () => {

  beforeEach(() => {
    spyOn(db, "prepare").and.callFake(() => ({
      run: jasmine.createSpy("run").and.returnValue({ lastInsertRowid: 10 }),
      get: jasmine.createSpy("get"),
      all: jasmine.createSpy("all").and.returnValue([])
    }));
  });

  it("should create a new chat", () => {
    const id = chatModel.createChat(1, "Test Chat");

    expect(db.prepare).toHaveBeenCalled();
    expect(id).toBe(10);
  });

  it("should add a message to chat", () => {
    chatModel.addMessage(1, "user", "Hello");

    const stmt = db.prepare();
    expect(stmt.run).toHaveBeenCalledWith(1, "user", "Hello");
  });

  it("should retrieve messages for a chat", () => {
    const stmt = db.prepare();
    stmt.all.and.returnValue([
      { role: "user", message: "Hi" }
    ]);

    const result = chatModel.getMessages(1);

    expect(result.length).toBe(1);
    expect(result[0].message).toBe("Hi");
  });

  it("should search chats", () => {
    const stmt = db.prepare();
    stmt.all.and.returnValue([{ id: 1, title: "Test" }]);

    const result = chatModel.searchChats(1, "Test");

    expect(result.length).toBeGreaterThan(0);
  });

});
