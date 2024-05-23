/*
 * Copyright (C) 2024 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

 package co.acoustic.mobile.push.plugin.cordova.geofence;

 import co.acoustic.mobile.push.sdk.location.LocationManager;
 import co.acoustic.mobile.push.plugin.cordova.CordovaJsonCallback;
 import co.acoustic.mobile.push.sdk.js.geofence.MceJsonApi;
 import co.acoustic.mobile.push.sdk.util.Logger;
 
 import androidx.core.app.ActivityCompat;
 import androidx.core.content.ContextCompat;
 
 import android.content.pm.PackageManager;
 import android.content.Context;
 import android.app.Activity;
 
 import org.apache.cordova.CallbackContext;
 import org.apache.cordova.CordovaPlugin;
 import org.apache.cordova.CordovaInterface;
 import org.apache.cordova.CordovaWebView;
 import org.apache.cordova.PluginResult;
 
 import org.json.JSONArray;
 import org.json.JSONException;
 
 public class MceCordovaGeofencePlugin extends CordovaPlugin {
     private static final int REQUEST_LOCATION = 0;
     private static final int REQUEST_LOCATION_THEN_BACKGROUND = 1;
 
     final static String TAG = "MceCordovaGeofencePlugin";
 
     @Override
     public void initialize(final CordovaInterface cordova, CordovaWebView webView) {
         super.initialize(cordova, webView);
         cordova.getActivity().runOnUiThread(() -> {
             if (ContextCompat.checkSelfPermission(
                     cordova.getActivity(),
                     android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
 
                 if (android.os.Build.VERSION.SDK_INT < 29) {
                     ActivityCompat.requestPermissions(
                         cordova.getActivity(),
                         new String[]{
                                 android.Manifest.permission.ACCESS_FINE_LOCATION,
                                 android.Manifest.permission.ACCESS_COARSE_LOCATION
                         },
                         REQUEST_LOCATION);
 
                 } else if (android.os.Build.VERSION.SDK_INT == 29) {
                     ActivityCompat.requestPermissions(
                         cordova.getActivity(),
                         new String[]{
                             android.Manifest.permission.ACCESS_FINE_LOCATION,
                             android.Manifest.permission.ACCESS_COARSE_LOCATION,
                             android.Manifest.permission.ACCESS_BACKGROUND_LOCATION
                         },
                         REQUEST_LOCATION);
                 } else if (android.os.Build.VERSION.SDK_INT == 30) {
                     ActivityCompat.requestPermissions(
                         cordova.getActivity(),
                         new String[]{
                             android.Manifest.permission.ACCESS_FINE_LOCATION,
                             android.Manifest.permission.ACCESS_COARSE_LOCATION
                         },
                         REQUEST_LOCATION_THEN_BACKGROUND);
                 } else {
                     ActivityCompat.requestPermissions(
                         cordova.getActivity(),
                         new String[]{
                             android.Manifest.permission.ACCESS_FINE_LOCATION,
                             android.Manifest.permission.ACCESS_COARSE_LOCATION,
                             android.Manifest.permission.BLUETOOTH_SCAN
                         },
                         REQUEST_LOCATION_THEN_BACKGROUND);
                 }
             } else {
                 LocationManager.enableLocationSupport(cordova.getContext());
             }
         });
     }
 
     @Override
     public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
         CordovaJsonCallback callback = new CordovaJsonCallback(callbackContext);
         boolean executed = MceJsonApi.execute(action, args, this.cordova.getActivity().getApplicationContext(), callback, cordova.getThreadPool());
         if (!executed) {
             PluginResult result = new PluginResult(PluginResult.Status.INVALID_ACTION, action);
             callbackContext.sendPluginResult(result);
             return false;
         } else {
             return true;
         }
     }
 
     @Override
     public void onStop() {
         Logger.d(TAG, "onStop");
         MceJsonApi.running = false;
         super.onStop();
     }
 
     @Override
     public void onStart() {
         Logger.d(TAG, "onStart");
         super.onStart();
         MceJsonApi.running = true;
     }
 }
 