# Input Validation & Sanitization (Next.js API Routes)

## Validate first, always

Every route handler that reads `req.json()`, `req.formData()`, query params, or headers should run that input through a schema before any business logic touches it. This is the single change that prevents the largest share of injection, mass-assignment, and type-confusion bugs at once — validation isn't just about rejecting garbage, it's about guaranteeing the shape of what the rest of the function operates on.

`zod` is the common choice in the Next.js ecosystem and pairs naturally with TypeScript:

```ts
import { z } from "zod";

const createOrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(100),
  notes: z.string().max(500).optional(),
}).strict(); // .strict() rejects any extra/unexpected fields — this is what
             // blocks mass assignment: an attacker adding `role: "admin"`
             // to the body causes a validation error instead of silently
             // passing through.

export async function POST(req: Request) {
  const parsed = createOrderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { productId, quantity, notes } = parsed.data;
  // only validated, explicitly-named fields reach the DB call
}
```

Apply the same idea to query params and route params (`z.coerce.number()` for things that arrive as strings but should be numbers, etc.) — don't assume a route param matches the shape your code expects just because the route pattern implies it.

## SQL

Prefer the ORM/query builder's parameterized API over raw SQL entirely (Prisma's `findUnique`/`create`/etc., Drizzle's query builder, Kysely). When raw SQL is genuinely necessary, use the driver's tagged/parameterized query form — never template-literal or concatenate user input directly into a query string:

```ts
// Never
db.$queryRawUnsafe(`SELECT * FROM users WHERE id = ${id}`);

// Parameterized raw query (Prisma example)
db.$queryRaw`SELECT * FROM users WHERE id = ${id}`;
```

## MongoDB / Mongoose — operator injection

Validating that a field is a `z.string()` (not `z.any()` or unvalidated) already prevents most operator injection, since an object like `{"$ne": null}` fails string validation before it reaches the query. As defense-in-depth on top of that, strip any object keys starting with `$` or containing `.` before building a filter from user-influenced data:

```ts
function stripMongoOperators<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(stripMongoOperators) as T;
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([k]) => !k.startsWith("$") && !k.includes("."))
        .map(([k, v]) => [k, stripMongoOperators(v)])
    ) as T;
  }
  return obj;
}
```

Prefer the `mongo-sanitize` package for this in a real project rather than hand-rolling it, but the principle is the same either way.

## HTML / rich text — XSS prevention

Sanitize on the way *in* (before storing), not just on the way out — that way every consumer of the data (web app, mobile app, email digest, RSS feed) is protected, not just the one view you happened to sanitize:

```ts
import DOMPurify from "isomorphic-dompurify";

const clean = DOMPurify.sanitize(userSubmittedHtml, {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
  ALLOWED_ATTR: ["href"],
});
await db.comment.create({ data: { body: clean, authorId: session.user.id } });
```

If the field doesn't actually need to support HTML (most don't — names, titles, plain comments), don't sanitize-and-allow; just treat it as plain text and let React's default escaping handle rendering. Sanitization is for the genuine rich-text-editor case; everything else is simpler and safer as plain text.

## File uploads

```ts
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const file = formData.get("file") as File;
if (!ALLOWED_TYPES.has(file.type)) {
  return Response.json({ error: "Unsupported file type" }, { status: 400 });
}
if (file.size > MAX_SIZE) {
  return Response.json({ error: "File too large" }, { status: 400 });
}
// Generate the storage filename yourself — never reuse file.name directly
const filename = `${crypto.randomUUID()}.${extensionFromMimeType(file.type)}`;
```

Checking `file.type` from `FormData` is still client-supplied and not fully trustworthy on its own for high-stakes uploads — for anything sensitive, validate the actual file signature/magic bytes server-side too, not just the declared MIME type.

## General hygiene checklist for any validated field

- Enforce max length on every string field (prevents both abuse and some ReDoS surface).
- Use real validators for structured formats — `z.string().email()`, `z.string().url()`, not a hand-written regex, and be wary of complex custom regexes on user input in general (catastrophic backtracking / ReDoS).
- Coerce and constrain numeric ranges (`z.number().int().min().max()`) rather than trusting client-sent numbers as-is (pagination `limit` params are a common overlooked one — an unbounded `limit` is a resource-exhaustion vector).
- Never pass user input to `eval()`, `new Function()`, or a shell command (`child_process.exec` with interpolated input) — if shelling out is unavoidable, use `execFile`/`spawn` with an argument array (not a single interpolated string) so there's no shell parsing step for injection to exploit.
