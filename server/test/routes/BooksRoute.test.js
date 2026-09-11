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
const axios_1 = __importDefault(require("axios"));
const testApp_1 = require("../helpers/testApp");
const auth_1 = require("../helpers/auth");
jest.mock("axios");
const mockedAxios = axios_1.default;
const app = (0, testApp_1.setupTestApp)();
let user;
beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
    user = yield (0, auth_1.createAuthenticatedUser)(app);
    mockedAxios.get.mockReset();
}));
describe("POST /book (manual create)", () => {
    it("creates a book with just a name", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield user.agent.post("/api/rest/book").field("name", "The Hobbit");
        expect(res.status).toBe(200);
        expect(typeof res.body).toBe("number");
    }));
    it("rejects a duplicate ISBN for the same user", () => __awaiter(void 0, void 0, void 0, function* () {
        yield user.agent.post("/api/rest/book").field("name", "Book One").field("isbn", "9780261102217");
        const res = yield user.agent.post("/api/rest/book").field("name", "Book Two").field("isbn", "9780261102217");
        expect(res.status).toBe(404);
    }));
    it("allows the same ISBN across different users", () => __awaiter(void 0, void 0, void 0, function* () {
        const otherUser = yield (0, auth_1.createAuthenticatedUser)(app);
        yield user.agent.post("/api/rest/book").field("name", "Shared ISBN Book").field("isbn", "9780261102217");
        const res = yield otherUser.agent.post("/api/rest/book").field("name", "Shared ISBN Book").field("isbn", "9780261102217");
        expect(res.status).toBe(200);
    }));
});
describe("GET /book/:id", () => {
    it("fetches a book the user owns", () => __awaiter(void 0, void 0, void 0, function* () {
        const createRes = yield user.agent.post("/api/rest/book").field("name", "The Hobbit");
        const id = createRes.body;
        const res = yield user.agent.get(`/api/rest/book/${id}`);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id, name: "The Hobbit" });
        expect(res.body.authors).toEqual([]);
        expect(res.body.stocks).toEqual([]);
    }));
    it("404s for a book belonging to another user", () => __awaiter(void 0, void 0, void 0, function* () {
        const createRes = yield user.agent.post("/api/rest/book").field("name", "Private Book");
        const id = createRes.body;
        const otherUser = yield (0, auth_1.createAuthenticatedUser)(app);
        const res = yield otherUser.agent.get(`/api/rest/book/${id}`);
        expect(res.status).toBe(404);
    }));
    it("404s for a nonexistent id", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield user.agent.get("/api/rest/book/999999999");
        expect(res.status).toBe(404);
    }));
});
describe("PUT /book/:id", () => {
    it("updates fields and reconciles the author list", () => __awaiter(void 0, void 0, void 0, function* () {
        const createRes = yield user.agent.post("/api/rest/book").field("name", "Draft Title");
        const id = createRes.body;
        const authorRes = yield user.agent.post("/api/rest/author").send({ name: "Jane Author" });
        const authorId = authorRes.body.id;
        const updateRes = yield user.agent.put(`/api/rest/book/${id}`).send({
            name: "Final Title",
            description: "A great book.",
            isbn: null,
            category_id: null,
            language_code: null,
            authors: [authorId],
            publisher: "Acme",
            published_date: "2020-01-01",
            pages: 42,
            format_id: null,
        });
        expect(updateRes.status).toBe(200);
        const getRes = yield user.agent.get(`/api/rest/book/${id}`);
        expect(getRes.body).toMatchObject({ name: "Final Title", description: "A great book.", publisher: "Acme" });
        expect(getRes.body.authors).toEqual([{ id: authorId, name: "Jane Author" }]);
    }));
    it("404s updating a book that doesn't exist", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield user.agent.put("/api/rest/book/999999999").send({ name: "X" });
        expect(res.status).toBe(404);
    }));
});
describe("DELETE /book/:id", () => {
    it("deletes a book the user owns", () => __awaiter(void 0, void 0, void 0, function* () {
        const createRes = yield user.agent.post("/api/rest/book").field("name", "Disposable Book");
        const id = createRes.body;
        const deleteRes = yield user.agent.delete(`/api/rest/book/${id}`);
        expect(deleteRes.status).toBe(200);
        const getRes = yield user.agent.get(`/api/rest/book/${id}`);
        expect(getRes.status).toBe(404);
    }));
    it("404s for a nonexistent book", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield user.agent.delete("/api/rest/book/999999999");
        expect(res.status).toBe(404);
    }));
});
describe("GET /book/search", () => {
    it("finds a book by (partial, case-insensitive) name", () => __awaiter(void 0, void 0, void 0, function* () {
        yield user.agent.post("/api/rest/book").field("name", "The Great Gatsby");
        const res = yield user.agent.get("/api/rest/book/search").query({ query: "great gatsby" });
        expect(res.status).toBe(200);
        expect(res.body.books.some((b) => b.name === "The Great Gatsby")).toBe(true);
    }));
    it("only returns the caller's own books", () => __awaiter(void 0, void 0, void 0, function* () {
        const otherUser = yield (0, auth_1.createAuthenticatedUser)(app);
        yield otherUser.agent.post("/api/rest/book").field("name", "Someone Else's Book");
        const res = yield user.agent.get("/api/rest/book/search").query({ query: "Someone Else's Book" });
        expect(res.body.books).toEqual([]);
    }));
    it("filters by category_id", () => __awaiter(void 0, void 0, void 0, function* () {
        const categoryRes = yield user.agent.post("/api/rest/category").send({ name: "Sci-Fi Search Test" });
        const categoryId = categoryRes.body.id;
        const createRes = yield user.agent.post("/api/rest/book").field("name", "Categorized Book");
        yield user.agent.put(`/api/rest/book/${createRes.body}`).send({
            name: "Categorized Book", category_id: categoryId, authors: [],
        });
        const res = yield user.agent.get("/api/rest/book/search").query({ category_id: categoryId });
        expect(res.body.books.some((b) => b.id === createRes.body)).toBe(true);
    }));
});
describe("GET /book/counters", () => {
    it("counts the caller's books", () => __awaiter(void 0, void 0, void 0, function* () {
        yield user.agent.post("/api/rest/book").field("name", "Counted Book");
        const res = yield user.agent.get("/api/rest/book/counters");
        expect(res.status).toBe(200);
        expect(res.body.total).toBeGreaterThanOrEqual(1);
    }));
});
describe("POST /book/isbn/:isbn (external metadata lookup)", () => {
    /**
     * GOOGLE_BOOKS_API_KEY is forced empty in tests (see test/setup/testEnv.js),
     * so `fetchBookData` always takes the Open Library fallback branch, never
     * the Google Books one - this mocks that branch's two calls (metadata
     * search, then the covers API) by URL, rather than assuming either
     * provider specifically. If a real key is ever configured, this
     * intentionally isn't what would run in production.
     */
    function mockOpenLibraryMetadata(overrides = {}) {
        mockedAxios.get.mockImplementation((url) => {
            var _a, _b, _c;
            if (url.includes("openlibrary.org/search.json")) {
                return Promise.resolve({
                    data: {
                        docs: [{
                                title: (_a = overrides.title) !== null && _a !== void 0 ? _a : "Mocked Book Title",
                                author_name: (_b = overrides.authorName) !== null && _b !== void 0 ? _b : ["Mock Author"],
                                subject: ["Fiction"],
                                publisher: ["Mock Publisher"],
                                first_publish_year: 1999,
                                number_of_pages_median: (_c = overrides.pages) !== null && _c !== void 0 ? _c : 123,
                                language: ["eng"],
                            }],
                    },
                });
            }
            if (url.includes("covers.openlibrary.org")) {
                return Promise.resolve({ status: 200, headers: { "content-type": "image/jpeg" } });
            }
            return Promise.resolve({ data: {} });
        });
    }
    it("creates a book from a mocked Open Library response", () => __awaiter(void 0, void 0, void 0, function* () {
        mockOpenLibraryMetadata();
        const res = yield user.agent.post("/api/rest/book/isbn/9780261102217");
        expect(res.status).toBe(200);
        const id = res.body;
        const getRes = yield user.agent.get(`/api/rest/book/${id}`);
        expect(getRes.body).toMatchObject({ name: "Mocked Book Title", publisher: "Mock Publisher", pages: 123 });
        expect(getRes.body.authors).toEqual([{ id: expect.any(Number), name: "Mock Author" }]);
    }));
    it("reuses the existing book on a second lookup of the same ISBN (find-or-create)", () => __awaiter(void 0, void 0, void 0, function* () {
        mockOpenLibraryMetadata({ title: "Repeatable Book" });
        const first = yield user.agent.post("/api/rest/book/isbn/9780261102217");
        const second = yield user.agent.post("/api/rest/book/isbn/9780261102217");
        expect(second.text).toBe(first.text);
    }));
    it("rejects a malformed ISBN", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield user.agent.post("/api/rest/book/isbn/not-an-isbn");
        expect(res.status).toBe(400);
    }));
    it("404s when no metadata is found anywhere", () => __awaiter(void 0, void 0, void 0, function* () {
        mockedAxios.get.mockResolvedValue({ data: {} }); // No `docs` in the Open Library response.
        const res = yield user.agent.post("/api/rest/book/isbn/9780261102217");
        expect(res.status).toBe(404);
    }));
});
describe("book stock lifecycle", () => {
    function createLocation(agent, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield agent.post("/api/rest/location").send({ name, description: "" });
            return res.body.id;
        });
    }
    it("adds, updates (loans) and removes a stock", () => __awaiter(void 0, void 0, void 0, function* () {
        const bookRes = yield user.agent.post("/api/rest/book").field("name", "Stocked Book");
        const bookId = bookRes.body;
        const locationId = yield createLocation(user.agent, "Main Shelf");
        const addRes = yield user.agent.post(`/api/rest/book/${bookId}/stock`).send({ status: 0, location_id: locationId });
        expect(addRes.status).toBe(200);
        const stockId = addRes.body.id;
        expect(addRes.body.status).toBe(0);
        // Can't create a stock as already-booked.
        const bookedCreateRes = yield user.agent.post(`/api/rest/book/${bookId}/stock`).send({ status: 2, location_id: locationId });
        expect(bookedCreateRes.status).toBe(406);
        const updateRes = yield user.agent
            .put(`/api/rest/book/${bookId}/stock/${stockId}`)
            .send({ status: 0, location_id: locationId, customer_id: null });
        expect(updateRes.status).toBe(200);
        const deleteRes = yield user.agent.delete(`/api/rest/book/${bookId}/stock/${stockId}`);
        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body).toBe(true);
    }));
    it("loans a stock to a customer and returns it, recording loan history both times", () => __awaiter(void 0, void 0, void 0, function* () {
        const bookRes = yield user.agent.post("/api/rest/book").field("name", "Loanable Book");
        const bookId = bookRes.body;
        const locationId = yield createLocation(user.agent, "Loan Shelf");
        const customerRes = yield user.agent.post("/api/rest/customer").send({ name: "Jane Borrower" });
        const customerId = customerRes.body.id;
        const stockRes = yield user.agent.post(`/api/rest/book/${bookId}/stock`).send({ status: 0, location_id: locationId });
        const stockId = stockRes.body.id;
        // Transition into "booked" (2) - this exact statement used to crash
        // with a Postgres 500 (42P08, "inconsistent types deduced for
        // parameter $1") before the $1::smallint cast fix in BooksRoute.ts.
        const loanRes = yield user.agent
            .put(`/api/rest/book/${bookId}/stock/${stockId}`)
            .send({ status: 2, location_id: locationId, customer_id: customerId });
        expect(loanRes.status).toBe(200);
        expect(loanRes.body).toMatchObject({ status: 2, customer_id: customerId });
        const afterLoanRes = yield user.agent.get(`/api/rest/book/${bookId}`);
        expect(afterLoanRes.body.stocks[0]).toMatchObject({ status: 2, customer_id: customerId });
        const returnRes = yield user.agent
            .put(`/api/rest/book/${bookId}/stock/${stockId}`)
            .send({ status: 0, location_id: locationId, customer_id: null });
        expect(returnRes.status).toBe(200);
        expect(returnRes.body.customer_id).toBeNull();
        const today = new Date().toISOString().slice(0, 10);
        const reportRes = yield user.agent
            .get("/api/rest/loans/report")
            .query({ date_from: today, date_to: today });
        expect(reportRes.status).toBe(200);
        const entry = reportRes.body.rows.find((l) => l.stockCode === stockRes.body.code);
        expect(entry).toBeDefined();
        expect(entry.returnedAt).not.toBeNull();
    }));
    it("404s adding a stock at a location that doesn't belong to the user", () => __awaiter(void 0, void 0, void 0, function* () {
        const bookRes = yield user.agent.post("/api/rest/book").field("name", "Another Stocked Book");
        const otherUser = yield (0, auth_1.createAuthenticatedUser)(app);
        const otherLocationId = yield createLocation(otherUser.agent, "Someone Else's Shelf");
        const res = yield user.agent.post(`/api/rest/book/${bookRes.body}/stock`).send({ status: 0, location_id: otherLocationId });
        expect(res.status).toBe(404);
    }));
});
//# sourceMappingURL=BooksRoute.test.js.map