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
describe("GET /app/version", () => {
    it("responds with a version and uptime, unauthenticated", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app).get("/api/rest/app/version");
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("version");
        expect(typeof res.body.uptime).toBe("number");
    }));
});
describe("GET /app/policy", () => {
    it("redirects a request with no session cookie at all", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app).get("/api/rest/app/policy");
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/login");
    }));
    it("rejects a request with an invalid session cookie", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .get("/api/rest/app/policy")
            .set("Cookie", "token=not-a-real-jwt");
        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({ sessionExpired: true });
    }));
    it("returns the bootstrap payload for a logged-in user", () => __awaiter(void 0, void 0, void 0, function* () {
        const { agent, name, email } = yield (0, auth_1.createAuthenticatedUser)(app);
        const res = yield agent.get("/api/rest/app/policy");
        expect(res.status).toBe(200);
        expect(res.body.user).toMatchObject({ name, email });
        expect(Array.isArray(res.body.categories)).toBe(true);
        expect(Array.isArray(res.body.languages)).toBe(true);
        expect(Array.isArray(res.body.formats)).toBe(true);
        expect(Array.isArray(res.body.locations)).toBe(true);
        expect(Array.isArray(res.body.customers)).toBe(true);
        // Seeded by databaseSchema.sql - confirms the schema load in
        // globalSetup actually ran, not just that the endpoint responds.
        expect(res.body.formats.length).toBeGreaterThan(0);
        expect(res.body.languages.length).toBeGreaterThan(0);
        // Real value from AppService, not a hardcoded client-side copy -
        // see the MAX_IMPORT_FILE_SIZE_MB feature this guards against drifting.
        expect(res.body.maxImportFileSizeMb).toBe(10);
    }));
});
//# sourceMappingURL=AppRoute.test.js.map