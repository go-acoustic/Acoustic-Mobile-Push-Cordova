/*
 * Copyright (C) 2024 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

 package co.acoustic.mobile.push.sdk.js.inbox;
 import co.acoustic.mobile.push.sdk.js.JsonCallback;
 import co.acoustic.mobile.push.sdk.js.JsonCallbacksRegistry;
 
 import android.annotation.SuppressLint;
 import android.content.Context;
 import android.content.Intent;
 import android.os.Build;
 import android.os.Bundle;
 
 import co.acoustic.mobile.push.sdk.plugin.inbox.InboxEvents;
 import co.acoustic.mobile.push.sdk.plugin.inbox.InboxMessageAction;
 import co.acoustic.mobile.push.sdk.api.MceApplication;
 import co.acoustic.mobile.push.sdk.api.MceSdk;
 import co.acoustic.mobile.push.sdk.api.notification.NotificationDetails;
 import co.acoustic.mobile.push.sdk.api.notification.MceNotificationAction;
 import co.acoustic.mobile.push.sdk.util.Logger;
 import org.json.JSONException;
 import org.json.JSONObject;
 import co.acoustic.mobile.push.sdk.js.MceJsonApi;
 import co.acoustic.mobile.push.sdk.notification.ActionImpl;
 
 import java.util.Map;
 
 public class JsonNotificationAction implements MceNotificationAction {
 
    private static final String TAG = "JsonNotificationAction";
 
     public enum Key {
         type, name, attribution, mailingId, payload
     }
 
     private final JsonCallback callback;
 
     public JsonNotificationAction(JsonCallback callback) {
         this.callback = callback;
     }
 
     public JsonCallback getCallback() {
         return callback;
     }
 
     @Override
     @SuppressLint("MissingPermission") // Permission needed for action_close_system_dialogs in S
     @SuppressWarnings("deprecation")
     public void handleAction(Context context, String type, String name, String attribution, String mailingId, Map<String, String> payload, boolean fromNotification) {
         try {
             JSONObject actionJSON = new JSONObject();
             if(payload != null) {
                 for(String key : payload.keySet()) {
                     Object value = payload.get(key);
                     if(value != null) {
                         String valueStr = (String)value;
                         if(valueStr.startsWith("{") && valueStr.endsWith("}")) {
                             try {
                                 value = new JSONObject(valueStr);
                             } catch(JSONException jsone) {}
                         }
                     }
                     actionJSON.put(key,value);
                 }
             }
             actionJSON.put(Key.type.name(), type);
             actionJSON.put(Key.name.name(), name);
             if(attribution != null) {
                 actionJSON.put(Key.attribution.name(), attribution);
             }
             if(mailingId != null) {
                 actionJSON.put(Key.mailingId.name(), mailingId);
             }
             if(callback != null && MceJsonApi.getRunning()) {
                 callback.success(actionJSON, true);
             } else {
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
 
             if (fromNotification) {
                 InboxEvents.sendInboxNotificationOpenedEvent(context, new ActionImpl(type, name, payload), attribution, mailingId);
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
         if(notificationDetails.getAction().getType().equals("openInboxMessage"))
         {
             InboxMessageAction inboxMessageAction = new InboxMessageAction();
             return inboxMessageAction.shouldDisplayNotification(context, notificationDetails, sourceBundle);
         }
         return true;
     }
 
     @Override
     public boolean shouldSendDefaultEvent(Context context) {
         return true;
     }
 }
 