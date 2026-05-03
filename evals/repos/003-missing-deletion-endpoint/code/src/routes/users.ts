import { Router } from "express";

const router: Router = Router();

router.get("/users/:id", (_req, res) => {
  res.json({ id: _req.params.id, name: "stub" });
});

router.post("/users", (req, res) => {
  res.status(201).json({ id: "new", ...req.body });
});

router.put("/users/:id", (req, res) => {
  res.json({ id: req.params.id, ...req.body });
});

// NOTE: no DELETE handler — users cannot exercise their right to erasure.

export default router;
