/**
 * Normalized shape every origin-specific parser (see `GoodreadsCsvParser.ts`)
 * reduces its source file down to, before `ImportRoute.ts` touches the
 * database. Keeping this shared and origin-agnostic is what lets the route
 * stay the same as more origins are added - only a new parser is needed.
 */
export interface IImportedBook {
    /** Row's 1-based position in the source file, for error reporting. */
    row: number;
    name: string;
    isbn: string | null;
    authors: string[];
    publisher: string | null;
    /** `YYYY-MM-DD`, matching `books.published_date` - only the year is usually known, so `YYYY-01-01`. */
    publishedDate: string | null;
    pages: number | null;
    /** Matched case-insensitively against `formats.name`; `null` if there's no reasonable match. */
    formatName: string | null;
    /** Find-or-created per user, same as `books.category_id`. Optional - origins that have no notion of a genre/category (e.g. Goodreads) just omit it. */
    categoryName?: string | null;
    description?: string | null;
    /** A bare 2-letter code, matching `languages.code` - anything else is dropped by the parser rather than passed through. */
    languageCode?: string | null;
    /**
     * A `data:image/png|jpeg;base64,...` URI or a URL from an allowed host -
     * validated by `ImportRoute.ts` against the same `isAllowedImageUrl()`
     * used everywhere else `books.image_url` is written, not by the parser.
     * `null`/omitted falls back to an ISBN-based Open Library cover lookup.
     */
    imageUrl?: string | null;
}
