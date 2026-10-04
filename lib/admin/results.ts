import type { Issue } from "@/lib/content/issues";

// What admin operations return. Plain data (ISO strings, no Dates), so server
// actions can hand it to client components unchanged.
export type OpResult<T extends object = object> = ({ status: "ok" } & T) | { status: "conflict" } | { status: "invalid"; issues: Issue[] };

// A server action adds the two outcomes that only exist at the request level.
export type ActionResult<T extends object = object> = OpResult<T> | { status: "unauthorized" } | { status: "unavailable" };
