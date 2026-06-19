package com.gujarat.stepcount;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorManager;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@CapacitorPlugin(
    name = "StepCounter",
    permissions = {
        @Permission(
            alias = "activityRecognition",
            strings = { android.Manifest.permission.ACTIVITY_RECOGNITION }
        )
    }
)
public class StepCounterPlugin extends Plugin {
    private static final String TAG = "StepCounterPlugin";

    private boolean isTracking = false;
    private boolean isAccelerometerFallback = false;
    private SensorManager sensorManager;
    private Sensor stepSensor;
    private Sensor accelerometerSensor;

    // Step tracking state cached in plugin
    private int todaySteps = 0;
    private String lastDate = "";

    private static final String PREFS_NAME = "StepCounterPrefs";
    private static final String KEY_DATE = "baseline_date";
    private static final String KEY_TODAY_STEPS = "today_steps";
    private static final String KEY_TRACKING_ENABLED = "is_tracking_enabled";

    private final BroadcastReceiver stepReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (StepCounterService.ACTION_STEP_UPDATE.equals(intent.getAction())) {
                int steps = intent.getIntExtra(StepCounterService.EXTRA_STEPS, 0);
                String date = intent.getStringExtra(StepCounterService.EXTRA_DATE);
                todaySteps = steps;
                lastDate = date;
                Log.d(TAG, "Broadcast received: " + steps + " steps on date " + date);
                sendStepUpdate(steps, date);
            }
        }
    };

    @Override
    public void load() {
        super.load();
        Log.d(TAG, "StepCounterPlugin load");
        
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (stepSensor == null) {
            accelerometerSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            isAccelerometerFallback = true;
        }

        restoreState();

        // Register receiver for background service updates
        IntentFilter filter = new IntentFilter(StepCounterService.ACTION_STEP_UPDATE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(stepReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(stepReceiver, filter);
        }

        // If tracking should be active, start/ensure service is running
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean isEnabled = prefs.getBoolean(KEY_TRACKING_ENABLED, false);
        if (isEnabled) {
            Log.d(TAG, "Tracking was enabled, ensuring StepCounterService is running.");
            startService();
            isTracking = true;
        }
    }

    private void startService() {
        Context context = getContext();
        Intent serviceIntent = new Intent(context, StepCounterService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
        
        // Save state so receiver knows to start it on boot
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(KEY_TRACKING_ENABLED, true).apply();
    }

    private void stopService() {
        Context context = getContext();
        Intent serviceIntent = new Intent(context, StepCounterService.class);
        context.stopService(serviceIntent);

        // Save state
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(KEY_TRACKING_ENABLED, false).apply();
    }

    @PluginMethod()
    public void startTracking(PluginCall call) {
        Log.d(TAG, "startTracking command received.");
        if (!isTracking) {
            startService();
            isTracking = true;
        }

        JSObject ret = new JSObject();
        ret.put("started", true);
        ret.put("hasSensor", !isAccelerometerFallback && stepSensor != null);
        ret.put("isAccelerometerFallback", isAccelerometerFallback);
        call.resolve(ret);
    }

    @PluginMethod()
    public void stopTracking(PluginCall call) {
        Log.d(TAG, "stopTracking command received.");
        if (isTracking) {
            stopService();
            isTracking = false;
        }
        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
    }

    @PluginMethod()
    public void getStepCount(PluginCall call) {
        // Read fresh count from SharedPreferences in case service updated it in background
        restoreState();

        JSObject ret = new JSObject();
        ret.put("steps", todaySteps);
        ret.put("hasSensor", !isAccelerometerFallback && stepSensor != null);
        ret.put("isAccelerometerFallback", isAccelerometerFallback);
        ret.put("isTracking", isTracking);
        ret.put("date", lastDate);
        call.resolve(ret);
    }

    @PluginMethod()
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", stepSensor != null || accelerometerSensor != null);
        ret.put("isAccelerometerFallback", isAccelerometerFallback);
        call.resolve(ret);
    }

    private void sendStepUpdate(int steps, String date) {
        JSObject data = new JSObject();
        data.put("steps", steps);
        data.put("date", date);
        notifyListeners("stepUpdate", data);
    }

    private void restoreState() {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String savedDate = prefs.getString(KEY_DATE, "");
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());

        if (today.equals(savedDate)) {
            lastDate = savedDate;
            todaySteps = prefs.getInt(KEY_TODAY_STEPS, 0);
        } else {
            lastDate = today;
            todaySteps = 0;
        }
    }

    @Override
    protected void handleOnDestroy() {
        try {
            getContext().unregisterReceiver(stepReceiver);
            Log.d(TAG, "Unregistered stepReceiver broadcast receiver.");
        } catch (Exception e) {
            Log.w(TAG, "Error unregistering receiver: " + e.getMessage());
        }
        super.handleOnDestroy();
    }
}
