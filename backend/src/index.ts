import { Hono } from "hono";
import { serve } from "@hono/node-server";
import Database from "better-sqlite3";
import { cors } from "hono/cors";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: "http://localhost:5173",
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type"],
  }),
);

const db = new Database("todo.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now', 'localtime'))
  )
`);

app.get("/api/todos", (c) => {
  const todos = db.prepare("SELECT * FROM todos").all();
  return c.json(todos);
});

app.post("/api/todos", async (c) => {
  const { title } = await c.req.json();

  const info = db.prepare("INSERT INTO todos (title) VALUES (?)").run(title);
  const newTodo = db
    .prepare("SELECT * FROM todos WHERE id = ?")
    .get(info.lastInsertRowid);

  return c.json(newTodo);
});

app.patch("/api/todos/:id", async (c) => {
  const id = await c.req.param("id");
  const { completed } = await c.req.json();
  const sql = `UPDATE todos SET completed = ${completed} WHERE id = ${id}`;
  db.exec(sql);
  return c.json({ id: id, message: "Updated successfully" });
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
