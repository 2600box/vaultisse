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
describe("customer groups", () => {
    it("creates, lists, renames and deletes a group", () => __awaiter(void 0, void 0, void 0, function* () {
        const createRes = yield user.agent.post("/api/rest/customer/group").send({ name: "Class 4B" });
        expect(createRes.status).toBe(201);
        const id = createRes.body.id;
        const listRes = yield user.agent.get("/api/rest/customer/group");
        expect(listRes.body.some((g) => g.id === id && g.total_customers === 0)).toBe(true);
        const renameRes = yield user.agent.put(`/api/rest/customer/group/${id}`).send({ name: "Class 5B" });
        expect(renameRes.status).toBe(200);
        const deleteRes = yield user.agent.delete(`/api/rest/customer/group/${id}`);
        expect(deleteRes.status).toBe(200);
    }));
    it("rejects an empty group name", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield user.agent.post("/api/rest/customer/group").send({ name: "   " });
        expect(res.status).toBe(400);
    }));
    it("409s creating a group with a name already in use", () => __awaiter(void 0, void 0, void 0, function* () {
        yield user.agent.post("/api/rest/customer/group").send({ name: "Duplicate Group" });
        const res = yield user.agent.post("/api/rest/customer/group").send({ name: "Duplicate Group" });
        expect(res.status).toBe(409);
    }));
});
describe("customer CRUD and group assignment", () => {
    it("creates, renames, assigns/unassigns a group, and deletes a customer", () => __awaiter(void 0, void 0, void 0, function* () {
        const groupId = (yield user.agent.post("/api/rest/customer/group").send({ name: "Assignable Group" })).body.id;
        const createRes = yield user.agent.post("/api/rest/customer").send({ name: "Jane Doe" });
        expect(createRes.status).toBe(200);
        const customerId = createRes.body.id;
        const assignRes = yield user.agent.put(`/api/rest/customer/${customerId}/group/${groupId}`);
        expect(assignRes.status).toBe(200);
        expect(assignRes.body.group_id).toBe(groupId);
        const unassignRes = yield user.agent.delete(`/api/rest/customer/${customerId}/group`);
        expect(unassignRes.status).toBe(200);
        expect(unassignRes.body.group_id).toBeNull();
        const renameRes = yield user.agent.put(`/api/rest/customer/${customerId}`).send({ name: "Jane Smith" });
        expect(renameRes.status).toBe(200);
        expect(renameRes.body.name).toBe("Jane Smith");
        const listRes = yield user.agent.get("/api/rest/customer");
        expect(listRes.body.customers.some((c) => c.id === customerId)).toBe(true);
        const deleteRes = yield user.agent.delete(`/api/rest/customer/${customerId}`);
        expect(deleteRes.status).toBe(200);
    }));
    it("404s assigning to a group that doesn't belong to the user", () => __awaiter(void 0, void 0, void 0, function* () {
        const otherUser = yield (0, auth_1.createAuthenticatedUser)(app);
        const otherGroupId = (yield otherUser.agent.post("/api/rest/customer/group").send({ name: "Not Mine" })).body.id;
        const customerId = (yield user.agent.post("/api/rest/customer").send({ name: "Test" })).body.id;
        const res = yield user.agent.put(`/api/rest/customer/${customerId}/group/${otherGroupId}`);
        expect(res.status).toBe(404);
    }));
});
describe("lending and returning books via a customer", () => {
    it("lends a book to a customer and returns it", () => __awaiter(void 0, void 0, void 0, function* () {
        const customerId = (yield user.agent.post("/api/rest/customer").send({ name: "Borrower" })).body.id;
        const locationId = (yield user.agent.post("/api/rest/location").send({ name: "Shelf", description: "" })).body.id;
        const bookId = (yield user.agent.post("/api/rest/book").field("name", "Lendable Book")).body;
        const stockRes = yield user.agent.post(`/api/rest/book/${bookId}/stock`).send({ status: 0, location_id: locationId });
        const stockCode = stockRes.body.code;
        const lendRes = yield user.agent.post(`/api/rest/customer/${customerId}/add/books`).send({ books: [stockCode] });
        expect(lendRes.status).toBe(200);
        expect(lendRes.body.some((b) => b.code === stockCode)).toBe(true);
        const returnRes = yield user.agent.delete(`/api/rest/customer/${customerId}/book/${stockCode}`);
        expect(returnRes.status).toBe(200);
        const bookRes = yield user.agent.get(`/api/rest/book/${bookId}`);
        expect(bookRes.body.stocks[0]).toMatchObject({ status: 0, customer_id: null });
    }));
});
//# sourceMappingURL=CustomerRoute.test.js.map