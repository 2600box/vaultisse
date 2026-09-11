import {setupTestApp} from "../helpers/testApp";
import {createAuthenticatedUser, ITestUser} from "../helpers/auth";

const app = setupTestApp();

let user: ITestUser;

beforeAll(async () => {
    user = await createAuthenticatedUser(app);
});

describe("author CRUD and search", () => {
    it("creates, lists, searches, renames and deletes an author", async () => {
        const createRes = await user.agent.post("/api/rest/author").send({name: "J.R.R. Tolkien"});
        expect(createRes.status).toBe(200);
        const id = createRes.body.id;

        const listRes = await user.agent.get("/api/rest/author");
        expect(listRes.body).toEqual(expect.arrayContaining([{id, name: "J.R.R. Tolkien"}]));

        const searchRes = await user.agent.post("/api/rest/author/search").send({query: "tolk"});
        expect(searchRes.body).toEqual(expect.arrayContaining([{id, name: "J.R.R. Tolkien"}]));

        const renameRes = await user.agent.put(`/api/rest/author/${id}`).send({name: "Tolkien"});
        expect(renameRes.status).toBe(200);
        expect(renameRes.body).toMatchObject({name: "Tolkien"});

        const deleteRes = await user.agent.delete(`/api/rest/author/${id}`);
        expect(deleteRes.status).toBe(200);
    });

    it("404s deleting an author that doesn't exist", async () => {
        const res = await user.agent.delete("/api/rest/author/999999999");
        expect(res.status).toBe(404);
    });

    it("keeps authors private to the user who created them", async () => {
        const otherUser = await createAuthenticatedUser(app);
        const createRes = await user.agent.post("/api/rest/author").send({name: "Private Author"});

        const otherListRes = await otherUser.agent.get("/api/rest/author");
        expect(otherListRes.body).not.toEqual(expect.arrayContaining([expect.objectContaining({id: createRes.body.id})]));
    });
});
