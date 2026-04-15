const chatController = require("../src/controllers/chatController");
const chatModel      = require("../src/models/chatModel");

function mockRes() {
  const res = {};
  res.status = jasmine.createSpy("status").and.returnValue(res);
  res.json   = jasmine.createSpy("json").and.returnValue(res);
  res.setHeader = jasmine.createSpy("setHeader");
  res.flushHeaders = jasmine.createSpy("flushHeaders");
  res.write  = jasmine.createSpy("write");
  res.end    = jasmine.createSpy("end");
  return res;
}

describe("chatController (Iteration 3)", () => {

  it("getUserChats should return user chats", async () => {
    spyOn(chatModel, "getChatsByUser").and.returnValue([{ id: 1 }]);
    const req = { session: { user: { id: 1 } } };
    const res = { json: jasmine.createSpy("json") };
    await chatController.getUserChats(req, res);
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  it("createChat should return the new chatId", async () => {
    spyOn(chatModel, "createChat").and.returnValue({ id: 7 });
    const req = { session: { user: { id: 1 } }, body: { title: "Test" } };
    const res = { json: jasmine.createSpy("json") };
    await chatController.createChat(req, res);
    expect(res.json).toHaveBeenCalledWith({ chatId: 7 });
  });

  it("getUserChats should return 500 on DB error", async () => {
    spyOn(chatModel, "getChatsByUser").and.throwError("DB error");
    const req = { session: { user: { id: 1 } } };
    const res = mockRes();
    await chatController.getUserChats(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("pinModel should call setPinnedModel and return success", async () => {
    spyOn(chatModel, "setPinnedModel");
    const req = { params: { chatId: "3" }, body: { model: "gemma3" } };
    const res = { json: jasmine.createSpy("json") };
    await chatController.pinModel(req, res);
    expect(chatModel.setPinnedModel).toHaveBeenCalledWith("3", "gemma3");
    expect(res.json).toHaveBeenCalledWith({ success: true, model: "gemma3" });
  });

  it("pinModel should set null model when unpinning", async () => {
    spyOn(chatModel, "setPinnedModel");
    const req = { params: { chatId: "3" }, body: { model: null } };
    const res = { json: jasmine.createSpy("json") };
    await chatController.pinModel(req, res);
    expect(chatModel.setPinnedModel).toHaveBeenCalledWith("3", null);
  });

  it("addMessage should pass model_name from request body", async () => {
    spyOn(chatModel, "addMessage").and.returnValue({ id: 1 });
    const req = { params: { chatId: "1" }, body: { role: "assistant", message: "Hi", model_name: "llama3.2" } };
    const res = { json: jasmine.createSpy("json") };
    await chatController.addMessage(req, res);
    expect(chatModel.addMessage).toHaveBeenCalledWith("1", "assistant", "Hi", "llama3.2");
  });

  it("streamMultiModel should return 400 if message param is missing", async () => {
    const req = { params: { chatId: "1" }, query: {}, session: {} };
    const res = mockRes();
    await chatController.streamMultiModel(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

});
