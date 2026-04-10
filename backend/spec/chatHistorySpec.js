describe("getMessages()", () => {
  it("should call db.prepare", () => {
    spyOn(db, "prepare").and.returnValue(fakeStmt);

    chatHistory.getMessages(1);

    expect(db.prepare).toHaveBeenCalled();
  });
});
