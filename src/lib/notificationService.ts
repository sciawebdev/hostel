import { NOTIFICATION_TEMPLATES } from './firebase'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'
import { getMessaging, getToken } from 'firebase/messaging'
import app from './firebase'
import { registerPlugin } from '@capacitor/core'

// Define the FCM Token Manager plugin interface
interface FCMTokenManagerPlugin {
  getToken(): Promise<{ token: string }>
  subscribeToTopic(options: { topic: string }): Promise<void>
  unsubscribeFromTopic(options: { topic: string }): Promise<void>
}

// Register the plugin
const FCMTokenManager = registerPlugin<FCMTokenManagerPlugin>('FCMTokenManager')

export interface NotificationPayload {
  title: string
  body: string
  data?: Record<string, any>
  urgent?: boolean
  actionType?: 'complaint' | 'assignment' | 'completion' | 'approval'
  complaintId?: string
  hostelName?: string
}

export interface NotificationServiceConfig {
  enableLogging?: boolean
  userId?: string
  userRole?: string
  hostelName?: string
}

// Real push notification service
export class NotificationService {
  // Static properties for the class
  private static messaging = Capacitor.isNativePlatform() ? null : getMessaging(app)
  private static initialized = false
  
  // Instance properties
  private fcmToken: string | null = null
  private subscribedTopics: Set<string> = new Set()
  private config: NotificationServiceConfig = { enableLogging: true }
  private isInitialized = false

