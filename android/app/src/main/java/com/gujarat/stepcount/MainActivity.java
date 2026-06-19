package com.gujarat.stepcount;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.startapp.sdk.adsbase.StartAppSDK;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(StepCounterPlugin.class);
        registerPlugin(StartIoPlugin.class);
        super.onCreate(savedInstanceState);

        // Initialize Start.io SDK with App ID
        StartAppSDK.init(this, "205516036", true);
    }
}
