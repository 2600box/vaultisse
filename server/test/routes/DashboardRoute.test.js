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
describe("GET /dashboard", () => {
    it("requires auth", () => __awaiter(void 0, void 0, void 0, function* () {
        const { agent: unauth } = yield (0, auth_1.createAuthenticatedUser)(app);
        // sanity: an authenticated agent works, then compare against no auth at all.
        const authedRes = yield unauth.get("/api/rest/dashboard");
        expect(authedRes.status).toBe(200);
        const noAuthRes = yield (0, supertest_1.default)(app).get("/api/rest/dashboard");
        expect(noAuthRes.status).toBe(302);
    }));
    it("aggregates real counts for a fresh user with one book", () => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, auth_1.createAuthenticatedUser)(app);
        yield user.agent.post("/api/rest/book").field("name", "Dashboard Book");
        const res = yield user.agent.get("/api/rest/dashboard");
        expect(res.status).toBe(200);
        expect(res.body.totalBooks).toBe(1);
        expect(typeof res.body.totalBooks).toBe("number");
        expect(Array.isArray(res.body.lastBooks)).toBe(true);
        expect(res.body.lastBooks.some((b) => b.name === "Dashboard Book")).toBe(true);
    }));
});
//# sourceMappingURL=DashboardRoute.test.js.map