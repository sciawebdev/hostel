import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

// Firebase configuration - From your Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCsaDCtwUNEsxrjG-7ugrXx36rGT12F5GY",
  authDomain: "sca-hostel-management-2219e.firebaseapp.com",
  projectId: "sca-hostel-management-2219e",
  storageBucket: "sca-hostel-management-2219e.firebasestorage.app",
  messagingSenderId: "43227706036",
  appId: "1:43227706036:android:06904f5eeb32fdb618dde1"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize messaging for web
let messaging: any = null
if (!Capacitor.isNativePlatform()) {
  messaging = getMessaging(app)
}

// Push notification setup for mobile
export async function initializePushNotifications() {
  if (Capacitor.isNativePlatform()) {
    // Request permission for push notifications
    const result = await PushNotifications.requestPermissions()
    
    if (result.receive === 'granted') {
      // Register for push notifications
      await PushNotifications.register()
      
      // Get FCM token for this device
      PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success, token: ' + token.value)
        // Store this token in your database for sending targeted notifications
        await storeDeviceToken(token.value)
      })
      
      // Handle incoming notifications
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received: ', notification)
        // Handle notification when app is in foreground
        showNotificationAlert(notification)
      })
      
      // Handle notification tap
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed', notification)
        // Navigate to specific screen based on notification data
        handleNotificationTap(notification)
      })
    }
  } else {
    // Web push notifications
    if (messaging) {
      try {
        const token = await getToken(messaging, {
          vapidKey: 'your-vapid-key-here' // You'll get this from Firebase Console
        })
        console.log('FCM Token:', token)
        await storeDeviceToken(token)
        
        // Handle foreground messages
        onMessage(messaging, (payload) => {
          console.log('Message received. ', payload)
          showNotificationAlert(payload)
        })
      } catch (err) {
        console.log('An error occurred while retrieving token. ', err)
      }
    }
  }
}

// Store device token for sending notifications
async function storeDeviceToken(token: string) {
  try {
    // Store token in your Supabase database
    // You can create a 'device_tokens' table to store user_id and token
    console.log('Device token:', token)
    // TODO: Implement API call to store token
  } catch (error) {
    console.error('Error storing device token:', error)
  }
}

// Show notification alert when app is in foreground
function showNotificationAlert(notification: any) {
  const title = notification.title || notification.notification?.title
  const body = notification.body || notification.notification?.body
  
  // You can use a toast library or custom modal here
  alert(`${title}: ${body}`)
}

// Handle notification tap to navigate to specific screen
function handleNotificationTap(notification: any) {
  const data = notification.notification?.data || notification.data
  
  if (data?.complaint_id) {
    // Navigate to complaint details
    window.location.href = `/complaint/${data.complaint_id}`
  }
}

// Function to subscribe to notification topics
export async function subscribeToNotificationTopic(topic: string) {
  if (Capacitor.isNativePlatform()) {
    // For native apps, you'll handle this server-side
    console.log(`Subscribing to topic: ${topic}`)
  }
}

// Notification templates for different scenarios
export const NOTIFICATION_TEMPLATES = {
  NEW_COMPLAINT: {
    title: "🆕 New Complaint Submitted",
    body: (complaint: any) => `${complaint.complaint_id}: ${complaint.category} in ${complaint.hostel?.name} Room ${complaint.room?.room_number}`,
    data: (complaint: any) => ({
      type: 'new_complaint',
      complaint_id: complaint.complaint_id,
      action: 'OPEN_COMPLAINT_DETAILS'
    })
  },
  
  COMPLAINT_ASSIGNED: {
    title: "📋 Complaint Assigned to You",
    body: (complaint: any) => `${complaint.complaint_id}: ${complaint.category} requires your attention`,
    data: (complaint: any) => ({
      type: 'assignment',
      complaint_id: complaint.complaint_id,
      action: 'OPEN_COMPLAINT_DETAILS'
    })
  },
  
  WORK_COMPLETED: {
    title: "✅ Work Completed",
    body: (complaint: any) => `${complaint.complaint_id}: Work completed, verification needed`,
    data: (complaint: any) => ({
      type: 'work_completed',
      complaint_id: complaint.complaint_id,
      action: 'OPEN_VERIFICATION'
    })
  },
  
  STATUS_UPDATE: {
    title: "📊 Status Updated",
    body: (complaint: any, status: string) => `${complaint.complaint_id}: Status changed to ${status}`,
    data: (complaint: any) => ({
      type: 'status_update',
      complaint_id: complaint.complaint_id,
      action: 'OPEN_COMPLAINT_DETAILS'
    })
  }
}

export default app 