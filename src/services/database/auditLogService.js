/**
 * @fileoverview Service for creating audit log entries.
 * This service centralizes the logic for logging important actions
 * throughout the application for security and compliance purposes.
 */

import { dbService } from './index';

const auditLogService = {
  /**
   * Creates a new audit log entry.
   * @param {string} action - The action being performed (e.g., 'User Login', 'Patient Updated').
   * @param {object} details - A JSON object with relevant details about the action.
   * @param {string} [userId] - The ID of the user performing the action. If not provided, it will be inferred if possible.
   * @returns {Promise<void>}
   */
  async log(action, details = {}, userId = null) {
    try {
      let currentUserId = userId;
      
      // If no userId is passed, try to get it from the current session.
      // This part might need to be adjusted based on how auth state is managed.
      // For now, we assume this is handled or passed in.

      const logEntry = {
        action,
        details,
        userId: currentUserId,
        timestamp: new Date(),
      };

      await dbService.create('audit_logs', logEntry);

    } catch (error) {
      console.error('Failed to create audit log:', error);
      // We don't want audit log failures to break the user's flow,
      // so we just log the error and continue.
    }
  },
};

export default auditLogService;
