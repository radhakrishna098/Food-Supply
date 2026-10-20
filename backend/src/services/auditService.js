const AuditLog = require('../models/AuditLog');

class AuditService {
  /**
   * Log an auditable action
   */
  static async log({
    actor = null,
    actorName = 'SYSTEM',
    actorRole = 'system',
    action,
    entityType,
    entityId,
    previousState = null,
    newState = null,
    metadata = {},
    ipAddress = '',
  }) {
    try {
      const logEntry = new AuditLog({
        actor,
        actorName,
        actorRole,
        action,
        entityType,
        entityId: String(entityId),
        previousState,
        newState,
        metadata,
        ipAddress,
        timestamp: new Date(),
      });
      await logEntry.save();
      return logEntry;
    } catch (err) {
      console.error('[AuditService Error]: Failed to create audit log', err.message);
      return null;
    }
  }
}

module.exports = AuditService;
