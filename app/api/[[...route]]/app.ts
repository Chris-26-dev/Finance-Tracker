import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import summary from './summary';
import accounts from "./accounts";
import categories from './categories';
import transactions from './transactions';
import userData from './user-data';

export const app = new Hono().basePath('/api');

// Always answer with JSON and never leak internals (stack traces, SQL).
app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return c.json({ error: err.message || "Request failed" }, err.status);
    }

    console.error(err);
    return c.json({ error: "Internal server error" }, 500);
});

const routes = app
    .route("/summary", summary)
    .route("/accounts", accounts)
    .route("/categories", categories)
    .route("/transactions", transactions)
    .route("/user-data", userData)

export type AppType = typeof routes;
