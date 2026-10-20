const crypto = require('crypto');

/**
 * Service to handle secure pickup and delivery handover codes
 */
class CodeService {
  /**
   * Generates a 6-digit numeric verification code
   */
  static generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Hashes a code using SHA-256 for secure persistence
   */
  static hashCode(code) {
    return crypto.createHash('sha256').update(code.trim()).digest('hex');
  }

  /**
   * Verifies an entered code against the stored hash
   */
  static verifyCode(enteredCode, storedHash) {
    if (!enteredCode || !storedHash) return false;
    const computedHash = this.hashCode(enteredCode.trim());
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(storedHash));
  }
}

module.exports = CodeService;
