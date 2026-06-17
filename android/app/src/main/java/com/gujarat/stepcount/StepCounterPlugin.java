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
    private boolean isTracking = false;

    // Step tracking state
    private float totalStepsSinceReboot = 0;
    private float baselineSteps = -1;     // steps at midnight / first reading
    private int todaySteps = 0;
    private String lastDate = "";

    private static final String PREFS_NAME = "StepCounterPrefs";
    private static final String KEY_BASELINE = "baseline_steps";
    private static final String KEY_DATE = "baseline_date";
    private static final String KEY_TODAY_STEPS = "today_steps";

    @Override
    public void load() {
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        restoreState();
    }

    /**
     * Start tracking steps from the hardware sensor
     */
    @PluginMethod()
    public void startTracking(PluginCall call) {
        if (stepSensor == null) {
            call.reject("Step counter sensor not available on this device");
            return;
        }

        if (!isTracking) {
            sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_UI);
            isTracking = true;
        }

        JSObject ret = new JSObject();
        ret.put("started", true);
        ret.put("hasSensor", true);
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
        ret.put("hasSensor", stepSensor != null);
        ret.put("isTracking", isTracking);
        ret.put("date", getTodayDate());
        call.resolve(ret);
    }

    /**
     * Check if hardware step sensor is available
     */
    @PluginMethod()
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", stepSensor != null);
        call.resolve(ret);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            totalStepsSinceReboot = event.values[0];
            String today = getTodayDate();

            // New day detected — reset baseline
            if (!today.equals(lastDate)) {
                baselineSteps = totalStepsSinceReboot;
                lastDate = today;
                todaySteps = 0;
            }

            // First reading ever — set baseline
            if (baselineSteps < 0) {
                baselineSteps = totalStepsSinceReboot;
                lastDate = today;
            }

            // Calculate today's steps
            todaySteps = Math.max(0, (int)(totalStepsSinceReboot - baselineSteps));
            saveState();

            // Notify JavaScript listeners
            JSObject data = new JSObject();
            data.put("steps", todaySteps);
            data.put("date", today);
            notifyListeners("stepUpdate", data);
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Not used
    }

    private String getTodayDate() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
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
            // New day — will set baseline on first sensor reading
            baselineSteps = -1;
            lastDate = today;
            todaySteps = 0;
        }
    }
}
