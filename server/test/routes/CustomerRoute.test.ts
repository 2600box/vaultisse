import {setupTestApp} from "../helpers/testApp";
import {createAuthenticatedUser, ITestUser} from "../helpers/auth";

const app = setupTestApp();

let user: ITestUser;

beforeAll(async () => {
    user = await createAuthenticatedUser(app);
});

describe("customer groups", () => {
    it("creates, lists, renames and deletes a group", async () => {
        const createRes = await user.agent.post("/api/rest/customer/group").send({name: "Class 4B"});
        expect(createRes.status).toBe(201);
        const id = createRes.body.id;

        const listRes = await user.agent.get("/api/rest/customer/group");
        expect(listRes.body.some((g: any) => g.id === id && g.total_customers === 0)).toBe(true);

        const renameRes = await user.agent.put(`/api/rest/customer/group/${id}`).send({name: "Class 5B"});
        expect(renameRes.status).toBe(200);

        const deleteRes = await user.agent.delete(`/api/rest/customer/group/${id}`);
        expect(deleteRes.status).toBe(200);
    });

    it("rejects an empty group name", async () => {
        const res = await user.agent.post("/api/rest/customer/group").send({name: "   "});
        expect(res.status).toBe(400);
    });

    it("409s creating a group with a name already in use", async () => {
        await user.agent.post("/api/rest/customer/group").send({name: "Duplicate Group"});
        const res = await user.agent.post("/api/rest/customer/group").send({name: "Duplicate Group"});
        expect(res.status).toBe(409);
    });
});

describe("customer CRUD and group assignment", () => {
    it("creates, renames, assigns/unassigns a group, and deletes a customer", async () => {
        const groupId = (await user.agent.post("/api/rest/customer/group").send({name: "Assignable Group"})).body.id;
        const createRes = await user.agent.post("/api/rest/customer").send({name: "Jane Doe"});
        expect(createRes.status).toBe(200);
        const customerId = createRes.body.id;

        const assignRes = await user.agent.put(`/api/rest/customer/${customerId}/group/${groupId}`);
        expect(assignRes.status).toBe(200);
        expect(assignRes.body.group_id).toBe(groupId);

        const unassignRes = await user.agent.delete(`/api/rest/customer/${customerId}/group`);
        expect(unassignRes.status).toBe(200);
        expect(unassignRes.body.group_id).toBeNull();

        const renameRes = await user.agent.put(`/api/rest/customer/${customerId}`).send({name: "Jane Smith"});
        expect(renameRes.status).toBe(200);
        expect(renameRes.body.name).toBe("Jane Smith");

        const listRes = await user.agent.get("/api/rest/customer");
        expect(listRes.body.customers.some((c: any) => c.id === customerId)).toBe(true);

        const deleteRes = await user.agent.delete(`/api/rest/customer/${customerId}`);
        expect(deleteRes.status).toBe(200);
    });

    it("404s assigning to a group that doesn't belong to the user", async () => {
        const otherUser = await createAuthenticatedUser(app);
        const otherGroupId = (await otherUser.agent.post("/api/rest/customer/group").send({name: "Not Mine"})).body.id;
        const customerId = (await user.agent.post("/api/rest/customer").send({name: "Test"})).body.id;

        const res = await user.agent.put(`/api/rest/customer/${customerId}/group/${otherGroupId}`);
        expect(res.status).toBe(404);
    });
});

describe("lending and returning books via a customer", () => {
    it("lends a book to a customer and returns it", async () => {
        const customerId = (await user.agent.post("/api/rest/customer").send({name: "Borrower"})).body.id;
        const locationId = (await user.agent.post("/api/rest/location").send({name: "Shelf", description: ""})).body.id;
        const bookId = (await user.agent.post("/api/rest/book").field("name", "Lendable Book")).body;
        const stockRes = await user.agent.post(`/api/rest/book/${bookId}/stock`).send({status: 0, location_id: locationId});
        const stockCode = stockRes.body.code;

        const lendRes = await user.agent.post(`/api/rest/customer/${customerId}/add/books`).send({books: [stockCode]});
        expect(lendRes.status).toBe(200);
        expect(lendRes.body.some((b: any) => b.code === stockCode)).toBe(true);

        const returnRes = await user.agent.delete(`/api/rest/customer/${customerId}/book/${stockCode}`);
        expect(returnRes.status).toBe(200);

        const bookRes = await user.agent.get(`/api/rest/book/${bookId}`);
        expect(bookRes.body.stocks[0]).toMatchObject({status: 0, customer_id: null});
    });
});
