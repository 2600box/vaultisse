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
const supertest_1 = __importDefault(require("supertest"));
const testApp_1 = require("../helpers/testApp");
const auth_1 = require("../helpers/auth");
const app = (0, testApp_1.setupTestApp)();
/** A fresh {userName, email, name} triple for one register attempt - avoids colliding with other tests' accounts. */
function freshIdentity() {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return { userName: `auth_${suffix}`, email: `auth_${suffix}@example.com`, name: "Auth Test User" };
}
describe("POST /register", () => {
    it("creates an account that can immediately log in (REGISTRATION_REQUIRES_APPROVAL=false)", () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { userName, email, name } = freshIdentity();
        const ip = (0, auth_1.nextFakeIp)();
        const registerRes = yield (0, supertest_1.default)(app)
            .post("/register")
            .set("X-Forwarded-For", ip)
            .send({ userName, email, name, password: auth_1.TEST_PASSWORD });
        expect(registerRes.status).toBe(201);
        expect(registerRes.body).toMatchObject({ success: true, requiresApproval: false });
        const loginRes = yield (0, supertest_1.default)(app)
            .post("/login")
            .set("X-Forwarded-For", ip)
            .send({ username: userName, password: auth_1.TEST_PASSWORD });
        expect(loginRes.status).toBe(200);
        expect(loginRes.body).toMatchObject({ success: true, redirectUrl: "/app" });
        expect((_a = loginRes.headers["set-cookie"]) === null || _a === void 0 ? void 0 : _a[0]).toMatch(/^token=/);
    }));
    it("trims surrounding whitespace from username and email", () => __awaiter(void 0, void 0, void 0, function* () {
        const { userName, email, name } = freshIdentity();
        const ip = (0, auth_1.nextFakeIp)();
        const registerRes = yield (0, supertest_1.default)(app)
            .post("/register")
            .set("X-Forwarded-For", ip)
            .send({ userName: `  ${userName}  `, email: `  ${email}  `, name, password: auth_1.TEST_PASSWORD });
        expect(registerRes.status).toBe(201);
        // Logs in with the untrimmed username too - proves it was stored trimmed.
        const loginRes = yield (0, supertest_1.default)(app)
            .post("/login")
            .set("X-Forwarded-For", ip)
            .send({ username: userName, password: auth_1.TEST_PASSWORD });
        expect(loginRes.status).toBe(200);
    }));
    it("rejects a duplicate email/username with a generic message (no account enumeration)", () => __awaiter(void 0, void 0, void 0, function* () {
        const { userName, email, name } = freshIdentity();
        const ip = (0, auth_1.nextFakeIp)();
        const first = yield (0, supertest_1.default)(app)
            .post("/register")
            .set("X-Forwarded-For", ip)
            .send({ userName, email, name, password: auth_1.TEST_PASSWORD });
        expect(first.status).toBe(201);
        const second = yield (0, supertest_1.default)(app)
            .post("/register")
            .set("X-Forwarded-For", ip)
            .send({ userName, email, name, password: auth_1.TEST_PASSWORD });
        expect(second.status).toBe(400);
        expect(second.body.message).not.toMatch(/already exists|taken/i);
    }));
    it("rejects a weak password", () => __awaiter(void 0, void 0, void 0, function* () {
        const { userName, email, name } = freshIdentity();
        const res = yield (0, supertest_1.default)(app)
            .post("/register")
            .set("X-Forwarded-For", (0, auth_1.nextFakeIp)())
            .send({ userName, email, name, password: "weak" });
        expect(res.status).toBe(400);
    }));
    it("rejects an invalid email format", () => __awaiter(void 0, void 0, void 0, function* () {
        const { userName, name } = freshIdentity();
        const res = yield (0, supertest_1.default)(app)
            .post("/register")
            .set("X-Forwarded-For", (0, auth_1.nextFakeIp)())
            .send({ userName, email: "not-an-email", name, password: auth_1.TEST_PASSWORD });
        expect(res.status).toBe(400);
    }));
    it("rejects missing required fields", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .post("/register")
            .set("X-Forwarded-For", (0, auth_1.nextFakeIp)())
            .send({ userName: "onlyusername" });
        expect(res.status).toBe(400);
    }));
});
describe("POST /login", () => {
    it("rejects an unknown username", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .post("/login")
            .set("X-Forwarded-For", (0, auth_1.nextFakeIp)())
            .send({ username: "no-such-user", password: auth_1.TEST_PASSWORD });
        expect(res.status).toBe(401);
    }));
    it("rejects the wrong password for a real account", () => __awaiter(void 0, void 0, void 0, function* () {
        const { userName, email, name } = freshIdentity();
        const ip = (0, auth_1.nextFakeIp)();
        yield (0, supertest_1.default)(app)
            .post("/register")
            .set("X-Forwarded-For", ip)
            .send({ userName, email, name, password: auth_1.TEST_PASSWORD });
        const res = yield (0, supertest_1.default)(app)
            .post("/login")
            .set("X-Forwarded-For", ip)
            .send({ username: userName, password: "WrongPassword1!" });
        expect(res.status).toBe(401);
    }));
    it("rejects a missing username or password", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .post("/login")
            .set("X-Forwarded-For", (0, auth_1.nextFakeIp)())
            .send({ username: "someone" });
        expect(res.status).toBe(400);
    }));
});
describe("GET /logout", () => {
    it("clears the session cookie and redirects to /login", () => __awaiter(void 0, void 0, void 0, function* () {
        const { userName, email, name } = freshIdentity();
        const ip = (0, auth_1.nextFakeIp)();
        const agent = supertest_1.default.agent(app);
        yield agent.post("/register").set("X-Forwarded-For", ip).send({ userName, email, name, password: auth_1.TEST_PASSWORD });
        yield agent.post("/login").set("X-Forwarded-For", ip).send({ username: userName, password: auth_1.TEST_PASSWORD });
        const logoutRes = yield agent.get("/logout");
        expect(logoutRes.status).toBe(302);
        expect(logoutRes.headers.location).toBe("/login");
        // clearCookie's Set-Cookie removes it from the agent's jar, so the next
        // request carries no token at all - requireAuth redirects rather than 401s.
        const policyRes = yield agent.get("/api/rest/app/policy");
        expect(policyRes.status).toBe(302);
    }));
    it("still succeeds (redirects) with no cookie at all", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app).get("/logout");
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/login");
    }));
});
//# sourceMappingURL=AuthRoute.test.js.map