/*
 * Copyright © 2011, 2019 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

package co.acoustic.mobile.push.sdk.js.geofence;

import co.acoustic.mobile.push.sdk.location.LocationManager;
import co.acoustic.mobile.push.sdk.location.LocationsDatabaseHelper;
import co.acoustic.mobile.push.sdk.location.MceLocation;
import co.acoustic.mobile.push.sdk.js.JsonCallback;
import android.content.Context;
import co.acoustic.mobile.push.sdk.util.Logger;
import android.location.Location;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.concurrent.Executor;

public class MceJsonApi {
    public static boolean running;

    private static final String TAG = "MceJsonApi";

    public static boolean execute(String action, JSONArray parameters, Context context, JsonCallback callback, Executor executor) throws JSONException {
        Logger.d(TAG, "will execute action: " + action);
        try {
            if (Methods.GeofencesNear.NAME.equals(action)) {
                geofencesNear(context, callback, parameters);
            } else if (Methods.SetGeofenceEnterCallback.NAME.equals(action)) {
                setGeofenceEnterCallback(context, callback, parameters);
            } else if (Methods.SetGeofenceExitCallback.NAME.equals(action)) {
                setGeofenceExitCallback(context, callback, parameters);
            } else if (Methods.GeofenceEnabled.NAME.equals(action)) {
                geofenceEnabled(context, callback);
            } else {
                return false;
            }
            return true;
        } catch (JSONException jsone) {
            Logger.e(TAG, "JSON ERROR", jsone);
            throw jsone;
        }
    }
    
    public static void geofencesNear(Context context, JsonCallback callback, JSONArray parameters) throws JSONException {
        double latitude = parameters.getDouble(Methods.GeofencesNear.LATITUDE_INDEX);
        double longitude = parameters.getDouble(Methods.GeofencesNear.LONGITUDE_INDEX);
        double radius = parameters.getDouble(Methods.GeofencesNear.RADIUS_INDEX);

        Location location = new Location("SDK");

        location.setLatitude(latitude);
        location.setLongitude(longitude);

        JSONArray geofenceList = new JSONArray();
        
        LocationManager.LocationsSearchResult relevantGeofences = LocationManager.getRelevantLocations(context, location);
		if(relevantGeofences == null) {
			callbackFailure(callback, "Locations not yet available");
			return;
		}
        LocationsDatabaseHelper.LocationCursor cursor = relevantGeofences.getSearchResults();
        if (cursor.getCount() > 0) {
            do {
                MceLocation geofence = cursor.getLocation();
                JSONObject geofenceJson = new JSONObject();
                geofenceJson.put("latitude", geofence.getLatitude());
                geofenceJson.put("longitude", geofence.getLongitude());
                geofenceJson.put("radius", geofence.getRadius());
                geofenceList.put( geofenceJson );
            } while (cursor.moveToNext());
        }

        callbackSuccess(callback, geofenceList);
    }
    
    public static void setGeofenceEnterCallback(final Context context, JsonCallback callback, JSONArray parameters) throws JSONException {
        boolean state = parameters.getBoolean(Methods.SetGeofenceEnterCallback.STATE_INDEX);
        Logger.d(TAG, "Callbacks Registration: Geofence Enter registration - " + state);
        if(state) {
            JsonMceBroadcastReceiver.setGeofenceEnterCallback(context, callback);
        } else {
            JsonMceBroadcastReceiver.setGeofenceEnterCallback(context, null);
        }
    }

    public static void setGeofenceExitCallback(final Context context, JsonCallback callback, JSONArray parameters) throws JSONException {
        boolean state = parameters.getBoolean(Methods.SetGeofenceExitCallback.STATE_INDEX);
        Logger.d(TAG, "Callbacks Registration: Geofence Exit registration - " + state);
        if(state) {
            JsonMceBroadcastReceiver.setGeofenceExitCallback(context, callback);
        } else {
            JsonMceBroadcastReceiver.setGeofenceExitCallback(context, null);
        }
    }

    public static void geofenceEnabled(final Context context, JsonCallback callback) throws JSONException {
        callbackSuccess(callback, true);
    }

    public static interface Methods {
        public static interface GeofencesNear {
            public static final String NAME = "geofencesNear";
            public static final int LATITUDE_INDEX = 0;
            public static final int LONGITUDE_INDEX = 1;
            public static final int RADIUS_INDEX = 2;
        }
        public static interface SetGeofenceEnterCallback {
            public static final String NAME = "setGeofenceEnterCallback";
            public static final int STATE_INDEX = 0;
        }
        public static interface SetGeofenceExitCallback {
            public static final String NAME = "setGeofenceExitCallback";
            public static final int STATE_INDEX = 0;
        }
        public static interface GeofenceEnabled {
            public static final String NAME = "geofenceEnabled";
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
