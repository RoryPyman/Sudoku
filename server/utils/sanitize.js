/**
 * Strip sensitive fields before sending a User document to the client.
 */
export function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj.refreshTokens;
  delete obj.__v;
  // Normalise _id → id
  obj.id = obj._id?.toString();
  delete obj._id;
  return obj;
}
