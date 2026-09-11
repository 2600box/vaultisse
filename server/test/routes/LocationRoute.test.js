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
describe("location CRUD and book placement", () => {
    it("creates, lists, renames and deletes a location", () => __awaiter(void 0, void 0, void 0, function* () {
        const createRes = yield user.agent.post("/api/rest/location").send({ name: "Main Shelf", description: "Front room" });
        expect(createRes.status).toBe(200);
        expect(createRes.body).toMatchObject({ name: "Main Shelf", description: "Front room", total_books: "0" });
        const id = createRes.body.id;
        const listRes = yield user.agent.get("/api/rest/location");
        expect(listRes.body.some((l) => l.id === id)).toBe(true);
        const renameRes = yield user.agent.put(`/api/rest/location/${id}`).send({ name: "Back Shelf", description: "" });
        expect(renameRes.status).toBe(200);
        expect(renameRes.body.name).toBe("Back Shelf");
        const deleteRes = yield user.agent.delete(`/api/rest/location/${id}`);
        expect(deleteRes.status).toBe(200);
    }));
    it("404s deleting a location that doesn't exist", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield user.agent.delete("/api/rest/location/999999999");
        expect(res.status).toBe(404);
    }));
    it("moves a book stock into a location by scanning its code", () => __awaiter(void 0, void 0, void 0, function* () {
        const locationA = (yield user.agent.post("/api/rest/location").send({ name: "Shelf A", description: "" })).body.id;
        const locationB = (yield user.agent.post("/api/rest/location").send({ name: "Shelf B", description: "" })).body.id;
        const bookId = (yield user.agent.post("/api/rest/book").field("name", "Moveable Book")).body;
        const stockRes = yield user.agent.post(`/api/rest/book/${bookId}/stock`).send({ status: 0, location_id: locationA });
        const stockCode = stockRes.body.code;
        const moveRes = yield user.agent.post(`/api/rest/location/${locationB}/add/books`).send({ books: [stockCode] });
        expect(moveRes.status).toBe(200);
        expect(moveRes.body.some((b) => b.code === stockCode)).toBe(true);
        const shelfABooks = yield user.agent.get(`/api/rest/location/${locationA}/books`);
        expect(shelfABooks.body.some((b) => b.code === stockCode)).toBe(false);
    }));
    it("404s moving books into a location that doesn't belong to the user", () => __awaiter(void 0, void 0, void 0, function* () {
        const otherUser = yield (0, auth_1.createAuthenticatedUser)(app);
        const otherLocationId = (yield otherUser.agent.post("/api/rest/location").send({ name: "Not Mine", description: "" })).body.id;
        const res = yield user.agent.post(`/api/rest/location/${otherLocationId}/add/books`).send({ books: ["whatever"] });
        expect(res.status).toBe(404);
    }));
});
//# sourceMappingURL=LocationRoute.test.js.map