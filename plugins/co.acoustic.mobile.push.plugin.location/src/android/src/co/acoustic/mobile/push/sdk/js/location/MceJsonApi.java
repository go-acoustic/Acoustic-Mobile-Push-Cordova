/*
 * Copyright © 2011, 2019 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

package co.acoustic.mobile.push.sdk.js.location;

import co.acoustic.mobile.push.sdk.location.LocationRetrieveService;
import co.acoustic.mobile.push.sdk.js.JsonCallback;
import co.acoustic.mobile.push.sdk.util.Logger;
import co.acoustic.mobile.push.sdk.location.LocationManager;

import androidx.core.content.ContextCompat;
import androidx.core.app.ActivityCompat;

import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.app.Activity;
import android.Manifest;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.concurrent.Executor;


public class MceJsonApi {
    public static boolean running;

   private static final String TAG = "MceJsonApi";

    public static boolean execute(String action, JSONArray parameters, final Activity activity, JsonCallback callback) throws JSONException {
        Context context = activity.getApplicationContext();
        Logger.d(TAG, "will execute action: " + action);
        try {
            if (Methods.SyncLocations.NAME.equals(action)) {
                syncLocations(context, callback);
            } else if (Methods.SetLocationUpdatedCallback.NAME.equals(action)) {
                setLocationUpdatedCallback(context, callback, parameters);
            } else if (Methods.ManualLocationInitialization.NAME.equals(action)) {
                manualLocationInitialization(activity, context);
            } else if (Methods.SetLocationAuthorizationCallback.NAME.equals(action)) {
                setLocationAuthorizationCallback(context, callback);
            } else if (Methods.LocationAuthorization.NAME.equals(action)) {
                locationAuthorization(activity, context, callback);
            } else {
                return false;
            }
            return true;
        } catch (JSONException jsone) {
            Logger.e(TAG, "JSON ERROR", jsone);
            throw jsone;
        }
    }

    public static void initialize(final Activity activity) {
        Logger.v(TAG, "initialize");
        
        Context context = activity.getApplicationContext(); 

        if(autoInitializeLocation(context) || locationInitialized(context))
            manualLocationInitialization(activity, context); 
    }

    public static void manualLocationInitialization(final Activity activity, final Context context)
    {
        Logger.v(TAG, "manualLocationInitialization");
        setLocationInitialized(context, true);
        
        activity.runOnUiThread(new Runnable() {
            public void run() {
                if (ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(activity, new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.BLUETOOTH, Manifest.permission.BLUETOOTH_ADMIN}, 0);
                } else {
                    LocationManager.enableLocationSupport(context);
                    JsonMceBroadcastReceiver.onLocationAuthorization(context);
                }
            }
        });

    }

    public static boolean locationInitialized(final Context context)
    {
        SharedPreferences prefs = context.getSharedPreferences("MCE", Context.MODE_PRIVATE);
        boolean status = prefs.getBoolean("locationInitialized", false);
        if(status)
            Logger.v(TAG, "locationInitialized = true");
        else
            Logger.v(TAG, "locationInitialized = false");
        return status;
    }

    public static void setLocationInitialized(final Context context, boolean status)
    {
        if(status)
            Logger.v(TAG, "setLocationInitialized = true");
        else
            Logger.v(TAG, "setLocationInitialized = false");
        SharedPreferences prefs = context.getSharedPreferences("MCE", Context.MODE_PRIVATE);
        SharedPreferences.Editor prefEditor = prefs.edit();
        prefEditor.putBoolean("locationInitialized", status);
        prefEditor.commit();
    }

    private static boolean autoInitializeLocation(final Context context)
    {
        try {
            ApplicationInfo ai = context.getPackageManager().getApplicationInfo(context.getPackageName(), PackageManager.GET_META_DATA);
            Bundle bundle = ai.metaData;
            boolean status = bundle.getBoolean("autoInitializeLocation", true);

            if(status)
                Logger.v(TAG, "autoInitializeLocation = true");
            else
                Logger.v(TAG, "autoInitializeLocation = false");

            return status;
        } catch (PackageManager.NameNotFoundException e) {
            Logger.e(TAG, "Unable to load meta-data: " + e.getMessage());
        }
        return true;
    }

    public static void syncLocations(final Context context, JsonCallback callback) throws JSONException 
    {
        LocationRetrieveService.startLocationUpdates(context, false);
    }
    
    public static void setLocationAuthorizationCallback(final Context context, JsonCallback callback) throws JSONException {
        Logger.d(TAG, "Callbacks Registration: Location Auth registration");
        JsonMceBroadcastReceiver.setLocationAuthorizationCallback(context, callback);
    }

    public static void locationAuthorization(final Activity activity, Context context, JsonCallback callback) throws JSONException {
        if(locationInitialized(context))
        {
            int access = ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_FINE_LOCATION);
            if(access == PackageManager.PERMISSION_GRANTED)
            {
                callbackSuccess(callback, 1);
            }
            else
            {
                callbackSuccess(callback, -1);
            }
        }
        else
        {
            callbackSuccess(callback, 0);
        }
    }

    public static void setLocationUpdatedCallback(final Context context, JsonCallback callback, JSONArray parameters) throws JSONException {
        boolean state = parameters.getBoolean(Methods.SetLocationUpdatedCallback.STATE_INDEX);
        Logger.d(TAG, "Callbacks Registration: Location Update registration - " + state);
        if(state) {
            JsonMceBroadcastReceiver.setLocationUpdatedCallback(context, callback);
        } else {
            JsonMceBroadcastReceiver.setLocationUpdatedCallback(context, null);
        }
    }

    public static interface Methods {
        
        public static interface LocationAuthorization {
            public static final String NAME = "locationAuthorization";
        }
        public static interface SetLocationAuthorizationCallback {
            public static final String NAME = "setLocationAuthorizationCallback";
        }
        public static interface ManualLocationInitialization {
            public static final String NAME = "manualLocationInitialization";
        }
        public static interface SetLocationUpdatedCallback {
            public static final String NAME = "setLocationUpdatedCallback";
            public static final int STATE_INDEX = 0;
        }

        public static interface SyncLocations {
            public static final String NAME = "syncLocations";
        }

    }

    private static void callbackSuccess(JsonCallback callback) {
        if(callback != null) {
            callback.success(true);
        }
    }

    private static void callbackSuccess(JsonCallback callback, JSONObject response) {
        if(callback != null) {
            callback.success(response, true);
        }
    }

    private static void callbackSuccess(JsonCallback callback, boolean response) {
        if(callback != null) {
            callback.success(response, true);
        }
    }

    private static void callbackSuccess(JsonCallback callback, int response) {
        if(callback != null) {
            callback.success(response, true);
        }
    }

    private static void callbackSuccess(JsonCallback callback, JSONArray response) {
        if(callback != null) {
            callback.success(response, true);
        }
    }

    private static void callbackFailure(JsonCallback callback, String errorMessage) {
        if(callback != null) {
            callback.failure(errorMessage, true);
        }
    }
}
