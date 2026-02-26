import { ZodError } from 'zod';

/**
 * Returns an Express middleware that validates `req.body` against a Zod schema.
 * On success, replaces req.body with the parsed (coerced) value.
 */
export function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(422).json({
          error: 'ValidationError',
          message: 'Invalid request data',
          details: err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
}
