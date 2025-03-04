/*
 * Copyright (C) 2024 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

 package co.acoustic.mobile.push.sdk.js;
 import android.content.Context;
 import android.content.Intent;
 import android.os.Build;
 import android.os.Bundle;
 
 import co.acoustic.mobile.push.sdk.api.MceSdk;
 import co.acoustic.mobile.push.sdk.api.notification.NotificationDetails;
 import co.acoustic.mobile.push.sdk.api.notification.MceNotificationAction;
 import co.acoustic.mobile.push.sdk.util.Logger;
 import org.json.JSONException;
 import org.json.JSONObject;
 
 import java.util.Map;
 
 public class JsonNotificationAction implements MceNotificationAction {
 
    private static final String TAG = "JsonNotificationAction";
 
     public enum Key {
         TYPE, NAME, ATTRIBUTION, MAILING_ID, PAYLOAD
     }
 
     private final JsonCallback callback;
 
     public JsonNotificationAction(JsonCallback callback) {
         this.callback = callback;
     }
 
     public JsonCallback getCallback() {
         return callback;
     }
 
     @Override
     public void handleAction(Context context, String type, String name, String attribution, String mailingId, Map<String, String> payload, boolean fromNotification) {
         try {
             JSONObject actionJSON = new JSONObject();
             if(payload != null) {
                 for(Map.Entry<String, String> entry : payload.entrySet()) {
                     Object value = payload.get(entry.getKey());
                     if(value != null) {
                         String valueStr = (String)value;
                         if(valueStr.startsWith("{") && valueStr.endsWith("}")) {
                             try {
                                 value = new JSONObject(valueStr);
                             } catch(JSONException jsone) {
                                 Logger.e(TAG, "Error JsonNotificationAction.handleAction", jsone);
                             }
                         }
                     }
                     actionJSON.put(entry.getKey(),value);
                 }
             }
             actionJSON.put(Key.TYPE.name(), type);
             actionJSON.put(Key.NAME.name(), name);
             if(attribution != null) {
                 actionJSON.put(Key.ATTRIBUTION.name(), attribution);
             }
             if(mailingId != null) {
                 actionJSON.put(Key.MAILING_ID.name(), mailingId);
             }
             if(callback != null && MceJsonApi.getRunning()) {
                 Logger.v(TAG, "App is open, sending action to app");
                 callback.success(actionJSON, true);
             } else {
                 Logger.v(TAG, "App is not open, sending intent to open app for action");
                 JsonCallbacksRegistry.register(context, "notification." + type, true, actionJSON.toString());
                 Intent actionIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
                 if (actionIntent != null) {
                     actionIntent.addFlags(MceSdk.getNotificationsClient().getNotificationsPreference().getFlags(context));
                 }
                 if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
                     Intent it = new Intent(Intent.ACTION_CLOSE_SYSTEM_DIALOGS);
                     context.sendBroadcast(it);
                 }
                 context.startActivity(actionIntent);
             }
 
         } catch(JSONException jsone) {
             Logger.e(TAG, "Failed to construct action JSON", jsone);
         }
     }
 
     @Override
     public void init(Context context, JSONObject initOptions) {
 
     }
 
     @Override
     public void update(Context context, JSONObject updateOptions) {
 
     }
 
     @Override
     public boolean shouldDisplayNotification(final Context context, NotificationDetails notificationDetails, final Bundle sourceBundle) {
         return true;
     }
 
     @Override
     public boolean shouldSendDefaultEvent(Context context) {
         return true;
     }
 }
 