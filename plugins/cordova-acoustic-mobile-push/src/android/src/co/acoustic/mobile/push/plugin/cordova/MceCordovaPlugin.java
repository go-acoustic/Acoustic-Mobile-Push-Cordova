/*
 * Copyright (C) 2024 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

 package co.acoustic.mobile.push.plugin.cordova;

 import co.acoustic.mobile.push.sdk.Preferences;
 import co.acoustic.mobile.push.sdk.js.JsonMceBroadcastReceiver;
 import co.acoustic.mobile.push.sdk.js.MceJsonApi;
 import co.acoustic.mobile.push.sdk.js.MceJsonApplication;
 import co.acoustic.mobile.push.sdk.util.Logger;
 
 import org.apache.cordova.CallbackContext;
 import org.apache.cordova.CordovaPlugin;
 import org.apache.cordova.PluginResult;
 
 import org.json.JSONArray;
 import org.json.JSONException;
 
 import android.content.Context;
 
 public class MceCordovaPlugin extends CordovaPlugin {
     private static final String FIRST_LOAD = "firstload";
     private static final String TAG = "MceCordovaPlugin";
 
     @Override
     public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
         start();
         CordovaJsonCallback callback = null;
         if(callbackContext != null) {
             Logger.d(TAG, "Setting callback context to " + callbackContext.getCallbackId());
             callback = new CordovaJsonCallback(callbackContext);
         }
 
         boolean executed = MceJsonApi.execute(action, args, this.cordova.getActivity().getApplicationContext(), callback, cordova.getThreadPool());
         if(!executed) {
             PluginResult result = new PluginResult(PluginResult.Status.INVALID_ACTION, action);
             if(callbackContext != null) {
                 callbackContext.sendPluginResult(result);
             }
             return false;
         } else {
             return true;
         }
     }
 
     @Override
     public void onStop() {
         Logger.d(TAG, "onStop");
         MceJsonApi.setRunning(false);
         super.onStop();
     }
 
     @Override
     public void onStart() {
         Logger.d(TAG, "onStart");
         super.onStart();
         start();
     }
 
     void start() {
         MceJsonApi.setRunning(true);
         Context context = this.cordova.getActivity().getApplicationContext();
         boolean firstLoad = Preferences.getBoolean(context, FIRST_LOAD, true);
         if(firstLoad) {
             Preferences.setBoolean(context,FIRST_LOAD, false);
         } else {
             JsonMceBroadcastReceiver.sendRegisteredCallbacks(cordova.getActivity().getApplicationContext());
             MceJsonApplication.sendRegisteredActionCallbacks(cordova.getActivity().getApplicationContext());
         }
     }
 }
 