package com.gujarat.stepcount;

import android.content.Context;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@CapacitorPlugin(name = "StepCounter")
public class StepCounterPlugin extends Plugin implements SensorEventListener {

    private SensorManager sensorManager;
    private Sensor stepSensor;
    private Sensor accelerometerSensor;
    private boolean isTracking = false;
    private boolean isAccelerometerFallback = false;

    // Step tracking state
    private float totalStepsSinceReboot = 0;
    private float baselineSteps = -1;     // steps at midnight / first reading
    private int todaySteps = 0;
    private String lastDate = "";

    // Accelerometer algorithm parameters (MotionMate style peak-detection fallback)
    private static final float STEP_THRESHOLD = 11.8f;  // Acceleration magnitude threshold (approx 1.2g)
    private static final int DEBOUNCE_MS = 330;         // Debounce time in ms to avoid double-counting
    private long lastStepTimeNs = 0;

    private static final String PREFS_NAME = "StepCounterPrefs";
    private static final String KEY_BASELINE = "baseline_steps";
    private static final String KEY_DATE = "baseline_date";
    private static final String KEY_TODAY_STEPS = "today_steps";

    @Override
    public void load() {
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        
        if (stepSensor == null) {
            // Fall back to accelerometer sensor if step counter sensor is missing
            accelerometerSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            isAccelerometerFallback = true;
        }
        
        restoreState();
    }

    /**
     * Start tracking steps from the hardware sensor or accelerometer fallback
     */
    @PluginMethod()
    public void startTracking(PluginCall call) {
        Sensor activeSensor = isAccelerometerFallback ? accelerometerSensor : stepSensor;
        
        if (activeSensor == null) {
            call.reject("Neither Step Counter nor Accelerometer sensor is available on this device");
            return;
        }

        if (!isTracking) {
            sensorManager.registerListener(this, activeSensor, SensorManager.SENSOR_DELAY_UI);
            isTracking = true;
        }

        JSObject ret = new JSObject();
        ret.put("started", true);
        ret.put("hasSensor", !isAccelerometerFallback);
        ret.put("isAccelerometerFallback", isAccelerometerFallback);
        call.resolve(ret);
    }

    /**
     * Stop tracking steps
     */
    @PluginMethod()
    public void stopTracking(PluginCall call) {
        if (isTracking) {
            sensorManager.unregisterListener(this);
            isTracking = false;
        }
        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
    }

    /**
     * Get the current step count for today
     */
    @PluginMethod()
    public void getStepCount(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("steps", todaySteps);
        ret.put("hasSensor", !isAccelerometerFallback && stepSensor != null);
        ret.put("isAccelerometerFallback", isAccelerometerFallback);
        ret.put("isTracking", isTracking);
        ret.put("date", getTodayDate());
        call.resolve(ret);
    }

    /**
     * Check if hardware step sensor is available (or if we have accelerometer fallback)
     */
    @PluginMethod()
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        // Available if either hardware step counter or accelerometer fallback is present
        ret.put("available", stepSensor != null || accelerometerSensor != null);
        ret.put("isAccelerometerFallback", isAccelerometerFallback);
        call.resolve(ret);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        String today = getTodayDate();

        // Check if date changed (midnight transition)
        if (!today.equals(lastDate)) {
            if (!isAccelerometerFallback) {
                baselineSteps = totalStepsSinceReboot;
            }
            lastDate = today;
            todaySteps = 0;
            saveState();
        }

        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            totalStepsSinceReboot = event.values[0];

            // First reading ever — set baseline
            if (baselineSteps < 0) {
                baselineSteps = totalStepsSinceReboot;
                lastDate = today;
            }

            // Calculate today's steps
            todaySteps = Math.max(0, (int)(totalStepsSinceReboot - baselineSteps));
            saveState();

            // Notify listeners
            sendStepUpdate(todaySteps, today);

        } else if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            // Read x, y, z values
            float x = event.values[0];
            float y = event.values[1];
            float z = event.values[2];

            // Calculate total acceleration magnitude (vector length)
            float magnitude = (float) Math.sqrt(x * x + y * y + z * z);
            long currentTimeNs = event.timestamp;

            // Simple peak detection: magnitude exceeds the threshold
            if (magnitude > STEP_THRESHOLD) {
                // Convert nanoseconds to milliseconds to check the debounce window
                long timeDiffMs = (currentTimeNs - lastStepTimeNs) / 1000000;
                
                if (timeDiffMs > DEBOUNCE_MS) {
                    todaySteps++;
                    lastStepTimeNs = currentTimeNs;
                    saveState();
                    sendStepUpdate(todaySteps, today);
                }
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Not used
    }

    private String getTodayDate() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }

    private void sendStepUpdate(int steps, String date) {
        JSObject data = new JSObject();
        data.put("steps", steps);
        data.put("date", date);
        notifyListeners("stepUpdate", data);
    }

    private void saveState() {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putFloat(KEY_BASELINE, baselineSteps)
            .putString(KEY_DATE, lastDate)
            .putInt(KEY_TODAY_STEPS, todaySteps)
            .apply();
    }

    private void restoreState() {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String savedDate = prefs.getString(KEY_DATE, "");
        String today = getTodayDate();

        if (today.equals(savedDate)) {
            baselineSteps = prefs.getFloat(KEY_BASELINE, -1);
            lastDate = savedDate;
            todaySteps = prefs.getInt(KEY_TODAY_STEPS, 0);
        } else {
            // New day — reset values
            baselineSteps = -1;
            lastDate = today;
            todaySteps = 0;
            saveState();
        }
    }
}
