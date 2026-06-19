package com.gujarat.stepcount;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";
    private static final String PREFS_NAME = "StepCounterPrefs";
    private static final String KEY_TRACKING_ENABLED = "is_tracking_enabled";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.d(TAG, "BootReceiver received action: " + action);

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || 
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            boolean isEnabled = prefs.getBoolean(KEY_TRACKING_ENABLED, false);
            
            Log.d(TAG, "BootReceiver checking if tracking was active: " + isEnabled);
            
            if (isEnabled) {
                Log.d(TAG, "Starting StepCounterService foreground service from boot");
                Intent serviceIntent = new Intent(context, StepCounterService.class);
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        context.startForegroundService(serviceIntent);
                    } else {
                        context.startService(serviceIntent);
                    }
                    Log.d(TAG, "StepCounterService start command issued successfully.");
                } catch (Exception e) {
                    Log.e(TAG, "Failed to start service on boot: ", e);
                }
            } else {
                Log.d(TAG, "Step tracking is disabled. No auto-start.");
            }
        }
    }
}