  // Initialize notification service
  static async initialize(config: NotificationServiceConfig = {}) {
    if (NotificationService.initialized) {
      console.log('📱 Notification service already initialized')
      return
    }

    try {
      console.log('📱 Initializing notification service...', config)

      if (Capacitor.isNativePlatform()) {
        // Request notification permissions
        const result = await LocalNotifications.requestPermissions()
        console.log('📱 Local notification permissions:', result)

        // Register for push notifications
        await PushNotifications.requestPermissions()
        await PushNotifications.register()

        // Add listeners
        PushNotifications.addListener('registration', token => {
          console.log('📱 Push registration success, token:', token.value)
        })
      } else {
        // Browser notifications
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission()
        }
      }

      NotificationService.initialized = true
      console.log('📱 Notification service initialized successfully')

    } catch (error) {
      console.error('📱 Failed to initialize notification service:', error)
      throw error
    }
  }

  // Test notification function
  static async sendTestNotification() {
    await this.sendNotification('/topics/test', {
      title: '🧪 Test Notification',
      body: 'This is a test notification to verify the system is working!',
      data: { type: 'test', action: 'TEST_NOTIFICATION' }
    }, { test: true })
  }

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

  // Send notification to floor incharge for their hostel
  static async notifyFloorIncharge(complaint: any, hostelId: string) {
    const template = NOTIFICATION_TEMPLATES.NEW_COMPLAINT
    // Use hostel-specific topic to target the floor incharge for this hostel
    const hostelTopic = `floor-incharge-${hostelId.toLowerCase()}`
    await this.sendToTopic(hostelTopic, template, complaint)
  }

  // Send status update notification
  static async notifyStatusUpdate(complaint: any, status: string, recipientIds: string[]) {
    console.log(`📱 Notifying status update: ${status} for complaint ${complaint.id} to recipients:`, recipientIds)
    // TODO: Implement status update notification
  }

  // Private method to send actual notification
  private static async sendNotification(to: string, template: any, data: any) {
    const title = template.title
    const body = typeof template.body === 'function' ? template.body(data) : template.body
    const notificationData = typeof template.data === 'function' ? template.data(data) : template.data

    console.log('📱 Sending notification:', { title, body, to })

    if (Capacitor.isNativePlatform()) {
      // For native platforms, show immediate local notification
      try {
        // Check if we have permission for local notifications
        const permission = await LocalNotifications.checkPermissions()
        if (permission.display !== 'granted') {
          const result = await LocalNotifications.requestPermissions()
          if (result.display !== 'granted') {
            console.log('📱 Local notification permission denied')
            return
          }
        }

        // Send immediate local notification
        await LocalNotifications.schedule({
          notifications: [{
            title,
            body,
            id: Math.floor(Math.random() * 1000000), // Random ID
            schedule: { at: new Date(Date.now() + 100) }, // Almost immediate (100ms delay)
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: notificationData
          }]
        })
        
        console.log('📱 Local notification sent successfully')
      } catch (error) {
        console.error('📱 Failed to send local notification:', error)
      }
    } else {
      // For web, show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/vite.svg',
          badge: '/vite.svg',
          data: notificationData
        })
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/vite.svg',
            badge: '/vite.svg',
            data: notificationData
          })
        }
      }
    }
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

  // Subscribe user to notification topics based on their role and hostel
  static async subscribeUserToTopics(userId: string, role: string, hostelId?: string) {
    const topics = this.getTopicsForUser(role, hostelId)
    
    for (const topic of topics) {
      console.log(`📱 Subscribing user ${userId} to topic: ${topic}`)
      // TODO: Implement topic subscription via FCM
      // await messaging.subscribeToTopic(userToken, topic)
    }
  }

  // Get notification topics based on user role and hostel
  static getTopicsForUser(role: string, hostelId?: string): string[] {
    const baseTopics: Record<string, string[]> = {
      'admin-role': ['admins', 'all-users'],
      'campus-coordinator': ['campus-coordinators', 'all-users'],
      'floor-incharge': ['floor-incharges', 'all-users'],
      'maintenance-staff': ['maintenance-staff', 'all-users'],
    }

    let topics = baseTopics[role] || ['all-users']

    // Add hostel-specific topics for floor incharges
    if (role === 'floor-incharge' && hostelId) {
      topics.push(`floor-incharge-${hostelId.toLowerCase()}`)
    }

    return topics
  }

  // Get notification topics based on user role (legacy method)
  private static getTopicsForRole(role: string): string[] {
    return this.getTopicsForUser(role)
  }

  async initialize(config: NotificationServiceConfig = {}) {
    if (this.isInitialized) {
      this.log('Notification service already initialized')
      return
    }

    this.config = { ...this.config, ...config }
    this.log('Initializing notification service...', config)

    try {
      if (Capacitor.isNativePlatform()) {
        await this.initializeNativeNotifications()
      } else {
        await this.initializeBrowserNotifications()
      }

      // Get FCM token for both platforms
      await this.getFCMToken()
      
      // Subscribe to role-based topics
      await this.subscribeToRoleBasedTopics()

      this.isInitialized = true
      this.log('Notification service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize notification service:', error)
      throw error
    }
  }

  private async initializeNativeNotifications() {
    this.log('Initializing native notifications...')

    // Request permissions
    const permissionResult = await LocalNotifications.requestPermissions()
    this.log('Local notification permissions:', permissionResult)

    if (permissionResult.display === 'granted') {
      this.log('Local notification permissions granted')
    } else {
      console.warn('Local notification permissions not granted')
    }

    // Initialize push notifications
    await PushNotifications.requestPermissions()
    
    // Register for push notifications
    await PushNotifications.register()

    // Add listeners
    PushNotifications.addListener('registration', token => {
      this.log('Push registration success, token:', token.value)
      this.fcmToken = token.value
    })

    PushNotifications.addListener('registrationError', err => {
      console.error('Registration error:', err.error)
    })

    PushNotifications.addListener('pushNotificationReceived', notification => {
      this.log('Push notification received:', notification)
    })

    PushNotifications.addListener('pushNotificationActionPerformed', notification => {
      this.log('Push notification action performed:', notification)
    })
  }

  private async initializeBrowserNotifications() {
    this.log('Initializing browser notifications...')

    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications')
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      this.log('Browser notification permission:', permission)
    }

    if (Notification.permission !== 'granted') {
      console.warn('Browser notification permissions not granted')
    }
  }

  private async getFCMToken() {
    try {
      if (Capacitor.isNativePlatform()) {
        // Get token from native plugin
        const result = await FCMTokenManager.getToken()
        this.fcmToken = result.token
        this.log('FCM Token from native:', this.fcmToken)
      } else {
        // For web platform, get token from Firebase Web SDK
        if (NotificationService.messaging) {
          try {
            // Note: This requires Firebase project configuration
            this.fcmToken = await getToken(NotificationService.messaging, {
              vapidKey: 'YOUR_VAPID_KEY' // TODO: Add your VAPID key
            })
            this.log('FCM Token from web:', this.fcmToken)
          } catch (error) {
            this.log('Failed to get web FCM token:', error)
          }
        }
      }

      // Send token to server for storage
      if (this.fcmToken && this.config.userId) {
        await this.sendTokenToServer(this.fcmToken)
      }
    } catch (error) {
      console.error('Failed to get FCM token:', error)
    }
  }

  private async sendTokenToServer(token: string) {
    try {
      // TODO: Implement server-side token storage using Supabase MCP
      // This should store the token in a user_fcm_tokens table
      this.log('TODO: Send FCM token to server:', {
        token,
        userId: this.config.userId,
        userRole: this.config.userRole,
        hostelName: this.config.hostelName,
        platform: Capacitor.isNativePlatform() ? 'mobile' : 'web',
        timestamp: new Date().toISOString()
      })

      // Example implementation would be:
      // await supabase.from('user_fcm_tokens').upsert({
      //   user_id: this.config.userId,
      //   fcm_token: token,
      //   platform: Capacitor.isNativePlatform() ? 'mobile' : 'web',
      //   user_role: this.config.userRole,
      //   hostel_name: this.config.hostelName,
      //   last_updated: new Date().toISOString()
      // })
    } catch (error) {
      console.error('Failed to send token to server:', error)
    }
  }

  private async subscribeToRoleBasedTopics() {
    if (!Capacitor.isNativePlatform()) {
      this.log('Topic subscription only available on native platform')
      return
    }

    const { userRole, hostelName } = this.config
    const topics: string[] = []

    // Add role-based topics
    if (userRole === 'admin') {
      topics.push('admin-notifications')
    } else if (userRole === 'floor_incharge' && hostelName) {
      topics.push(`floor-incharge-${hostelName.toLowerCase().replace(/\s+/g, '-')}`)
    } else if (userRole === 'campus_incharge') {
      topics.push('campus-incharge-notifications')
    }

    // Subscribe to topics
    for (const topic of topics) {
      await this.subscribeToTopic(topic)
    }
  }

  async subscribeToTopic(topic: string) {
    if (!Capacitor.isNativePlatform()) {
      this.log('Topic subscription only available on native platform')
      return
    }

    try {
      await FCMTokenManager.subscribeToTopic({ topic })
      this.subscribedTopics.add(topic)
      this.log(`Subscribed to topic: ${topic}`)
    } catch (error) {
      console.error(`Failed to subscribe to topic ${topic}:`, error)
    }
  }

  async unsubscribeFromTopic(topic: string) {
    if (!Capacitor.isNativePlatform()) {
      this.log('Topic unsubscription only available on native platform')
      return
    }

    try {
      await FCMTokenManager.unsubscribeFromTopic({ topic })
      this.subscribedTopics.delete(topic)
      this.log(`Unsubscribed from topic: ${topic}`)
    } catch (error) {
      console.error(`Failed to unsubscribe from topic ${topic}:`, error)
    }
  }

  async sendNotification(payload: NotificationPayload) {
    if (!this.isInitialized) {
      console.warn('Notification service not initialized')
      return
    }

    this.log('Sending notification:', payload)

    try {
      if (Capacitor.isNativePlatform()) {
        await this.sendNativeNotification(payload)
      } else {
        await this.sendBrowserNotification(payload)
      }
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }

  private async sendNativeNotification(payload: NotificationPayload) {
    try {
      // Check permissions first
      const permissions = await LocalNotifications.checkPermissions()
      if (permissions.display !== 'granted') {
        console.warn('Notification permissions not granted')
        return
      }

      const notificationId = Math.floor(Math.random() * 100000)
      
      await LocalNotifications.schedule({
        notifications: [
          {
            title: payload.title,
            body: payload.body,
            id: notificationId,
            schedule: { at: new Date(Date.now() + 100) }, // Immediate delivery
            sound: 'default',
            attachments: undefined,
            actionTypeId: payload.actionType || 'default',
            extra: {
              ...payload.data,
              complaintId: payload.complaintId,
              actionType: payload.actionType,
              timestamp: new Date().toISOString()
            }
          }
        ]
      })

      this.log(`Native notification scheduled with ID: ${notificationId}`)
    } catch (error) {
      console.error('Failed to send native notification:', error)
      throw error
    }
  }

  private async sendBrowserNotification(payload: NotificationPayload) {
    if (Notification.permission !== 'granted') {
      console.warn('Browser notification permissions not granted')
      return
    }

    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: '/vite.svg',
        badge: '/vite.svg',
        tag: payload.complaintId || 'hostel-notification',
        data: {
          ...payload.data,
          complaintId: payload.complaintId,
          actionType: payload.actionType,
          timestamp: new Date().toISOString()
        },
        requireInteraction: payload.urgent || false
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
        
        // Handle notification click based on action type
        if (payload.actionType === 'complaint' && payload.complaintId) {
          // Navigate to complaint details
          window.location.href = `/#/complaint/${payload.complaintId}`
        }
      }

      // Auto close after 10 seconds if not urgent
      if (!payload.urgent) {
        setTimeout(() => notification.close(), 10000)
      }

      this.log('Browser notification sent successfully')
    } catch (error) {
      console.error('Failed to send browser notification:', error)
      throw error
    }
  }

  // Notification templates for different scenarios
  async notifyFloorInchargeNewComplaint(complaintId: string, hostelName: string, roomNumber: string, category: string) {
    await this.sendNotification({
      title: 'New Complaint Assigned',
      body: `Room ${roomNumber} in ${hostelName} - ${category}. Please review and take action.`,
      actionType: 'complaint',
      complaintId,
      hostelName,
      urgent: true,
      data: {
        type: 'new_complaint',
        hostelName,
        roomNumber,
        category
      }
    })
  }

  async notifyAdminNewComplaint(complaintId: string, hostelName: string, roomNumber: string, category: string) {
    await this.sendNotification({
      title: 'New Complaint Filed',
      body: `${category} complaint from Room ${roomNumber}, ${hostelName}`,
      actionType: 'complaint',
      complaintId,
      hostelName,
      data: {
        type: 'admin_notification',
        hostelName,
        roomNumber,
        category
      }
    })
  }

  async notifyWorkCompletion(complaintId: string, hostelName: string, roomNumber: string) {
    await this.sendNotification({
      title: 'Work Completed',
      body: `Work completed for Room ${roomNumber}, ${hostelName}. Please verify.`,
      actionType: 'completion',
      complaintId,
      hostelName,
      data: {
        type: 'work_completion',
        hostelName,
        roomNumber
      }
    })
  }

  async notifyCostApprovalRequired(complaintId: string, amount: number, category: string) {
    await this.sendNotification({
      title: 'Cost Approval Required',
      body: `${category} repair requires ₹${amount} approval`,
      actionType: 'approval',
      complaintId,
      urgent: true,
      data: {
        type: 'cost_approval',
        amount,
        category
      }
    })
  }

  // Test notification for debugging
  async sendTestNotification() {
    await this.sendNotification({
      title: 'Test Notification',
      body: 'This is a test notification from the hostel management system',
      actionType: 'complaint',
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    })
  }

  // Get current status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasToken: !!this.fcmToken,
      subscribedTopics: Array.from(this.subscribedTopics),
      platform: Capacitor.isNativePlatform() ? 'native' : 'web',
      config: this.config
    }
  }

  private log(message: string, data?: any) {
    if (this.config.enableLogging) {
      if (data) {
        console.log(`[NotificationService] ${message}`, data)
      } else {
        console.log(`[NotificationService] ${message}`)
      }
    }
  }

  static async onStatusUpdated(complaint: any, status: string, recipientIds: string[]) {
    return this.notifyStatusUpdate(complaint, status, recipientIds)
  }

  static async onComplaintAssigned(complaint: any, staffMemberId: string) {
    console.log(`📱 Notifying complaint assignment: ${complaint.id} to staff ${staffMemberId}`)
    return this.notifyAssignedStaff(complaint, staffMemberId)
  }

  static async onComplaintSubmitted(complaint: any) {
    console.log(`📱 Notifying new complaint submission: ${complaint.id}`)
    // Notify admins about new complaint
    await this.notifyAdmins(complaint, 'NEW_COMPLAINT')
    
    // Notify floor incharge if hostel is specified
    if (complaint.hostel_id) {
      await this.notifyFloorIncharge(complaint, complaint.hostel_id)
    }
  }

  static async onUrgentComplaint(complaint: any) {
    console.log(`📱 Notifying urgent complaint: ${complaint.id}`)
    // Send urgent notifications to all relevant parties
    await this.notifyAdmins(complaint, 'NEW_COMPLAINT')
    if (complaint.hostel_id) {
      await this.notifyFloorIncharge(complaint, complaint.hostel_id)
    }
  }

  static async onWorkVerificationNeeded(complaint: any) {
    console.log(`📱 Notifying work verification needed: ${complaint.id}`)
    // Notify floor incharge that work verification is needed
    if (complaint.hostel_id) {
      await this.notifyFloorIncharge(complaint, complaint.hostel_id)
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()

// Export alias for backward compatibility
export const ComplaintNotifications = NotificationService 