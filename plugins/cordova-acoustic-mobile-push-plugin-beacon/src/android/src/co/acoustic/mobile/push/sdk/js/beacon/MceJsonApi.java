/*
 * Copyright © 2011, 2019 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

package co.acoustic.mobile.push.sdk.js.beacon;

import co.acoustic.mobile.push.sdk.location.LocationPreferences;
import co.acoustic.mobile.push.sdk.beacons.IBeacon;
import co.acoustic.mobile.push.sdk.location.LocationApi;
import co.acoustic.mobile.push.sdk.js.JsonCallback;
import android.content.Context;
import co.acoustic.mobile.push.sdk.util.Logger;
import co.acoustic.mobile.push.sdk.beacons.IBeaconsPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.Executor;

public class MceJsonApi {
    public static boolean running;
   private static final String TAG = "MceJsonApi";

    public static boolean execute(String action, JSONArray parameters, Context context, JsonCallback callback, Executor executor) throws JSONException {
        Logger.d(TAG, "will execute action: " + action);
        try {
            if (Methods.BeaconRegions.NAME.equals(action)) {
                beaconRegions(context, callback);
            } else if (Methods.SetBeaconEnterCallback.NAME.equals(action)) {
                setBeaconEnterCallback(context, callback, parameters);
            } else if (Methods.SetBeaconExitCallback.NAME.equals(action)) {
                setBeaconExitCallback(context, callback, parameters);
            } else if (Methods.BeaconEnabled.NAME.equals(action)) {
                beaconEnabled(context, callback);
            } else if (Methods.BeaconUUID.NAME.equals(action)) {
                beaconUUID(context, callback);
            } else {
                return false;
            }
            return true;
        } catch (JSONException jsone) {
            Logger.e(TAG, "JSON ERROR", jsone);
            throw jsone;
        }
    }
    
    public static void beaconRegions(Context context, JsonCallback callback) throws JSONException {
        JSONArray beaconList = new JSONArray();

        List<LocationApi> trackedIBeacons = new LinkedList<LocationApi>();
        try {
            trackedIBeacons = co.acoustic.mobile.push.sdk.location.LocationManager.getLocations(context, LocationPreferences.getCurrentLocationsState(context).getTrackedBeaconsIds());
            Logger.d(TAG,"Tracked iBeacons: "+trackedIBeacons);
        } catch (Exception e) {
            Logger.e(TAG, "Failed to get tracked beacons");
        }
        
        for(LocationApi location : trackedIBeacons)
        {
            IBeacon beaconLocation = (IBeacon)location;
            JSONObject beacon = new JSONObject();
            beacon.put("major", beaconLocation.getMajor());
            beaconList.put(beacon);
        }

        callbackSuccess(callback, beaconList);
    }
    
    public static void setBeaconEnterCallback(final Context context, JsonCallback callback, JSONArray parameters) throws JSONException {
        boolean state = parameters.getBoolean(Methods.SetBeaconEnterCallback.STATE_INDEX);

        Logger.d(TAG, "Callbacks Registration: Beacon Enter registration - " + state);
        if(state) {
            JsonMceBroadcastReceiver.setBeaconEnterCallback(context, callback);
        } else {
            JsonMceBroadcastReceiver.setBeaconEnterCallback(context, null);
        }
    }

    public static void setBeaconExitCallback(final Context context, JsonCallback callback, JSONArray parameters) throws JSONException {
        boolean state = parameters.getBoolean(Methods.SetBeaconExitCallback.STATE_INDEX);

        Logger.d(TAG, "Callbacks Registration: Beacon Exit registration - " + state);
        if(state) {
            JsonMceBroadcastReceiver.setBeaconExitCallback(context, callback);
        } else {
            JsonMceBroadcastReceiver.setBeaconExitCallback(context, null);
        }
    }

    public static void beaconEnabled(final Context context, JsonCallback callback) throws JSONException {
        callbackSuccess(callback, true);
    }

    public static void beaconUUID(final Context context, JsonCallback callback) throws JSONException {
        callbackSuccess(callback, IBeaconsPreferences.getBeaconsUUID(context) );
    }

    public static interface Methods {
        public static interface BeaconRegions {
            public static final String NAME = "beaconRegions";
        }
        public static interface SetBeaconEnterCallback {
            public static final String NAME = "setBeaconEnterCallback";
            public static final int STATE_INDEX = 0;
        }
        public static interface SetBeaconExitCallback {
            public static final String NAME = "setBeaconExitCallback";
            public static final int STATE_INDEX = 0;
        }
        public static interface BeaconEnabled {
            public static final String NAME = "beaconEnabled";
        }

        public static interface BeaconUUID {
            public static final String NAME = "beaconUUID";
        }
    }

    private static void callbackSuccess(JsonCallback callback) {
        if(callback != null) {
            callback.success(true);
        }
    }

    private static void callbackSuccess(JsonCallback callback, String response) {
        if(callback != null) {
            callback.success(response, true);
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
