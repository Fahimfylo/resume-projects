const { encrypt, decrypt } = require("./encryption");

/**
 * Create an encrypted relation token from a MongoDB invite ID.
 * The token contains { inviteId } encrypted with AES-256-CBC.
 */
function createRelationToken(inviteId) {
  const payload = JSON.stringify({ inviteId });
  return encrypt(payload);
}

/**
 * Decrypt a relation token and extract the inviteId.
 * Returns the raw inviteId string, or throws on failure.
 */
function extractInviteId(relationToken) {
  const decrypted = decrypt(relationToken);
  const payload = JSON.parse(decrypted);
  return payload.inviteId;
}

module.exports = { createRelationToken, extractInviteId };
