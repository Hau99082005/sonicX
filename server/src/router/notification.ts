import { Router } from "express";
import { mustAuth } from "#/middleware/auth";
import {
  getNotifications,
  markAllRead,
  markOneRead,
  deleteNotification,
  deleteAllNotifications,
  getSettings,
  updateSettings,
} from "#/controllers/notification";

const router = Router();

router.get("/", mustAuth, getNotifications);
router.patch("/read-all", mustAuth, markAllRead);
router.patch("/:id/read", mustAuth, markOneRead);
router.delete("/all", mustAuth, deleteAllNotifications);
router.delete("/:id", mustAuth, deleteNotification);

router.get("/settings", mustAuth, getSettings);
router.patch("/settings", mustAuth, updateSettings);

export default router;
