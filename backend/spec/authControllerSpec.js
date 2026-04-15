const userModel = require("../src/models/userModel");
const bcrypt    = require("bcrypt");
function mockReq({body={},session={},query={}}={}) { return {body,session,query}; }
function mockRes() { const r={}; r.status=jasmine.createSpy("status").and.returnValue(r); r.json=jasmine.createSpy("json").and.returnValue(r); return r; }

describe("authController", () => {
  let authController;
  beforeEach(() => { authController = require("../src/controllers/authController"); });

  describe("register()", () => {
    it("should return 400 if username is missing", async () => {
      const res=mockRes(); await authController.register(mockReq({body:{email:"a@b.com",password:"P1!"}}),res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("should return 400 if email is missing", async () => {
      const res=mockRes(); await authController.register(mockReq({body:{username:"alice",password:"P1!"}}),res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("should return 400 if password is missing", async () => {
      const res=mockRes(); await authController.register(mockReq({body:{username:"alice",email:"a@b.com"}}),res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("should return 400 for invalid email format", async () => {
      const res=mockRes(); await authController.register(mockReq({body:{username:"alice",email:"notanemail",password:"P1!"}}),res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("should return 400 if username is taken", async () => {
      spyOn(userModel,"findUserByUsername").and.returnValue({id:2});
      const res=mockRes(); await authController.register(mockReq({body:{username:"alice",email:"new@b.com",password:"P1!"}}),res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("should return 400 if email already registered", async () => {
      spyOn(userModel,"findUserByUsername").and.returnValue(undefined);
      spyOn(userModel,"findUserByEmail").and.returnValue({id:1});
      const res=mockRes(); await authController.register(mockReq({body:{username:"alice",email:"a@b.com",password:"P1!"}}),res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("should return 201 and set session on success", async () => {
      spyOn(userModel,"findUserByUsername").and.returnValue(undefined);
      spyOn(userModel,"findUserByEmail").and.returnValue(undefined);
      spyOn(bcrypt,"hash").and.resolveTo("h");
      spyOn(userModel,"createUser").and.returnValue({id:5,username:"alice",email:"new@b.com"});
      const req=mockReq({body:{username:"alice",email:"new@b.com",password:"P1!"}}); const res=mockRes();
      await authController.register(req,res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(req.session.user).toEqual({id:5,username:"alice",email:"new@b.com"});
    });
    it("should hash password before storing", async () => {
      spyOn(userModel,"findUserByUsername").and.returnValue(undefined);
      spyOn(userModel,"findUserByEmail").and.returnValue(undefined);
      spyOn(bcrypt,"hash").and.resolveTo("h");
      spyOn(userModel,"createUser").and.returnValue({id:5,username:"alice",email:"new@b.com"});
      const req=mockReq({body:{username:"alice",email:"new@b.com",password:"P1!"}}); const res=mockRes();
      await authController.register(req,res);
      expect(bcrypt.hash).toHaveBeenCalledWith("P1!",10);
    });
    it("should return 500 on unexpected error", async () => {
      spyOn(userModel,"findUserByUsername").and.throwError("DB crash");
      const res=mockRes(); await authController.register(mockReq({body:{username:"a",email:"a@b.com",password:"p"}}),res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("login()", () => {
    it("should return 400 if email missing", async () => {
      const res=mockRes(); await authController.login(mockReq({body:{password:"p"}}),res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("should return 400 if password missing", async () => {
      const res=mockRes(); await authController.login(mockReq({body:{email:"a@b.com"}}),res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it("should return 401 if user not found", async () => {
      spyOn(userModel,"findUserByEmail").and.returnValue(undefined);
      const res=mockRes(); await authController.login(mockReq({body:{email:"x@x.com",password:"p"}}),res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
    it("should return 401 if password wrong", async () => {
      spyOn(userModel,"findUserByEmail").and.returnValue({id:1,password_hash:"h"});
      spyOn(bcrypt,"compare").and.resolveTo(false);
      const res=mockRes(); await authController.login(mockReq({body:{email:"a@b.com",password:"wrong"}}),res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
    it("should return 200 and set session on success", async () => {
      spyOn(userModel,"findUserByEmail").and.returnValue({id:1,username:"alice",email:"a@b.com",password_hash:"h"});
      spyOn(bcrypt,"compare").and.resolveTo(true);
      const req=mockReq({body:{email:"a@b.com",password:"p"}}); const res=mockRes();
      await authController.login(req,res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(req.session.user).toEqual({id:1,username:"alice",email:"a@b.com"});
    });
    it("should return 500 on error", async () => {
      spyOn(userModel,"findUserByEmail").and.throwError("crash");
      const res=mockRes(); await authController.login(mockReq({body:{email:"a@b.com",password:"p"}}),res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("logout()", () => {
    it("should call session.destroy", () => {
      const req=mockReq({session:{destroy:jasmine.createSpy("d").and.callFake(cb=>cb())}});
      authController.logout(req,mockRes());
      expect(req.session.destroy).toHaveBeenCalled();
    });
    it("should return 200", () => {
      const req=mockReq({session:{destroy:jasmine.createSpy("d").and.callFake(cb=>cb())}});
      const res=mockRes(); authController.logout(req,res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("guest()", () => {
    it("should set session.guest to true", () => {
      spyOn(userModel,"logSession"); const req=mockReq(); authController.guest(req,mockRes());
      expect(req.session.guest).toBe(true);
    });
    it("should return 200", () => {
      spyOn(userModel,"logSession"); const res=mockRes(); authController.guest(mockReq(),res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it("should log the guest session", () => {
      spyOn(userModel,"logSession"); authController.guest(mockReq(),mockRes());
      expect(userModel.logSession).toHaveBeenCalledWith(null,true);
    });
    it("should return 500 if logSession throws", () => {
      spyOn(userModel,"logSession").and.throwError("err"); const res=mockRes();
      authController.guest(mockReq(),res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("me()", () => {
    it("should return 200", () => {
      const res=mockRes(); authController.me(mockReq({session:{}}),res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it("should return user from session", () => {
      const res=mockRes(); authController.me(mockReq({session:{user:{id:1,username:"alice",email:"a@b.com"}}}),res);
      expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({user:{id:1,username:"alice",email:"a@b.com"}}));
    });
    it("should return guest:true for guest session", () => {
      const res=mockRes(); authController.me(mockReq({session:{guest:true}}),res);
      expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({guest:true}));
    });
    it("should return null user when no session", () => {
      const res=mockRes(); authController.me(mockReq({session:{}}),res);
      expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({user:null,guest:false}));
    });
  });
});
