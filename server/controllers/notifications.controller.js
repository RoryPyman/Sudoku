import Notification from '../models/Notification.js';

// ── GET /api/notifications/count ─────────────────────────────
// Lightweight endpoint for badge polling

export async function getUnseenCount(req, res, next) {
  try {
    const count = await Notification.countDocuments({ toUserId: req.user.id, seenAt: null });
    res.json({ count });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/notifications ────────────────────────────────────
// Last 30 notifications (seen + unseen), newest first

export async function getNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ toUserId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json({ notifications });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/notifications/:id/seen ─────────────────────────

export async function markSeen(req, res, next) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, toUserId: req.user.id },
      { seenAt: new Date() },
      { new: true },
    ).lean();

    if (!notification) {
      return res.status(404).json({ error: 'NotFound', message: 'Notification not found' });
    }

    res.json({ notification });
  } catch (err) {
    next(err);
  }
}
