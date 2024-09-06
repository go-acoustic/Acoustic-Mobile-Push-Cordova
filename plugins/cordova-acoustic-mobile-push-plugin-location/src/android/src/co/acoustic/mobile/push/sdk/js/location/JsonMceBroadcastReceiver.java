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

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.location.Location;

import co.acoustic.mobile.push.sdk.api.MceApplication;
import co.acoustic.mobile.push.sdk.api.MceBroadcastReceiver;
import co.acoustic.mobile.push.sdk.api.attribute.AttributesOperation;
import co.acoustic.mobile.push.sdk.api.event.Event;
import co.acoustic.mobile.push.sdk.api.notification.NotificationDetails;
import co.acoustic.mobile.push.sdk.js.JsonCallbacksRegistry;
import co.acoustic.mobile.push.sdk.js.MceJsonApi;
import co.acoustic.mobile.push.sdk.util.Logger;
import org.json.JSONArray;
import org.json.JSONObject;
import co.acoustic.mobile.push.sdk.js.JsonCallback;
import co.acoustic.mobile.push.sdk.location.MceLocation;

import java.util.Date;
import java.util.List;

public class JsonMceBroadcastReceiver extends MceBroadcastReceiver{

   private static final String TAG = "JsonMceBroadcastReceiver";

    private static final String SEND_LOCATION_UPDATED_CALLBACK_NAME = "sendLocationUpdatedCallback";

    private static final String SEND_LOCATION_AUTH_CALLBACK_NAME = "sendLocationAuthCallback";
    
    private static JsonCallback locationUpdatedCallback;

    @Override
    public void onActionNotYetRegistered(Context context, String actionType) {
    }

    @Override
    public void onActionNotRegistered(Context context, String actionType) {
    }

    // Other Methods
    @Override
    public void onLocationUpdate(Context context, Location location)
    {
        Logger.i(TAG, "Location Update, sending to cordova");
    
        if(locationUpdatedCallback != null && MceJsonApi.getRunning()) {
            callbackSuccess(locationUpdatedCallback);
        } else {
            synchronized (SEND_LOCATION_UPDATED_CALLBACK_NAME) {
                JsonCallbacksRegistry.register(context, SEND_LOCATION_UPDATED_CALLBACK_NAME, true, "");
            }
        }
    }
    
    public static void onLocationAuthorization(Context context)
    {
        Logger.i(TAG, "Location Auth Update, sending to cordova");
        
            if(locationAuthCallback != null && MceJsonApi.getRunning()) {
                callbackSuccess(locationAuthCallback);
            } else {
                synchronized (SEND_LOCATION_AUTH_CALLBACK_NAME) {
                    JsonCallbacksRegistry.register(context, SEND_LOCATION_AUTH_CALLBACK_NAME, true, "");
                }
            }
    
    }

    private static JsonCallback locationAuthCallback;
    
    public static void setLocationAuthorizationCallback(Context context, JsonCallback locationAuthCallback)
    {
        JsonMceBroadcastReceiver.locationAuthCallback = locationAuthCallback;

        if(locationAuthCallback != null) {
            Logger.i(TAG, "Setting Location Auth Callback");
            synchronized (SEND_LOCATION_AUTH_CALLBACK_NAME) {
                List<JsonCallbacksRegistry.RegisteredCallback> registeredCallbacks = JsonCallbacksRegistry.getRegisteredCallbacks(context, SEND_LOCATION_AUTH_CALLBACK_NAME);
                if(!registeredCallbacks.isEmpty()) {
                    for (JsonCallbacksRegistry.RegisteredCallback callback : registeredCallbacks) {
                        if (callback.isSuccess()) {
                            callbackSuccess(locationAuthCallback);
                        } else {
                            callbackFailure(locationAuthCallback, callback.getParameterAsString());
                        }
                    }
                    JsonCallbacksRegistry.deleteCallbacks(context, registeredCallbacks);
                }
            }
        }        
    }

    public static void setLocationUpdatedCallback(Context context, JsonCallback locationUpdatedCallback) {
        JsonMceBroadcastReceiver.locationUpdatedCallback = locationUpdatedCallback;

        if(locationUpdatedCallback != null) {
            Logger.i(TAG, "Setting Location Update Callback");
            synchronized (SEND_LOCATION_UPDATED_CALLBACK_NAME) {
                List<JsonCallbacksRegistry.RegisteredCallback> registeredCallbacks = JsonCallbacksRegistry.getRegisteredCallbacks(context, SEND_LOCATION_UPDATED_CALLBACK_NAME);
                if(!registeredCallbacks.isEmpty()) {
                    for (JsonCallbacksRegistry.RegisteredCallback callback : registeredCallbacks) {
                        if (callback.isSuccess()) {
                            callbackSuccess(locationUpdatedCallback);
                        } else {
                            callbackFailure(locationUpdatedCallback, callback.getParameterAsString());
                        }
                    }
                    JsonCallbacksRegistry.deleteCallbacks(context, registeredCallbacks);
                }
            }
        }
    }

    private static void sendRegisteredEventCallbacks(Context context) {
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
    }

    @Override
    public void onInboxCountUpdate(Context context) {
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
