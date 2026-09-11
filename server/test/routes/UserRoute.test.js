"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const otplib_1 = require("otplib");
const supertest_1 = __importDefault(require("supertest"));
const testApp_1 = require("../helpers/testApp");
const auth_1 = require("../helpers/auth");
const app = (0, testApp_1.setupTestApp)();
describe("PUT /user", () => {
    it("updates the current user's profile fields", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, auth_1.createAuthenticatedUser)(app);
        const res = yield user.agent.put("/api/rest/user").send({
            name: "Updated Name",
            email: user.email,
            language: "es",
            region: "US",
        });
        expect(res.status).toBe(200);
        const policyRes = yield user.agent.get("/api/rest/app/policy");
        expect(policyRes.body.user).toMatchObject({ name: "Updated Name", language: "es" });
    }));
});
describe("PATCH /user/theme", () => {
    it("accepts a valid theme", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, auth_1.createAuthenticatedUser)(app);
        const res = yield user.agent.patch("/api/rest/user/theme").send({ theme: "library" });
        expect(res.status).toBe(200);
    }));
    it("rejects an invalid theme", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, auth_1.createAuthenticatedUser)(app);
        const res = yield user.agent.patch("/api/rest/user/theme").send({ theme: "not-a-theme" });
        expect(res.status).toBe(400);
    }));
});
describe("PATCH /user/sidebar-rail", () => {
    it("accepts a boolean", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, auth_1.createAuthenticatedUser)(app);
        const res = yield user.agent.patch("/api/rest/user/sidebar-rail").send({ sidebarRail: true });
        expect(res.status).toBe(200);
    }));
    it("rejects a non-boolean", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, auth_1.createAuthenticatedUser)(app);
        const res = yield user.agent.patch("/api/rest/user/sidebar-rail").send({ sidebarRail: "yes" });
        expect(res.status).toBe(400);
    }));
});
describe("PATCH /user/leasing", () => {
    it("accepts a boolean", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, auth_1.createAuthenticatedUser)(app);
        const res = yield user.agent.patch("/api/rest/user/leasing").send({ leasingEnabled: true });
        expect(res.status).toBe(200);
    }));
});
describe("POST /user/password", () => {
    it("changes the password and keeps the current session valid", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, auth_1.createAuthenticatedUser)(app);
        const ip = (0, auth_1.nextFakeIp)();
        const res = yield user.agent
            .post("/api/rest/user/password")
            .set("X-Forwarded-For", ip)
            .send({ currentPassword: auth_1.TEST_PASSWORD, newPassword: "NewPass123!" });
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ success: true });
        // The old password no longer works...
        const oldLoginRes = yield user.agent
            .post("/login")
            .set("X-Forwarded-For", ip)
            .send({ username: user.userCode, password: auth_1.TEST_PASSWORD });
        expect(oldLoginRes.status).toBe(401);
        // ...but the new one does.
        const newLoginRes = yield user.agent
            .post("/login")
            .set("X-Forwarded-For", ip)
            .send({ username: user.userCode, password: "NewPass123!" });
        expect(newLoginRes.status).toBe(200);
    }));
    it("rejects the wrong current password", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, auth_1.createAuthenticatedUser)(app);
        const res = yield user.agent
            .post("/api/rest/user/password")
            .set("X-Forwarded-For", (0, auth_1.nextFakeIp)())
            .send({ currentPassword: "WrongCurrent1!", newPassword: "NewPass123!" });
        expect(res.status).toBe(401);
    }));
    it("rejects a weak new password", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, auth_1.createAuthenticatedUser)(app);
        const res = yield user.agent
            .post("/api/rest/user/password")
            .set("X-Forwarded-For", (0, auth_1.nextFakeIp)())
            .send({ currentPassword: auth_1.TEST_PASSWORD, newPassword: "weak" });
        expect(res.status).toBe(400);
        expect(res.body.missing.length).toBeGreaterThan(0);
    }));
});
describe("GET /user/sessions and DELETE /user/sessions/:id", () => {
    it("lists the current session and can revoke it", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, auth_1.createAuthenticatedUser)(app);
        const listRes = yield user.agent.get("/api/rest/user/sessions");
        expect(listRes.status).toBe(200);
        expect(listRes.body.length).toBeGreaterThan(0);
        const current = listRes.body.find((s) => s.isCurrent);
        expect(current).toBeDefined();
        const deleteRes = yield user.agent.delete(`/api/rest/user/sessions/${current.id}`);
        expect(deleteRes.status).toBe(200);
        // The revoked session's own cookie no longer authenticates.
        const afterRes = yield user.agent.get("/api/rest/app/policy");
        expect(afterRes.status).toBe(302);
    }));
});
describe("GET /user/activity", () => {
    it("records a login event", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, auth_1.createAuthenticatedUser)(app);
        const res = yield user.agent.get("/api/rest/user/activity");
        expect(res.status).toBe(200);
        expect(res.body.some((a) => a.action === "login")).toBe(true);
    }));
});
describe("Two-factor authentication", () => {
    it("supports the full setup -> enable -> gated login -> disable round trip", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, auth_1.createAuthenticatedUser)(app);
        const setupRes = yield user.agent.post("/api/rest/user/2fa/setup");
        expect(setupRes.status).toBe(200);
        const { secret } = setupRes.body;
        expect(typeof secret).toBe("string");
        const enableRes = yield user.agent
            .post("/api/rest/user/2fa/enable")
            .set("X-Forwarded-For", (0, auth_1.nextFakeIp)())
            .send({ code: yield (0, otplib_1.generate)({ secret }) });
        expect(enableRes.status).toBe(200);
        expect(enableRes.body.success).toBe(true);
        expect(enableRes.body.backupCodes.length).toBeGreaterThan(0);
        // A fresh login now stops at the password step.
        const freshAgent = supertest_1.default.agent(app);
        const loginIp = (0, auth_1.nextFakeIp)();
        const loginRes = yield freshAgent
            .post("/login")
            .set("X-Forwarded-For", loginIp)
            .send({ username: user.userCode, password: auth_1.TEST_PASSWORD });
        expect(loginRes.body).toMatchObject({ success: true, twoFactorRequired: true });
        const twoFaRes = yield freshAgent
            .post("/login/2fa")
            .set("X-Forwarded-For", loginIp)
            .send({ code: yield (0, otplib_1.generate)({ secret }) });
        expect(twoFaRes.status).toBe(200);
        expect(twoFaRes.body).toMatchObject({ success: true, redirectUrl: "/app" });
        const disableRes = yield user.agent
            .post("/api/rest/user/2fa/disable")
            .set("X-Forwarded-For", (0, auth_1.nextFakeIp)())
            .send({ password: auth_1.TEST_PASSWORD });
        expect(disableRes.status).toBe(200);
    }));
    it("rejects enabling with an invalid code", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, auth_1.createAuthenticatedUser)(app);
        yield user.agent.post("/api/rest/user/2fa/setup");
        const res = yield user.agent
            .post("/api/rest/user/2fa/enable")
            .set("X-Forwarded-For", (0, auth_1.nextFakeIp)())
            .send({ code: "000000" });
        expect(res.status).toBe(401);
    }));
});
describe("DELETE /user (account deletion)", () => {
    it("rejects the wrong password", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, auth_1.createAuthenticatedUser)(app);
        const res = yield user.agent
            .delete("/api/rest/user")
            .set("X-Forwarded-For", (0, auth_1.nextFakeIp)())
            .send({ password: "WrongPassword1!" });
        expect(res.status).toBe(401);
    }));
    it("deletes the account with the correct password", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, auth_1.createAuthenticatedUser)(app);
        const res = yield user.agent
            .delete("/api/rest/user")
            .set("X-Forwarded-For", (0, auth_1.nextFakeIp)())
            .send({ password: auth_1.TEST_PASSWORD });
        expect(res.status).toBe(302);
        const loginRes = yield user.agent
            .post("/login")
            .set("X-Forwarded-For", (0, auth_1.nextFakeIp)())
            .send({ username: user.userCode, password: auth_1.TEST_PASSWORD });
        expect(loginRes.status).toBe(401);
    }));
});
//# sourceMappingURL=UserRoute.test.js.map