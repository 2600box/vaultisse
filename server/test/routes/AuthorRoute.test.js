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
Object.defineProperty(exports, "__esModule", { value: true });
const testApp_1 = require("../helpers/testApp");
const auth_1 = require("../helpers/auth");
const app = (0, testApp_1.setupTestApp)();
let user;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    user = yield (0, auth_1.createAuthenticatedUser)(app);
}));
describe("author CRUD and search", () => {
    it("creates, lists, searches, renames and deletes an author", () => __awaiter(void 0, void 0, void 0, function* () {
        const createRes = yield user.agent.post("/api/rest/author").send({ name: "J.R.R. Tolkien" });
        expect(createRes.status).toBe(200);
        const id = createRes.body.id;
        const listRes = yield user.agent.get("/api/rest/author");
        expect(listRes.body).toEqual(expect.arrayContaining([{ id, name: "J.R.R. Tolkien" }]));
        const searchRes = yield user.agent.post("/api/rest/author/search").send({ query: "tolk" });
        expect(searchRes.body).toEqual(expect.arrayContaining([{ id, name: "J.R.R. Tolkien" }]));
        const renameRes = yield user.agent.put(`/api/rest/author/${id}`).send({ name: "Tolkien" });
        expect(renameRes.status).toBe(200);
        expect(renameRes.body).toMatchObject({ name: "Tolkien" });
        const deleteRes = yield user.agent.delete(`/api/rest/author/${id}`);
        expect(deleteRes.status).toBe(200);
    }));
    it("404s deleting an author that doesn't exist", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield user.agent.delete("/api/rest/author/999999999");
        expect(res.status).toBe(404);
    }));
    it("keeps authors private to the user who created them", () => __awaiter(void 0, void 0, void 0, function* () {
        const otherUser = yield (0, auth_1.createAuthenticatedUser)(app);
        const createRes = yield user.agent.post("/api/rest/author").send({ name: "Private Author" });
        const otherListRes = yield otherUser.agent.get("/api/rest/author");
        expect(otherListRes.body).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: createRes.body.id })]));
    }));
});
//# sourceMappingURL=AuthorRoute.test.js.map