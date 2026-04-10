const chatController = require("../src/controllers/chatController");
const chatModel = require("../src/models/chatModel");

describe("chatController", () => {

  it("should return user chats", async () => {
    spyOn(chatModel, "getChatsByUser").and.returnValue([{ id: 1 }]);

    const req = { session: { user: { id: 1 } } };
    const res = { json: jasmine.createSpy("json") };

    await chatController.getUserChats(req, res);

    expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  it("should create chat", async () => {
    spyOn(chatModel, "createChat").and.returnValue(5);

    const req = {
      session: { user: { id: 1 } },
      body: { title: "New Chat" }
    };

    const res = { json: jasmine.createSpy("json") };

    await chatController.createChat(req, res);

    expect(res.json).toHaveBeenCalledWith({ chatId: 5 });
  });

  it("should handle errors", async () => {
    spyOn(chatModel, "getChatsByUser").and.throwError("DB error");

    const req = { session: { user: { id: 1 } } };
    const res = {
      status: jasmine.createSpy("status").and.returnValue({
        json: jasmine.createSpy("json")
      })
    };

    await chatController.getUserChats(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});
