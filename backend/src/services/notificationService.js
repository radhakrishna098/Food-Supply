const Notification = require('../models/Notification');

class NotificationService {
  /**
   * Send an in-app notification
   */
  static async notify({
    recipient,
    type,
    title,
    message,
    relatedDonation = null,
    relatedRequest = null,
    relatedPickup = null,
  }) {
    try {
      const notification = new Notification({
        recipient,
        type,
        title,
        message,
        relatedDonation,
        relatedRequest,
        relatedPickup,
      });
      await notification.save();
      return notification;
    } catch (err) {
      console.error('[NotificationService Error]: Failed to send notification', err.message);
      return null;
    }
  }

  /**
   * Notify multiple recipients
   */
  static async notifyMany(recipients, payload) {
    return Promise.all(
      recipients.map((recipientId) =>
        this.notify({ ...payload, recipient: recipientId })
      )
    );
  }
}

module.exports = NotificationService;
