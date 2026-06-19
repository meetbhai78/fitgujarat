package com.gujarat.stepcount;

import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.startapp.sdk.adsbase.Ad;
import com.startapp.sdk.adsbase.StartAppAd;
import com.startapp.sdk.adsbase.adlisteners.AdEventListener;

@CapacitorPlugin(name = "StartIo")
public class StartIoPlugin extends Plugin {
    private static final String TAG = "StartIoPlugin";
    private StartAppAd startAppAd;

    @Override
    public void load() {
        super.load();
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    startAppAd = new StartAppAd(getActivity());
                    Log.d(TAG, "StartAppAd initialized successfully.");
                } catch (Exception e) {
                    Log.e(TAG, "Error initializing StartAppAd in UI thread: ", e);
                }
            }
        });
    }

    @PluginMethod
    public void showInterstitial(PluginCall call) {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (startAppAd == null) {
                        startAppAd = new StartAppAd(getActivity());
                    }
                    
                    Log.d(TAG, "Requesting Start.io Video ad...");
                    startAppAd.loadAd(StartAppAd.AdMode.VIDEO, new AdEventListener() {
                        @Override
                        public void onReceiveAd(Ad ad) {
                            Log.d(TAG, "Video ad received, showing ad...");
                            startAppAd.showAd();
                            JSObject ret = new JSObject();
                            ret.put("success", true);
                            call.resolve(ret);
                        }

                        @Override
                        public void onFailedToReceiveAd(Ad ad) {
                            Log.w(TAG, "Failed to load Video ad: " + ad.getErrorMessage() + ". Retrying with Automatic mode.");
                            
                            // Try Automatic fallback
                            startAppAd.loadAd(StartAppAd.AdMode.AUTOMATIC, new AdEventListener() {
                                @Override
                                public void onReceiveAd(Ad ad2) {
                                    Log.d(TAG, "Automatic ad received, showing ad...");
                                    startAppAd.showAd();
                                    JSObject ret = new JSObject();
                                    ret.put("success", true);
                                    call.resolve(ret);
                                }

                                @Override
                                public void onFailedToReceiveAd(Ad ad2) {
                                    Log.e(TAG, "Failed to load Automatic ad fallback: " + ad2.getErrorMessage());
                                    call.reject("Failed to load any ad: " + ad2.getErrorMessage());
                                }
                            });
                        }
                    });
                } catch (Exception e) {
                    Log.e(TAG, "Exception inside showInterstitial UI thread: ", e);
                    call.reject("Exception in native code: " + e.getMessage());
                }
            }
        });
    }
}
