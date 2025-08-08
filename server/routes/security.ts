import { Router } from "express";
const router = Router();

router.post("/security-events", (req, res) => {
  // Optional: log minimal security events server-side
  // console.log("[SECURITY]", req.body);
  res.sendStatus(204); // No Content
});

export default router;
