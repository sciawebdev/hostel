import { NOTIFICATION_TEMPLATES } from './firebase'

// Firebase Admin SDK would be used in a real backend
// For now, we'll simulate the notification sending
export class NotificationService {
  private static serverKey = 'your-firebase-server-key-here' // From Firebase Console

  // Send notification to specific user
  static async sendToUser(userId: string, template: any, data: any) {
    try {
      // In a real app, you'd get the user's FCM token from your database
      const userToken = await this.getUserToken(userId)
      if (userToken) {
        await this.sendNotification(userToken, template, data)
      }
    } catch (error) {
      console.error('Failed to send notification to user:', error)
    }
  }

  // Send notification to a topic (group of users)
  static async sendToTopic(topic: string, template: any, data: any) {
    try {
      await this.sendNotification(`/topics/${topic}`, template, data)
    } catch (error) {
      console.error('Failed to send notification to topic:', error)
    }
  }

  // Send notification to all admins
  static async notifyAdmins(complaint: any, type: 'NEW_COMPLAINT' | 'WORK_COMPLETED') {
    const template = NOTIFICATION_TEMPLATES[type]
    await this.sendToTopic('admins', template, complaint)
  }

  // Send notification to assigned staff member
  static async notifyAssignedStaff(complaint: any, staffId: string) {
    const template = NOTIFICATION_TEMPLATES.COMPLAINT_ASSIGNED
    await this.sendToUser(staffId, template, complaint)
  }

  // Send status update notification
  static async notifyStatusUpdate(complaint: any, status: string, recipientIds: string[]) {
    const template = NOTIFICATION_TEMPLATES.STATUS_UPDATE
    
    for (const userId of recipientIds) {
      await this.sendToUser(userId, template, { complaint, status })
    }
  }

  // Private method to send actual notification
  private static async sendNotification(to: string, template: any, data: any) {
    const notification = {
      to,
      notification: {
        title: template.title,
        body: typeof template.body === 'function' ? template.body(data) : template.body,
        sound: 'default',
        badge: 1,
      },
      data: typeof template.data === 'function' ? template.data(data) : template.data,
      android: {
        notification: {
          channel_id: 'hostel_notifications',
          priority: 'high',
          default_sound: true,
          default_vibrate_timings: true,
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          }
        }
      }
    }

    // In production, you'd send this to Firebase FCM API
    // For now, we'll just log it
    console.log('📱 Sending notification:', notification)
    
    // TODO: Implement actual FCM API call
    // const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `key=${this.serverKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(notification)
    // })
  }

  // Get user's FCM token from database
  private static async getUserToken(userId: string): Promise<string | null> {
    // TODO: Implement database lookup for user's FCM token
    // const { data } = await supabase
    //   .from('device_tokens')
    //   .select('token')
    //   .eq('user_id', userId)
    //   .single()
    // return data?.token || null
    
    console.log(`📱 Getting FCM token for user: ${userId}`)
    return null // Placeholder
  }

  // Subscribe user to notification topics based on their role
  static async subscribeUserToTopics(userId: string, role: string) {
    const topics = this.getTopicsForRole(role)
    
    for (const topic of topics) {
      console.log(`📱 Subscribing user ${userId} to topic: ${topic}`)
      // TODO: Implement topic subscription
    }
  }

  // Get notification topics based on user role
  private static getTopicsForRole(role: string): string[] {
    const roleTopics: Record<string, string[]> = {
      'admin-role': ['admins', 'all-users'],
      'campus-coordinator': ['campus-coordinators', 'all-users'],
      'floor-incharge': ['floor-incharges', 'all-users'],
      'maintenance-staff': ['maintenance-staff', 'all-users'],
    }

    return roleTopics[role] || ['all-users']
  }
}

// Notification templates for easy reuse
export const ComplaintNotifications = {
  // Send when new complaint is submitted
  onComplaintSubmitted: async (complaint: any) => {
    await NotificationService.notifyAdmins(complaint, 'NEW_COMPLAINT')
  },

  // Send when complaint is assigned
  onComplaintAssigned: async (complaint: any, staffId: string) => {
    await NotificationService.notifyAssignedStaff(complaint, staffId)
  },

  // Send when work is completed
  onWorkCompleted: async (complaint: any) => {
    await NotificationService.notifyAdmins(complaint, 'WORK_COMPLETED')
  },

  // Send when status is updated
  onStatusUpdated: async (complaint: any, newStatus: string, recipientIds: string[]) => {
    await NotificationService.notifyStatusUpdate(complaint, newStatus, recipientIds)
  },

  // Send urgent notifications for high priority complaints
  onUrgentComplaint: async (complaint: any) => {
    // Send to all relevant staff immediately
    await NotificationService.sendToTopic('urgent-alerts', {
      title: '🚨 URGENT: High Priority Complaint',
      body: `${complaint.complaint_id}: ${complaint.category} requires immediate attention`,
      data: { complaint_id: complaint.complaint_id, priority: 'urgent' }
    }, complaint)
  }
} 