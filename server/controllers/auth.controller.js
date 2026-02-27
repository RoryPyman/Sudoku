import bcrypt from 'bcrypt';
import User from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';

const SALT_ROUNDS       = 12;
const REFRESH_TOKEN_MAX = 5;

function cookieOptions() {
  return {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
  };
}

// ── POST /api/auth/register ────────────────────────────────────────────────

export async function register(req, res, next) {
  try {
    const { username, firstName, lastName, email, password } = req.body;

    const [takenUsername, takenEmail] = await Promise.all([
      User.findOne({ username: username.toLowerCase() }),
      User.findOne({ email }),
    ]);
    if (takenUsername) return res.status(409).json({ error: 'Conflict', message: 'Username already taken' });
    if (takenEmail)    return res.status(409).json({ error: 'Conflict', message: 'Email already registered' });

    const passwordHash   = await bcrypt.hash(password, SALT_ROUNDS);
    const user           = await User.create({ username, firstName, lastName, email, passwordHash });
    const accessToken    = generateAccessToken(user._id);
    const refreshToken   = generateRefreshToken(user._id);
    const hashedRefresh  = await bcrypt.hash(refreshToken, SALT_ROUNDS);

    user.refreshTokens = [hashedRefresh];
    await user.save();

    res
      .cookie('refreshToken', refreshToken, cookieOptions())
      .status(201)
      .json({ user: user.toPublicJSON(), accessToken });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/login ───────────────────────────────────────────────────

export async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
    });

    const valid = user && await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    const accessToken   = generateAccessToken(user._id);
    const refreshToken  = generateRefreshToken(user._id);
    const hashedRefresh = await bcrypt.hash(refreshToken, SALT_ROUNDS);

    // Keep at most REFRESH_TOKEN_MAX tokens — prune oldest
    user.refreshTokens = [
      ...user.refreshTokens.slice(-(REFRESH_TOKEN_MAX - 1)),
      hashedRefresh,
    ];
    await user.save();

    res
      .cookie('refreshToken', refreshToken, cookieOptions())
      .json({ user: user.toPublicJSON(), accessToken });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/refresh ────────────────────────────────────────────────

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'No refresh token' });
    }

    // Verify JWT signature first — gives us the userId without a DB round-trip
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      res.clearCookie('refreshToken', cookieOptions());
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid refresh token' });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      res.clearCookie('refreshToken', cookieOptions());
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    }

    // Compare presented token against every stored hash
    let matchIndex = -1;
    for (let i = 0; i < user.refreshTokens.length; i++) {
      if (await bcrypt.compare(token, user.refreshTokens[i])) {
        matchIndex = i;
        break;
      }
    }

    if (matchIndex === -1) {
      // Token reuse detected — revoke all sessions for this user
      user.refreshTokens = [];
      await user.save();
      res.clearCookie('refreshToken', cookieOptions());
      return res.status(401).json({ error: 'Unauthorized', message: 'Token reuse detected — all sessions revoked' });
    }

    // Rotate: remove old hash, issue new pair
    const newAccessToken  = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    const newHash         = await bcrypt.hash(newRefreshToken, SALT_ROUNDS);

    user.refreshTokens.splice(matchIndex, 1);
    user.refreshTokens = [
      ...user.refreshTokens.slice(-(REFRESH_TOKEN_MAX - 1)),
      newHash,
    ];
    await user.save();

    res
      .cookie('refreshToken', newRefreshToken, cookieOptions())
      .json({ accessToken: newAccessToken, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/logout ─────────────────────────────────────────────────

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        const user    = await User.findById(payload.sub);
        if (user) {
          // Remove only the matching hash, leaving other sessions intact
          const remaining = [];
          for (const hash of user.refreshTokens) {
            if (!(await bcrypt.compare(token, hash))) remaining.push(hash);
          }
          user.refreshTokens = remaining;
          await user.save();
        }
      } catch {
        // Token invalid — just clear the cookie below
      }
    }

    res.clearCookie('refreshToken', cookieOptions()).json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/auth/me ──────────────────────────────────────────────────────

export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'NotFound', message: 'User not found' });
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/auth/check-username ──────────────────────────────────────────

export async function checkUsername(req, res, next) {
  try {
    const { username } = req.query;
    if (!username || username.length < 3) return res.json({ available: false });
    const exists = await User.findOne({ username: username.toLowerCase() });
    res.json({ available: !exists });
  } catch (err) {
    next(err);
  }
}
