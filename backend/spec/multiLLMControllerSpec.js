const multiLLMController = require("../src/controllers/multiLLMController");

describe("multiLLMController", () => {
  let req;
  let res;
  let statusJsonSpy;

  beforeEach(() => {
    statusJsonSpy = jasmine.createSpy("statusJson");

    res = {
      status: jasmine.createSpy("status").and.returnValue({
        json: statusJsonSpy
      }),
      json: jasmine.createSpy("json")
    };
  });

  describe("getMultiResponses", () => {
    it("should return 400 if prompt is missing", async () => {
      req = { body: {} };

      await multiLLMController.getMultiResponses(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(statusJsonSpy).toHaveBeenCalledWith({
        error: "Prompt is required"
      });
    });

    it("should return three LLM responses", async () => {
      req = { body: { prompt: "Explain recursion" } };

      await multiLLMController.getMultiResponses(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const responseArg = statusJsonSpy.calls.mostRecent().args[0];

      expect(responseArg.prompt).toBe("Explain recursion");
      expect(responseArg.responses.length).toBe(3);
      expect(responseArg.responses[0].model).toBe("ChatGPT");
      expect(responseArg.responses[1].model).toBe("Claude");
      expect(responseArg.responses[2].model).toBe("Gemini");
    });
  });

  describe("regenerateResponse", () => {
    it("should return 400 if model is missing", async () => {
      req = { body: { prompt: "Explain recursion" } };

      await multiLLMController.regenerateResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(statusJsonSpy).toHaveBeenCalledWith({
        error: "Model and prompt are required"
      });
    });

    it("should return 400 if prompt is missing", async () => {
      req = { body: { model: "ChatGPT" } };

      await multiLLMController.regenerateResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(statusJsonSpy).toHaveBeenCalledWith({
        error: "Model and prompt are required"
      });
    });

    it("should regenerate response for selected model", async () => {
      req = {
        body: {
          model: "ChatGPT",
          prompt: "Explain recursion"
        }
      };

      await multiLLMController.regenerateResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const responseArg = statusJsonSpy.calls.mostRecent().args[0];

      expect(responseArg.model).toBe("ChatGPT");
      expect(responseArg.response).toContain("regenerated");
    });
  });

  describe("continueWithModel", () => {
    it("should return 400 if model is missing", async () => {
      req = { body: { prompt: "Give more detail" } };

      await multiLLMController.continueWithModel(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(statusJsonSpy).toHaveBeenCalledWith({
        error: "Model and prompt are required"
      });
    });

    it("should return 400 if prompt is missing", async () => {
      req = { body: { model: "Claude" } };

      await multiLLMController.continueWithModel(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(statusJsonSpy).toHaveBeenCalledWith({
        error: "Model and prompt are required"
      });
    });

    it("should continue with selected model", async () => {
      req = {
        body: {
          model: "Claude",
          prompt: "Give more detail"
        }
      };

      await multiLLMController.continueWithModel(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const responseArg = statusJsonSpy.calls.mostRecent().args[0];

      expect(responseArg.model).toBe("Claude");
      expect(responseArg.response).toContain("continued");
    });
  });
});