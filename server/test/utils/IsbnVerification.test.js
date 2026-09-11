"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IsbnVerification_1 = require("../../src/utils/IsbnVerification");
describe("validateIsbn10", () => {
    it("accepts a known-valid ISBN-10", () => {
        expect((0, IsbnVerification_1.validateIsbn10)("0261102214")).toBe(true); // The Hobbit
    });
    it("accepts a valid ISBN-10 with an 'X' check digit", () => {
        expect((0, IsbnVerification_1.validateIsbn10)("097522980X")).toBe(true);
    });
    it("rejects a corrupted digit", () => {
        expect((0, IsbnVerification_1.validateIsbn10)("0261102215")).toBe(false);
    });
});
describe("validateIsbn13", () => {
    it("accepts a known-valid ISBN-13", () => {
        expect((0, IsbnVerification_1.validateIsbn13)("9780261102217")).toBe(true); // The Hobbit
    });
    it("rejects a corrupted digit", () => {
        expect((0, IsbnVerification_1.validateIsbn13)("9780261102218")).toBe(false);
    });
});
describe("normalizeAndValidateIsbn", () => {
    it("strips spaces and hyphens before validating", () => {
        expect((0, IsbnVerification_1.normalizeAndValidateIsbn)("978-0-26-110221-7")).toBe("9780261102217");
        expect((0, IsbnVerification_1.normalizeAndValidateIsbn)("0 26 110221 4")).toBe("0261102214");
    });
    it("uppercases a lowercase 'x' check digit", () => {
        expect((0, IsbnVerification_1.normalizeAndValidateIsbn)("097522980x")).toBe("097522980X");
    });
    it("returns null for a malformed value", () => {
        expect((0, IsbnVerification_1.normalizeAndValidateIsbn)("not-an-isbn")).toBeNull();
    });
    it("returns null for a well-formed but checksum-invalid ISBN", () => {
        expect((0, IsbnVerification_1.normalizeAndValidateIsbn)("9780261102218")).toBeNull();
    });
    it("returns null for empty or missing input", () => {
        expect((0, IsbnVerification_1.normalizeAndValidateIsbn)("")).toBeNull();
        // @ts-expect-error - exercising the `raw ?? ""` guard against non-string callers.
        expect((0, IsbnVerification_1.normalizeAndValidateIsbn)(undefined)).toBeNull();
    });
});
//# sourceMappingURL=IsbnVerification.test.js.map