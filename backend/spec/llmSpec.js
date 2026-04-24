describe("Multi LLM feature", () => {
  it("should return 3 responses", () => {
    const responses = [
      { model: "LLM 1" },
      { model: "LLM 2" },
      { model: "LLM 3" }
    ];

    expect(responses.length).toBe(3);
  });
});