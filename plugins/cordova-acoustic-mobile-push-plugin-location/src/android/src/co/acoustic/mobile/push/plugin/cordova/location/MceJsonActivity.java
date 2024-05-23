/*
 * Copyright © 2017, 2019 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

 package co.acoustic.mobile.push.plugin.cordova.location;

 import co.acoustic.mobile.push.sdk.js.location.JsonMceBroadcastReceiver;
 import co.acoustic.mobile.push.sdk.util.Logger;
 
 import org.apache.cordova.CordovaActivity;
 
 import android.os.Build;
 import android.os.Bundle;
 import android.Manifest;
 import android.app.Activity;
 import android.content.Context;
 import android.content.Intent;
 import android.content.pm.PackageManager;
 import android.os.Bundle;
 import android.view.View;
 import android.widget.Button;
 
 import androidx.annotation.NonNull;
 import androidx.core.app.ActivityCompat;
 import androidx.appcompat.app.AppCompatActivity;
 
 public class MceJsonActivity extends CordovaActivity implements ActivityCompat.OnRequestPermissionsResultCallback
 {
     private static final String TAG = "MceJsonActivity";
     
     @Override
     public void onCreate(Bundle savedInstanceState)
     {
         super.onCreate(savedInstanceState);
 
         // enable Cordova apps to be started in the background
         Bundle extras = getIntent().getExtras();
         if (extras != null && extras.getBoolean("cdvStartInBackground", false)) {
             moveTaskToBack(true);
         }
 
         // Set by <content src="index.html" /> in config.xml
         loadUrl(launchUrl);
     }
 
     @Override
     public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults)
     {
         if (requestCode == 0)
         {
             // Check if the only required permission has been granted
             if (grantResults.length == 1 && grantResults[0] == PackageManager.PERMISSION_GRANTED)
             {
                 Logger.i(TAG, "Location permission was granted.");
                 JsonMceBroadcastReceiver.onLocationAuthorization(this);
             }
             else
             {
                 Logger.i(TAG, "Location permission was NOT granted.");
             }
         }
         else if (requestCode == 1 && grantResults[0] == PackageManager.PERMISSION_GRANTED)
         {
             if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                 ActivityCompat.requestPermissions(
                     this,
                     new String[]{
                         Manifest.permission.ACCESS_BACKGROUND_LOCATION
                     },
                     0);
             }
         }
         else
         {
             super.onRequestPermissionsResult(requestCode, permissions, grantResults);
         }
     }
 
     @Override
     public void onDestroy() {
         Logger.w(TAG, "On destroy called on MceJsonActivity");
         super.onDestroy();
     }
 }
 