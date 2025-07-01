package com.saratchandraacademy.hostelmanagement;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;

import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.annotation.NonNull;

@CapacitorPlugin(name = "FCMTokenManager")
public class MainActivity extends BridgeActivity {
    
    private static final String TAG = "MainActivity";
    private static final int REQUEST_NOTIFICATION_PERMISSION = 1001;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Request notification permission for Android 13+
        requestNotificationPermission();
        
        // Get FCM token
        getFCMToken();
        
        // Register the FCM plugin
        registerPlugin(FCMTokenManagerPlugin.class);
    }
    
    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, 
                    android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                    new String[]{android.Manifest.permission.POST_NOTIFICATIONS},
                    REQUEST_NOTIFICATION_PERMISSION);
            }
        }
    }
    
    private void getFCMToken() {
        FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(new OnCompleteListener<String>() {
                @Override
                public void onComplete(@NonNull Task<String> task) {
                    if (!task.isSuccessful()) {
                        Log.w(TAG, "Fetching FCM registration token failed", task.getException());
                        return;
                    }

                    // Get new FCM registration token
                    String token = task.getResult();
                    Log.d(TAG, "FCM Registration Token: " + token);
                }
            });
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, 
                                         @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == REQUEST_NOTIFICATION_PERMISSION) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "Notification permission granted");
                Toast.makeText(this, "Notification permission granted", Toast.LENGTH_SHORT).show();
            } else {
                Log.w(TAG, "Notification permission denied");
                Toast.makeText(this, "Notification permission required for alerts", Toast.LENGTH_LONG).show();
            }
        }
    }
    
    @CapacitorPlugin(name = "FCMTokenManager")
    public static class FCMTokenManagerPlugin extends Plugin {
        
        @PluginMethod
        public void getToken(PluginCall call) {
            FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(new OnCompleteListener<String>() {
                    @Override
                    public void onComplete(@NonNull Task<String> task) {
                        if (!task.isSuccessful()) {
                            call.reject("Failed to get FCM token", task.getException());
                            return;
                        }
                        
                        String token = task.getResult();
                        call.resolve(new com.getcapacitor.JSObject().put("token", token));
                    }
                });
        }
        
        @PluginMethod
        public void subscribeToTopic(PluginCall call) {
            String topic = call.getString("topic");
            if (topic == null) {
                call.reject("Topic is required");
                return;
            }
            
            FirebaseMessaging.getInstance().subscribeToTopic(topic)
                .addOnCompleteListener(new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {
                        if (!task.isSuccessful()) {
                            call.reject("Failed to subscribe to topic", task.getException());
                            return;
                        }
                        
                        Log.d("FCM", "Subscribed to topic: " + topic);
                        call.resolve();
                    }
                });
        }
        
        @PluginMethod
        public void unsubscribeFromTopic(PluginCall call) {
            String topic = call.getString("topic");
            if (topic == null) {
                call.reject("Topic is required");
                return;
            }
            
            FirebaseMessaging.getInstance().unsubscribeFromTopic(topic)
                .addOnCompleteListener(new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {
                        if (!task.isSuccessful()) {
                            call.reject("Failed to unsubscribe from topic", task.getException());
                            return;
                        }
                        
                        Log.d("FCM", "Unsubscribed from topic: " + topic);
                        call.resolve();
                    }
                });
        }
    }
} 