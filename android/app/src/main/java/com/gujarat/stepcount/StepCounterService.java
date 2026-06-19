package com.gujarat.stepcount;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class StepCounterService extends Service implements SensorEventListener {
    private static final String TAG = "StepCounterService";
    private static final String CHANNEL_ID = "StepCounterServiceChannel";
    private static final int NOTIFICATION_ID = 1001;

    private SensorManager sensorManager;
    private Sensor stepSensor;
    private Sensor accelerometerSensor;
    private boolean isAccelerometerFallback = false;

    // Step tracking state
    private float totalStepsSinceReboot = 0;
    private float baselineSteps = -1;
    private int todaySteps = 0;
    private String lastDate = "";

    // Accelerometer variables
    private static final float STEP_THRESHOLD = 11.2f;
    private static final int DEBOUNCE_MS = 330;
    private long lastStepTimeNs = 0;

    private static final String PREFS_NAME = "StepCounterPrefs";
    private static final String KEY_BASELINE = "baseline_steps";
    private static final String KEY_DATE = "baseline_date";
    private static final String KEY_TODAY_STEPS = "today_steps";
    private static final String KEY_TRACKING_ENABLED = "is_tracking_enabled";

    public static final String ACTION_STEP_UPDATE = "com.gujarat.stepcount.STEP_UPDATE";
    public static final String EXTRA_STEPS = "steps";
    public static final String EXTRA_DATE = "date";

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "StepCounterService onCreate");
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        
        if (stepSensor == null) {
            accelerometerSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            isAccelerometerFallback = true;
            Log.d(TAG, "Hardware step counter not found. Falling back to Accelerometer.");
        }
        
        restoreState();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "StepCounterService onStartCommand");
        
        // Start as foreground service with notification
        Notification notification = buildNotification(todaySteps);
        startForeground(NOTIFICATION_ID, notification);

        registerSensor();

        // Keep running until explicitly stopped
        return START_STICKY;
    }

    private void registerSensor() {
        Sensor activeSensor = isAccelerometerFallback ? accelerometerSensor : stepSensor;
        if (activeSensor != null) {
            sensorManager.registerListener(this, activeSensor, SensorManager.SENSOR_DELAY_NORMAL);
            Log.d(TAG, "Sensor listener registered: " + activeSensor.getName());
        } else {
            Log.e(TAG, "No sensor available to register!");
        }
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        String today = getTodayDate();

        // Check if date changed (midnight transition)
        if (!today.equals(lastDate)) {
            Log.d(TAG, "Date changed from " + lastDate + " to " + today + ". Resetting steps baseline.");
            if (!isAccelerometerFallback) {
                baselineSteps = totalStepsSinceReboot;
            }
            lastDate = today;
            todaySteps = 0;
            saveState();
        }

        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            totalStepsSinceReboot = event.values[0];

            if (baselineSteps < 0) {
                baselineSteps = totalStepsSinceReboot;
                lastDate = today;
                Log.d(TAG, "First step sensor reading, baseline set: " + baselineSteps);
            }

            todaySteps = Math.max(0, (int) (totalStepsSinceReboot - baselineSteps));
            saveState();
            sendStepBroadcast(todaySteps, today);
            updateNotification(todaySteps);

        } else if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            float x = event.values[0];
            float y = event.values[1];
            float z = event.values[2];

            float magnitude = (float) Math.sqrt(x * x + y * y + z * z);
            long currentTimeNs = event.timestamp;

            if (magnitude > STEP_THRESHOLD) {
                long timeDiffMs = (currentTimeNs - lastStepTimeNs) / 1000000;
                if (timeDiffMs > DEBOUNCE_MS) {
                    todaySteps++;
                    lastStepTimeNs = currentTimeNs;
                    saveState();
                    sendStepBroadcast(todaySteps, today);
                    updateNotification(todaySteps);
                }
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
    }

    private void sendStepBroadcast(int steps, String date) {
        Intent intent = new Intent(ACTION_STEP_UPDATE);
        intent.putExtra(EXTRA_STEPS, steps);
        intent.putExtra(EXTRA_DATE, date);
        // Ensure broadcast is local by packaging it to our application package
        intent.setPackage(getPackageName());
        sendBroadcast(intent);
    }

    private void updateNotification(int steps) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, buildNotification(steps));
        }
    }

    private Notification buildNotification(int steps) {
        // Intent to open MainActivity when clicking notification
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            0, 
            notificationIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        String stepsStr = String.format(Locale.US, "%,d", steps);
        String title = "Fit Gujarat";
        String text = "Today's steps: " + stepsStr;

        // Use custom drawable if available, otherwise fallback to standard compass/info drawable
        int iconId = android.R.drawable.ic_menu_compass;

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(text)
                .setSmallIcon(iconId)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Step Counter Service Channel",
                    NotificationManager.IMPORTANCE_LOW
            );
            serviceChannel.setDescription("Keeps step counting running continuously in background");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }

    private String getTodayDate() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }

    private void saveState() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .putFloat(KEY_BASELINE, baselineSteps)
                .putString(KEY_DATE, lastDate)
                .putInt(KEY_TODAY_STEPS, todaySteps)
                .apply();
    }

    private void restoreState() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String savedDate = prefs.getString(KEY_DATE, "");
        String today = getTodayDate();

        if (today.equals(savedDate)) {
            baselineSteps = prefs.getFloat(KEY_BASELINE, -1);
            lastDate = savedDate;
            todaySteps = prefs.getInt(KEY_TODAY_STEPS, 0);
        } else {
            baselineSteps = -1;
            lastDate = today;
            todaySteps = 0;
            saveState();
        }
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "StepCounterService onDestroy");
        sensorManager.unregisterListener(this);
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
