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
let user;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    user = yield (0, auth_1.createAuthenticatedUser)(app);
}));
describe("category CRUD", () => {
    it("requires auth", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app).get("/api/rest/category");
        expect(res.status).toBe(302);
    }));
    it("starts with no categories for a fresh user", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield user.agent.get("/api/rest/category");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    }));
    it("creates, lists, renames and deletes a category", () => __awaiter(void 0, void 0, void 0, function* () {
        const createRes = yield user.agent.post("/api/rest/category").send({ name: "Fantasy" });
        expect(createRes.status).toBe(200);
        expect(createRes.body).toMatchObject({ name: "Fantasy" });
        const id = createRes.body.id;
        expect(typeof id).toBe("number");
        const listRes = yield user.agent.get("/api/rest/category");
        expect(listRes.body).toEqual(expect.arrayContaining([{ id, name: "Fantasy" }]));
        const renameRes = yield user.agent.put(`/api/rest/category/${id}`).send({ name: "Sci-Fi" });
        expect(renameRes.status).toBe(200);
        expect(renameRes.body).toMatchObject({ id, name: "Sci-Fi" });
        const deleteRes = yield user.agent.delete(`/api/rest/category/${id}`);
        expect(deleteRes.status).toBe(200);
        const finalListRes = yield user.agent.get("/api/rest/category");
        expect(finalListRes.body).not.toEqual(expect.arrayContaining([expect.objectContaining({ id })]));
    }));
    it("404s deleting a category that doesn't exist", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield user.agent.delete("/api/rest/category/999999999");
        expect(res.status).toBe(404);
    }));
    it("keeps categories private to the user who created them", () => __awaiter(void 0, void 0, void 0, function* () {
        const otherUser = yield (0, auth_1.createAuthenticatedUser)(app);
        const createRes = yield user.agent.post("/api/rest/category").send({ name: "Private To Owner" });
        const id = createRes.body.id;
        const otherListRes = yield otherUser.agent.get("/api/rest/category");
        expect(otherListRes.body).not.toEqual(expect.arrayContaining([expect.objectContaining({ id })]));
        // Can't rename or delete another user's category either - scoped by user_id in the WHERE clause.
        const otherRenameRes = yield otherUser.agent.put(`/api/rest/category/${id}`).send({ name: "Hijacked" });
        expect(otherRenameRes.status).toBe(500); // no rowCount check on PUT - see CategoriesRoute.ts
        const otherDeleteRes = yield otherUser.agent.delete(`/api/rest/category/${id}`);
        expect(otherDeleteRes.status).toBe(404);
    }));
});
//# sourceMappingURL=CategoriesRoute.test.js.map