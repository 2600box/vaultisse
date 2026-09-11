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
exports.TEST_PASSWORD = void 0;
exports.nextFakeIp = nextFakeIp;
exports.createAuthenticatedUser = createAuthenticatedUser;
/**
 * Creates a fresh, real user account (via the actual POST /register + POST
 * /login flow - not a DB shortcut) and returns a `supertest` agent that
 * carries its session cookie on every subsequent request, the same way a
 * logged-in browser tab would.
 *
 * POST /login and /register share one rate limiter (5 requests / 5 minutes
 * per IP - see `authLimiter` in AuthRoute.ts). Since TRUST_PROXY=true in
 * tests (see test/setup/testEnv.js), each call here spoofs its own
 * `X-Forwarded-For` IP so many tests can each register+log in without ever
 * sharing - and so tripping - that limiter's bucket.
 */
const supertest_1 = __importDefault(require("supertest"));
let ipCounter = 0;
/**
 * A fresh, unique fake source IP each call - exported so tests that exercise
 * `/register` or `/login` directly (rather than through
 * `createAuthenticatedUser` below) can still give each attempt its own
 * `authLimiter` bucket via `X-Forwarded-For`.
 */
function nextFakeIp() {
    ipCounter += 1;
    return `10.${(ipCounter >> 16) & 255}.${(ipCounter >> 8) & 255}.${ipCounter & 255}`;
}
/** A password meeting AuthRoute's register rules (8+ chars, uppercase, digit, special char). */
exports.TEST_PASSWORD = "Test1234!";
function createAuthenticatedUser(app_1) {
    return __awaiter(this, arguments, void 0, function* (app, name = "Test User") {
        const ip = nextFakeIp();
        const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const userCode = `test_${suffix}`;
        const email = `${userCode}@example.com`;
        const password = exports.TEST_PASSWORD;
        const agent = supertest_1.default.agent(app);
        const registerRes = yield agent
            .post("/register")
            .set("X-Forwarded-For", ip)
            .send({ userName: userCode, email, name, password });
        if (registerRes.status !== 201 && registerRes.status !== 200) {
            throw new Error(`Failed to register test user: ${registerRes.status} ${JSON.stringify(registerRes.body)}`);
        }
        const loginRes = yield agent
            .post("/login")
            .set("X-Forwarded-For", ip)
            .send({ username: userCode, password });
        if (loginRes.status !== 200 || !loginRes.body.success) {
            throw new Error(`Failed to log in test user: ${loginRes.status} ${JSON.stringify(loginRes.body)}`);
        }
        return { agent, userCode, email, password, name };
    });
}
//# sourceMappingURL=auth.js.map