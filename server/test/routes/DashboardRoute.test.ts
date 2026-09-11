import request from "supertest";
import {setupTestApp} from "../helpers/testApp";
import {createAuthenticatedUser} from "../helpers/auth";

const app = setupTestApp();

describe("GET /dashboard", () => {
    it("requires auth", async () => {
        const {agent: unauth} = await createAuthenticatedUser(app);
        // sanity: an authenticated agent works, then compare against no auth at all.
        const authedRes = await unauth.get("/api/rest/dashboard");
        expect(authedRes.status).toBe(200);

        const noAuthRes = await request(app).get("/api/rest/dashboard");
        expect(noAuthRes.status).toBe(302);
    });

    it("aggregates real counts for a fresh user with one book", async () => {
        const user = await createAuthenticatedUser(app);
        await user.agent.post("/api/rest/book").field("name", "Dashboard Book");

        const res = await user.agent.get("/api/rest/dashboard");
        expect(res.status).toBe(200);
        expect(res.body.totalBooks).toBe(1);
        expect(typeof res.body.totalBooks).toBe("number");
        expect(Array.isArray(res.body.lastBooks)).toBe(true);
        expect(res.body.lastBooks.some((b: any) => b.name === "Dashboard Book")).toBe(true);
    });
});
