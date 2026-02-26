import { Router } from 'express';
import { z } from 'zod';
import { validate }    from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter }  from '../middleware/rateLimiter.js';
import * as ctrl from '../controllers/auth.controller.js';

const router = Router();

const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/, 'Password must contain at least one special character');

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
  email:    z.string().email('Invalid email address'),
  password: passwordRule,
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password:   z.string().min(1, 'Password is required'),
});

router.post('/register', authLimiter, validate(registerSchema), ctrl.register);
router.post('/login',    authLimiter, validate(loginSchema),    ctrl.login);
router.post('/refresh',  authLimiter,                           ctrl.refresh);
router.post('/logout',                                          ctrl.logout);
router.get( '/me',       authenticate,                          ctrl.getMe);

export default router;
