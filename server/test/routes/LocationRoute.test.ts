import {setupTestApp} from "../helpers/testApp";
import {createAuthenticatedUser, ITestUser} from "../helpers/auth";

const app = setupTestApp();

let user: ITestUser;

beforeAll(async () => {
    user = await createAuthenticatedUser(app);
});

describe("location CRUD and book placement", () => {
    it("creates, lists, renames and deletes a location", async () => {
        const createRes = await user.agent.post("/api/rest/location").send({name: "Main Shelf", description: "Front room"});
        expect(createRes.status).toBe(200);
        expect(createRes.body).toMatchObject({name: "Main Shelf", description: "Front room", total_books: "0"});
        const id = createRes.body.id;

        const listRes = await user.agent.get("/api/rest/location");
        expect(listRes.body.some((l: any) => l.id === id)).toBe(true);

        const renameRes = await user.agent.put(`/api/rest/location/${id}`).send({name: "Back Shelf", description: ""});
        expect(renameRes.status).toBe(200);
        expect(renameRes.body.name).toBe("Back Shelf");

        const deleteRes = await user.agent.delete(`/api/rest/location/${id}`);
        expect(deleteRes.status).toBe(200);
    });

    it("404s deleting a location that doesn't exist", async () => {
        const res = await user.agent.delete("/api/rest/location/999999999");
        expect(res.status).toBe(404);
    });

    it("moves a book stock into a location by scanning its code", async () => {
        const locationA = (await user.agent.post("/api/rest/location").send({name: "Shelf A", description: ""})).body.id;
        const locationB = (await user.agent.post("/api/rest/location").send({name: "Shelf B", description: ""})).body.id;

        const bookId = (await user.agent.post("/api/rest/book").field("name", "Moveable Book")).body;
        const stockRes = await user.agent.post(`/api/rest/book/${bookId}/stock`).send({status: 0, location_id: locationA});
        const stockCode = stockRes.body.code;

        const moveRes = await user.agent.post(`/api/rest/location/${locationB}/add/books`).send({books: [stockCode]});
        expect(moveRes.status).toBe(200);
        expect(moveRes.body.some((b: any) => b.code === stockCode)).toBe(true);

        const shelfABooks = await user.agent.get(`/api/rest/location/${locationA}/books`);
        expect(shelfABooks.body.some((b: any) => b.code === stockCode)).toBe(false);
    });

    it("404s moving books into a location that doesn't belong to the user", async () => {
        const otherUser = await createAuthenticatedUser(app);
        const otherLocationId = (await otherUser.agent.post("/api/rest/location").send({name: "Not Mine", description: ""})).body.id;

        const res = await user.agent.post(`/api/rest/location/${otherLocationId}/add/books`).send({books: ["whatever"]});
        expect(res.status).toBe(404);
    });
});
