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

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.location.Location;

import co.acoustic.mobile.push.sdk.api.MceApplication;
import co.acoustic.mobile.push.sdk.api.MceBroadcastReceiver;
import co.acoustic.mobile.push.sdk.api.attribute.AttributesOperation;
import co.acoustic.mobile.push.sdk.api.event.Event;
import co.acoustic.mobile.push.sdk.api.notification.NotificationDetails;
import co.acoustic.mobile.push.sdk.beacons.IBeacon;
import co.acoustic.mobile.push.sdk.beacons.IBeaconsJson;
import co.acoustic.mobile.push.sdk.js.JsonCallbacksRegistry;
import co.acoustic.mobile.push.sdk.util.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import co.acoustic.mobile.push.sdk.js.JsonCallback;
import co.acoustic.mobile.push.sdk.location.MceLocation;

import java.util.Date;
import java.util.List;

public class JsonMceBroadcastReceiver extends MceBroadcastReceiver{

   private static final String TAG = "JsonMceBroadcastReceiver";

    private static final String SEND_ENTER_CALLBACK_NAME = "sendEnterCallback";
    private static final String SEND_EXIT_CALLBACK_NAME = "sendExitCallback";

    private static JsonCallback beaconEnterCallback;
    private static JsonCallback beaconExitCallback;

    // Other Methods
    @Override
    public void onInboxCountUpdate(Context context) {
    }

    @Override
    public void onLocationUpdate(Context context, Location location)
    {
    }

    @Override
    public void onActionNotYetRegistered(Context context, String actionType) {
    }

    @Override
    public void onActionNotRegistered(Context context, String actionType) {
    }

    public static void setBeaconEnterCallback(Context context, JsonCallback beaconEnterCallback) {
        JsonMceBroadcastReceiver.beaconEnterCallback = beaconEnterCallback;
        
        if(beaconEnterCallback != null) {
            Logger.i(TAG, "Setting iBeacon Enter Callback");
            synchronized (SEND_ENTER_CALLBACK_NAME) {
                List<JsonCallbacksRegistry.RegisteredCallback> registeredCallbacks = JsonCallbacksRegistry.getRegisteredCallbacks(context, SEND_ENTER_CALLBACK_NAME);
                if(!registeredCallbacks.isEmpty()) {
                    for (JsonCallbacksRegistry.RegisteredCallback callback : registeredCallbacks) {
                        if (callback.isSuccess()) {
                            try {
                                JSONObject beaconJson = new JSONObject(callback.getParameterAsString());
                                callbackSuccess(beaconEnterCallback, beaconJson);
                            } catch (JSONException jsone) {
                                Logger.e(TAG, "Failed to generate location event JSON", jsone);
                            }
                        } else {
                            callbackFailure(beaconEnterCallback, callback.getParameterAsString());
                        }
                    }
                    JsonCallbacksRegistry.deleteCallbacks(context, registeredCallbacks);
                }
            }
        }
    }

    public static void setBeaconExitCallback(Context context, JsonCallback beaconExitCallback) {
        JsonMceBroadcastReceiver.beaconExitCallback = beaconExitCallback;

        if(beaconExitCallback != null) {
            Logger.i(TAG, "Setting iBeacon Exit Callback");
            synchronized (SEND_EXIT_CALLBACK_NAME) {
                List<JsonCallbacksRegistry.RegisteredCallback> registeredCallbacks = JsonCallbacksRegistry.getRegisteredCallbacks(context, SEND_EXIT_CALLBACK_NAME);
                if(!registeredCallbacks.isEmpty()) {
                    for (JsonCallbacksRegistry.RegisteredCallback callback : registeredCallbacks) {
                        if (callback.isSuccess()) {
                            try {
                                JSONObject beaconJson = new JSONObject(callback.getParameterAsString());
                                callbackSuccess(beaconExitCallback, beaconJson);
                            } catch (JSONException jsone) {
                                Logger.e(TAG, "Failed to generate location event JSON", jsone);
                            }
                        } else {
                            callbackFailure(beaconExitCallback, callback.getParameterAsString());
                        }
                    }
                    JsonCallbacksRegistry.deleteCallbacks(context, registeredCallbacks);
                }
            }
        }
    }

    @Override
    public void onSdkRegistered(Context context) {
    }

    @Override
    public void onSdkRegistrationChanged(Context context) {
    }

    @Override
    public void onSdkRegistrationUpdated(Context context) {
    }

    @Override
    public void onMessagingServiceRegistered(Context context) {
    }

    @Override
    public void onMessage(Context context, NotificationDetails notificationDetails, Bundle bundle) {
    }

    @Override
    public void onC2dmError(Context context, String error) {
    }

    @Override
    public void onSessionStart(Context context, Date date) {
    }

    @Override
    public void onSessionEnd(Context context, Date date, long l) {
    }

    @Override
    public void onNotificationAction(Context context, Date date, String type, String name, String value) {
    }

    @Override
    public void onAttributesOperation(Context context, AttributesOperation attributesOperation) {
    }

    @Override
    public void onEventsSend(Context context, List<Event> events) {
    }

    @Override
    public void onIllegalNotification(Context context, Intent intent) {
    }

    @Override
    public void onNonMceBroadcast(Context context, Intent intent) {
    }

    @Override
    public void onLocationEvent(Context context, MceLocation location, LocationType locationType, LocationEventType locationEventType) {
        if(locationType == LocationType.ibeacon)
        {
            IBeacon beacon = (IBeacon)location;
            if(locationEventType == LocationEventType.enter)
            {
                Logger.i(TAG, "iBeacon Entry, sending to cordova");
                try{
                    JSONObject details = IBeaconsJson.iBeaconToJSON(beacon);
                    if(beaconEnterCallback != null && MceJsonApi.running) {
                        callbackSuccess(beaconEnterCallback, details);
                    } else {
                        synchronized (SEND_ENTER_CALLBACK_NAME) {
                            JsonCallbacksRegistry.register(context, SEND_ENTER_CALLBACK_NAME, true, details.toString());
                        }
                    }
                } catch (JSONException jsone) {
                    Logger.e(TAG, "Failed to generate beacon entry JSON");
                }
            }

            if(locationEventType == LocationEventType.exit)
            {
                Logger.i(TAG, "iBeacon Exit, sending to cordova");
                try{
                    JSONObject details = IBeaconsJson.iBeaconToJSON(beacon);
                    if(beaconExitCallback != null && MceJsonApi.running) {
                        callbackSuccess(beaconExitCallback, details);
                    } else {
                        synchronized (SEND_EXIT_CALLBACK_NAME) {
                            JsonCallbacksRegistry.register(context, SEND_EXIT_CALLBACK_NAME, true, details.toString());
                        }
                    }
                } catch (JSONException jsone) {
                    Logger.e(TAG, "Failed to generate beacon exit JSON");
                }
            }
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

    private static void callbackSuccess(JsonCallback callback, String response) {
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
