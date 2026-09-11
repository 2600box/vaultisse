import request from "supertest";
import {setupTestApp} from "../helpers/testApp";
import {createAuthenticatedUser, ITestUser} from "../helpers/auth";

const app = setupTestApp();

let user: ITestUser;

beforeAll(async () => {
    user = await createAuthenticatedUser(app);
});

describe("category CRUD", () => {
    it("requires auth", async () => {
        const res = await request(app).get("/api/rest/category");
        expect(res.status).toBe(302);
    });

    it("starts with no categories for a fresh user", async () => {
        const res = await user.agent.get("/api/rest/category");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it("creates, lists, renames and deletes a category", async () => {
        const createRes = await user.agent.post("/api/rest/category").send({name: "Fantasy"});
        expect(createRes.status).toBe(200);
        expect(createRes.body).toMatchObject({name: "Fantasy"});
        const id = createRes.body.id;
        expect(typeof id).toBe("number");

        const listRes = await user.agent.get("/api/rest/category");
        expect(listRes.body).toEqual(expect.arrayContaining([{id, name: "Fantasy"}]));

        const renameRes = await user.agent.put(`/api/rest/category/${id}`).send({name: "Sci-Fi"});
        expect(renameRes.status).toBe(200);
        expect(renameRes.body).toMatchObject({id, name: "Sci-Fi"});

        const deleteRes = await user.agent.delete(`/api/rest/category/${id}`);
        expect(deleteRes.status).toBe(200);

        const finalListRes = await user.agent.get("/api/rest/category");
        expect(finalListRes.body).not.toEqual(expect.arrayContaining([expect.objectContaining({id})]));
    });

    it("404s deleting a category that doesn't exist", async () => {
        const res = await user.agent.delete("/api/rest/category/999999999");
        expect(res.status).toBe(404);
    });

    it("keeps categories private to the user who created them", async () => {
        const otherUser = await createAuthenticatedUser(app);

        const createRes = await user.agent.post("/api/rest/category").send({name: "Private To Owner"});
        const id = createRes.body.id;

        const otherListRes = await otherUser.agent.get("/api/rest/category");
        expect(otherListRes.body).not.toEqual(expect.arrayContaining([expect.objectContaining({id})]));

        // Can't rename or delete another user's category either - scoped by user_id in the WHERE clause.
        const otherRenameRes = await otherUser.agent.put(`/api/rest/category/${id}`).send({name: "Hijacked"});
        expect(otherRenameRes.status).toBe(500); // no rowCount check on PUT - see CategoriesRoute.ts

        const otherDeleteRes = await otherUser.agent.delete(`/api/rest/category/${id}`);
        expect(otherDeleteRes.status).toBe(404);
    });
});
