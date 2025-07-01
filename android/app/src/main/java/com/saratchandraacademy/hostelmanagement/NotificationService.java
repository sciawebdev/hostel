package com.saratchandraacademy.hostelmanagement;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;

public class NotificationService extends FirebaseMessagingService {
    
    private static final String TAG = "NotificationService";
    private static final String CHANNEL_ID = "hostel_notifications";
    private static final String TOKEN_PREFS = "fcm_token_prefs";
    private static final String TOKEN_KEY = "fcm_token";
    
    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }
    
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        
        Log.d(TAG, "From: " + remoteMessage.getFrom());
        
        // Extract notification data
        String title = "Hostel Management";
        String body = "New notification";
        
        if (remoteMessage.getNotification() != null) {
            title = remoteMessage.getNotification().getTitle();
            body = remoteMessage.getNotification().getBody();
            Log.d(TAG, "Message Notification Body: " + body);
        }
        
        // Check if message contains a data payload
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "Message data payload: " + remoteMessage.getData());
            
            // Override title/body from data if available
            if (remoteMessage.getData().containsKey("title")) {
                title = remoteMessage.getData().get("title");
            }
            if (remoteMessage.getData().containsKey("body")) {
                body = remoteMessage.getData().get("body");
            }
        }
        
        // Create notification
        showNotification(title, body, remoteMessage.getData());
    }
    
    /**
     * Called if the FCM registration token is updated. This may occur if the security of
     * the previous token had been compromised. Note that this is called when the
     * FCM registration token is initially generated so this is where you would retrieve the token.
     */
    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        Log.d(TAG, "Refreshed token: " + token);
        
        // Save token locally
        saveTokenLocally(token);
        
        // Send token to your server
        sendTokenToServer(token);
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Hostel Notifications";
            String description = "Notifications for hostel complaint management";
            int importance = NotificationManager.IMPORTANCE_HIGH;
            
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            channel.enableVibration(true);
            channel.setShowBadge(true);
            channel.enableLights(true);
            channel.setLightColor(android.graphics.Color.BLUE);
            
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }
    
    private void showNotification(String title, String body, java.util.Map<String, String> data) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        
        // Add data to intent for handling notification tap
        if (data != null) {
            for (java.util.Map.Entry<String, String> entry : data.entrySet()) {
                intent.putExtra(entry.getKey(), entry.getValue());
            }
        }
        
        int requestCode = (int) System.currentTimeMillis(); // Unique request code
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            requestCode, 
            intent, 
            PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
        );
        
        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setSound(android.provider.Settings.System.DEFAULT_NOTIFICATION_URI)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);
        
        // Add action buttons if data contains action info
        if (data != null && data.containsKey("action_type")) {
            String actionType = data.get("action_type");
            if ("complaint".equals(actionType)) {
                // Add "View Complaint" action
                Intent viewIntent = new Intent(this, MainActivity.class);
                viewIntent.putExtra("open_complaint", data.get("complaint_id"));
                PendingIntent viewPendingIntent = PendingIntent.getActivity(
                    this, requestCode + 1, viewIntent, PendingIntent.FLAG_IMMUTABLE);
                
                notificationBuilder.addAction(R.drawable.ic_launcher_foreground, 
                    "View Complaint", viewPendingIntent);
            }
        }
        
        NotificationManager notificationManager = 
            (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        
        if (notificationManager != null) {
            notificationManager.notify(requestCode, notificationBuilder.build());
        }
    }
    
    private void saveTokenLocally(String token) {
        SharedPreferences prefs = getSharedPreferences(TOKEN_PREFS, MODE_PRIVATE);
        prefs.edit().putString(TOKEN_KEY, token).apply();
    }
    
    private void sendTokenToServer(String token) {
        // TODO: Implement actual server communication
        // For now, just log the token
        Log.d(TAG, "FCM Token to send to server: " + token);
        
        // In a real implementation, you would:
        // 1. Make HTTP request to your backend
        // 2. Send token along with user ID
        // 3. Store in Supabase user_fcm_tokens table
        
        // Example pseudo-code:
        // HTTPClient.post("your-backend/api/fcm-token", {
        //     token: token,
        //     userId: getCurrentUserId(),
        //     deviceInfo: getDeviceInfo()
        // });
    }
} 