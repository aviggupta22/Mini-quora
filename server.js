const path = require("path");
const express = require("express");
const methodOverride = require("method-override");

const app = express();

// --- In-memory "DB"
const { v4: uuid } = require("uuid");
let posts = [
  {
    id: uuid(),
    title: "Welcome to Mini Quora",
    author: "Admin",
    body: "Ask and answer! This is a demo post.",
    tags: ["intro", "demo"]
  }
];

// --- App config
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true })); // form-encoded
app.use(express.json()); // JSON bodies
app.use(methodOverride("_method")); // support PUT/DELETE via forms

// --- Helpers
const findPost = (id) => posts.find((p) => p.id === id);

// -------------------- Web Views (EJS) --------------------

// Home: redirect to /posts
app.get("/", (req, res) => {
  res.redirect("/posts");
});

// List posts
app.get("/posts", (req, res) => {
  // Optional filter by tag: /posts?tag=demo
  const { tag } = req.query;
  const filtered = tag ? posts.filter((p) => (p.tags || []).includes(tag)) : posts;
  res.render("posts/index", { posts: filtered, queryTag: tag || "" });
});

// New post form
app.get("/posts/new", (req, res) => {
  res.render("posts/new");
});

// Create post (from form)
app.post("/posts", (req, res) => {
  const { title, author, body, tags } = req.body;
  const newPost = {
    id: uuid(),
    title: title?.trim() || "Untitled",
    author: author?.trim() || "Anonymous",
    body: body?.trim() || "",
    tags: (tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
  };
  posts.unshift(newPost);
  res.redirect("/posts");
});

// Show one post
app.get("/posts/:id", (req, res) => {
  const post = findPost(req.params.id);
  if (!post) return res.status(404).render("404", { message: "Post not found" });
  res.render("posts/show", { post });
});

// Edit form
app.get("/posts/:id/edit", (req, res) => {
  const post = findPost(req.params.id);
  if (!post) return res.status(404).render("404", { message: "Post not found" });
  res.render("posts/edit", { post });
});

// Update post (from form)
app.put("/posts/:id", (req, res) => {
  const post = findPost(req.params.id);
  if (!post) return res.status(404).render("404", { message: "Post not found" });

  const { title, author, body, tags } = req.body;
  post.title = title?.trim() || post.title;
  post.author = author?.trim() || post.author;
  post.body = body?.trim() || post.body;
  post.tags = (tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  res.redirect(`/posts/${post.id}`);
});

// Delete post (from form)
app.delete("/posts/:id", (req, res) => {
  const { id } = req.params;
  const before = posts.length;
  posts = posts.filter((p) => p.id !== id);
  if (posts.length === before) {
    return res.status(404).render("404", { message: "Post not found" });
  }
  res.redirect("/posts");
});

// -------------------- RESTful JSON API --------------------

// GET /api/posts
app.get("/api/posts", (req, res) => {
  res.json(posts);
});

// GET /api/posts/:id
app.get("/api/posts/:id", (req, res) => {
  const post = findPost(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json(post);
});

// POST /api/posts
app.post("/api/posts", (req, res) => {
  const { title, author, body, tags } = req.body;
  const newPost = {
    id: uuid(),
    title: title?.trim() || "Untitled",
    author: author?.trim() || "Anonymous",
    body: body?.trim() || "",
    tags: Array.isArray(tags)
      ? tags.map((t) => String(t).trim()).filter(Boolean)
      : String(tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
  };
  posts.unshift(newPost);
  res.status(201).json(newPost);
});

// PUT /api/posts/:id
app.put("/api/posts/:id", (req, res) => {
  const post = findPost(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const { title, author, body, tags } = req.body;
  if (title !== undefined) post.title = String(title).trim();
  if (author !== undefined) post.author = String(author).trim();
  if (body !== undefined) post.body = String(body).trim();
  if (tags !== undefined) {
    post.tags = Array.isArray(tags)
      ? tags.map((t) => String(t).trim()).filter(Boolean)
      : String(tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
  }
  res.json(post);
});

// DELETE /api/posts/:id
app.delete("/api/posts/:id", (req, res) => {
  const { id } = req.params;
  const before = posts.length;
  posts = posts.filter((p) => p.id !== id);
  if (posts.length === before) return res.status(404).json({ error: "Post not found" });
  res.status(204).send();
});

// 404 (last)
app.use((req, res) => {
  res.status(404).render("404", { message: "Route not found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mini Quora running at http://localhost:${PORT}`);
});
