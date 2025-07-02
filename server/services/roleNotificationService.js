const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const emailService = require('./emailService');

class RoleNotificationService {
  /**
   * Send comprehensive notifications when a user's role changes to superadmin
   * @param {Object} user - The user whose role changed
   * @param {string} actionType - 'promoted' or 'created'
   * @param {Object} actionBy - The user who performed the action
   */
  async notifySuperAdminRoleChange(user, actionType = 'promoted', actionBy = null) {
    try {
      console.log(`🔔 Sending SuperAdmin role notifications for user: ${user.userName} (${actionType})`);

      // 1. Send email notification to the user
      await this.sendEmailNotification(user, actionType, actionBy);

      // 2. Send in-app notification to the user
      await this.sendInAppNotification(user, actionType, actionBy);

      // 3. Notify other superadmins about the new superadmin
      if (actionType === 'created' || actionType === 'promoted') {
        await this.notifyOtherSuperAdmins(user, actionType, actionBy);
      }

      console.log(`✅ All SuperAdmin role notifications sent successfully for: ${user.userName}`);
    } catch (error) {
      console.error('❌ Error sending SuperAdmin role notifications:', error);
      throw error;
    }
  }

  /**
   * Send email notification to the user about role change
   */
  async sendEmailNotification(user, actionType, actionBy) {
    try {
      await emailService.sendSuperAdminRoleNotificationEmail(
        user.email,
        user.userName,
        actionType,
        actionBy ? actionBy.userName : null
      );
      console.log(`📧 Role change email sent to: ${user.email}`);
    } catch (error) {
      console.error('❌ Error sending role change email:', error);
      // Don't throw - email failure shouldn't stop other notifications
    }
  }

  /**
   * Send in-app system notification to the user
   */
  async sendInAppNotification(user, actionType, actionBy) {
    try {
      // Create or find a system conversation for this user
      let systemConversation = await Conversation.findOne({
        type: 'system',
        'participants.user': user._id,
        title: { $regex: /System Notifications/i }
      });

      if (!systemConversation) {
        // Create a system notification conversation
        systemConversation = new Conversation({
          title: 'System Notifications',
          type: 'system',
          participants: [{
            user: user._id,
            role: user.role,
            joinedAt: new Date()
          }],
          status: 'active',
          createdBy: null // System created
        });
        await systemConversation.save();
      }

      // Create notification message content
      const actionMessages = {
        'promoted': `🎉 Congratulations! Your role has been elevated to Super Administrator. You now have access to advanced system features and controls.`,
        'created': `👑 Welcome! Your account has been created with Super Administrator privileges. You have full access to the system dashboard and management tools.`
      };

      const messageContent = actionMessages[actionType] || actionMessages['promoted'];
      const fullMessage = actionBy 
        ? `${messageContent}\n\nAction performed by: ${actionBy.userName}`
        : messageContent;

      // Create system message
      await Message.createSystemMessage(
        systemConversation._id,
        'role_change',
        fullMessage,
        { sender: actionBy ? actionBy._id : null }
      );

      console.log(`💬 In-app role change notification sent to: ${user.userName}`);
    } catch (error) {
      console.error('❌ Error sending in-app notification:', error);
      // Don't throw - in-app notification failure shouldn't stop other notifications
    }
  }

  /**
   * Notify other superadmins about the new superadmin
   */
  async notifyOtherSuperAdmins(newSuperAdmin, actionType, actionBy) {
    try {
      // Find all existing superadmins (excluding the new one)
      const existingSuperAdmins = await User.find({
        role: 'superAdmin',
        _id: { $ne: newSuperAdmin._id },
        isActive: { $ne: false }
      }).select('_id userName email');

      if (existingSuperAdmins.length === 0) {
        console.log('ℹ️ No other SuperAdmins to notify');
        return;
      }

      console.log(`📢 Notifying ${existingSuperAdmins.length} existing SuperAdmins about new SuperAdmin: ${newSuperAdmin.userName}`);

      // Send notifications to each existing superadmin
      const notificationPromises = existingSuperAdmins.map(async (superAdmin) => {
        try {
          // Create notification message for other superadmins
          await this.sendSuperAdminTeamNotification(superAdmin, newSuperAdmin, actionType, actionBy);
        } catch (error) {
          console.error(`❌ Error notifying SuperAdmin ${superAdmin.userName}:`, error);
        }
      });

      await Promise.allSettled(notificationPromises);
      console.log(`✅ SuperAdmin team notifications completed`);
    } catch (error) {
      console.error('❌ Error notifying other SuperAdmins:', error);
    }
  }

  /**
   * Send notification to existing superadmin about new team member
   */
  async sendSuperAdminTeamNotification(existingSuperAdmin, newSuperAdmin, actionType, actionBy) {
    try {
      // Create or find a system conversation for this superadmin
      let systemConversation = await Conversation.findOne({
        type: 'system',
        'participants.user': existingSuperAdmin._id,
        title: { $regex: /System Notifications/i }
      });

      if (!systemConversation) {
        systemConversation = new Conversation({
          title: 'System Notifications',
          type: 'system',
          participants: [{
            user: existingSuperAdmin._id,
            role: existingSuperAdmin.role,
            joinedAt: new Date()
          }],
          status: 'active',
          createdBy: null
        });
        await systemConversation.save();
      }

      // Create team notification message
      const actionMessages = {
        'promoted': `👥 Team Update: ${newSuperAdmin.userName} has been promoted to Super Administrator.`,
        'created': `👥 Team Update: A new Super Administrator account has been created for ${newSuperAdmin.userName}.`
      };

      const messageContent = actionMessages[actionType] || actionMessages['promoted'];
      const fullMessage = actionBy 
        ? `${messageContent}\n\nAction performed by: ${actionBy.userName}\nNew SuperAdmin email: ${newSuperAdmin.email}`
        : `${messageContent}\nNew SuperAdmin email: ${newSuperAdmin.email}`;

      // Create system message
      await Message.createSystemMessage(
        systemConversation._id,
        'team_update',
        fullMessage,
        { sender: actionBy ? actionBy._id : null }
      );

      console.log(`💬 Team notification sent to SuperAdmin: ${existingSuperAdmin.userName}`);
    } catch (error) {
      console.error(`❌ Error sending team notification to ${existingSuperAdmin.userName}:`, error);
    }
  }

  /**
   * Check if user role change requires notification
   */
  shouldNotifyRoleChange(oldRole, newRole) {
    // Only notify when someone becomes a superadmin
    return newRole === 'superAdmin' && oldRole !== 'superAdmin';
  }

  /**
   * Get all superadmins for notifications
   */
  async getAllSuperAdmins() {
    try {
      return await User.find({
        role: 'superAdmin',
        isActive: { $ne: false }
      }).select('_id userName email');
    } catch (error) {
      console.error('❌ Error fetching SuperAdmins:', error);
      return [];
    }
  }
}

module.exports = new RoleNotificationService(); 