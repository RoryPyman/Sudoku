import User from '../models/User.js';

// ── GET /api/friends ──────────────────────────────────────────────────────

export async function getFriends(req, res, next) {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends', 'username firstName lastName')
      .lean();

    const friends = (user.friends || [])
      .map(f => ({ userId: f._id, username: f.username, firstName: f.firstName, lastName: f.lastName }))
      .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));

    res.json({ friends });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/friends/requests ─────────────────────────────────────────────

export async function getRequests(req, res, next) {
  try {
    const user = await User.findById(req.user.id)
      .populate('friendRequestsReceived', 'username firstName lastName')
      .populate('friendRequestsSent', 'username firstName lastName')
      .lean();

    const map = (f) => ({ userId: f._id, username: f.username, firstName: f.firstName, lastName: f.lastName });

    res.json({
      received: (user.friendRequestsReceived || []).map(map),
      sent:     (user.friendRequestsSent || []).map(map),
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/friends/search?q= ────────────────────────────────────────────

export async function searchUsers(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ users: [] });

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { username: regex },
        { firstName: regex },
        { lastName: regex },
      ],
    })
      .select('username firstName lastName')
      .limit(20)
      .lean();

    const me = await User.findById(req.user.id)
      .select('friends friendRequestsSent friendRequestsReceived')
      .lean();

    const friendSet    = new Set((me.friends || []).map(id => id.toString()));
    const sentSet      = new Set((me.friendRequestsSent || []).map(id => id.toString()));
    const receivedSet  = new Set((me.friendRequestsReceived || []).map(id => id.toString()));

    const results = users.map(u => {
      const uid = u._id.toString();
      let relationshipStatus = 'none';
      if (friendSet.has(uid))   relationshipStatus = 'friends';
      else if (sentSet.has(uid))     relationshipStatus = 'request_sent';
      else if (receivedSet.has(uid)) relationshipStatus = 'request_received';

      return {
        userId: u._id,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        relationshipStatus,
      };
    });

    res.json({ users: results });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/friends/request/:userId ─────────────────────────────────────

export async function sendRequest(req, res, next) {
  try {
    const targetId = req.params.userId;
    if (targetId === req.user.id) {
      return res.status(400).json({ error: 'BadRequest', message: 'Cannot friend yourself' });
    }

    const [me, target] = await Promise.all([
      User.findById(req.user.id),
      User.findById(targetId),
    ]);
    if (!target) return res.status(404).json({ error: 'NotFound', message: 'User not found' });

    if (me.friends.some(id => id.toString() === targetId)) {
      return res.status(409).json({ error: 'Conflict', message: 'Already friends' });
    }
    if (me.friendRequestsSent.some(id => id.toString() === targetId)) {
      return res.status(409).json({ error: 'Conflict', message: 'Request already sent' });
    }

    await Promise.all([
      User.updateOne({ _id: req.user.id }, { $addToSet: { friendRequestsSent: targetId } }),
      User.updateOne({ _id: targetId },    { $addToSet: { friendRequestsReceived: req.user.id } }),
    ]);

    res.json({ message: 'Friend request sent' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/friends/accept/:userId ──────────────────────────────────────

export async function acceptRequest(req, res, next) {
  try {
    const senderId = req.params.userId;

    const me = await User.findById(req.user.id);
    if (!me.friendRequestsReceived.some(id => id.toString() === senderId)) {
      return res.status(400).json({ error: 'BadRequest', message: 'No pending request from this user' });
    }

    await Promise.all([
      User.updateOne({ _id: req.user.id }, {
        $addToSet: { friends: senderId },
        $pull: { friendRequestsReceived: senderId },
      }),
      User.updateOne({ _id: senderId }, {
        $addToSet: { friends: req.user.id },
        $pull: { friendRequestsSent: req.user.id },
      }),
    ]);

    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/friends/decline/:userId ─────────────────────────────────────

export async function declineRequest(req, res, next) {
  try {
    const senderId = req.params.userId;

    await Promise.all([
      User.updateOne({ _id: req.user.id }, { $pull: { friendRequestsReceived: senderId } }),
      User.updateOne({ _id: senderId },    { $pull: { friendRequestsSent: req.user.id } }),
    ]);

    res.json({ message: 'Friend request declined' });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/friends/remove/:userId ────────────────────────────────────

export async function removeFriend(req, res, next) {
  try {
    const friendId = req.params.userId;

    await Promise.all([
      User.updateOne({ _id: req.user.id }, { $pull: { friends: friendId } }),
      User.updateOne({ _id: friendId },    { $pull: { friends: req.user.id } }),
    ]);

    res.json({ message: 'Friend removed' });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/friends/cancel/:userId ────────────────────────────────────

export async function cancelRequest(req, res, next) {
  try {
    const targetId = req.params.userId;

    await Promise.all([
      User.updateOne({ _id: req.user.id }, { $pull: { friendRequestsSent: targetId } }),
      User.updateOne({ _id: targetId },    { $pull: { friendRequestsReceived: req.user.id } }),
    ]);

    res.json({ message: 'Friend request cancelled' });
  } catch (err) {
    next(err);
  }
}
