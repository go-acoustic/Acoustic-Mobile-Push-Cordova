/*
 * Copyright © 2011, 2019 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

#import "MCELocationPlugin.h"
#import <AcousticMobilePush/AcousticMobilePush.h>
#import <Cordova/CDVCommandDelegate.h>
#import <AcousticMobilePush/MCELocationDatabase.h>
#import <AcousticMobilePush/MCEConstants.h>
#import <AcousticMobilePush/MCESdk.h>

@interface MCELocationPlugin()
@property CLLocationManager * locationManager;
@property NSString * locationAuthCallback;
@end

@implementation MCELocationPlugin

- (void)locationManager:(CLLocationManager *)manager didChangeAuthorizationStatus:(CLAuthorizationStatus)status
{
    if (self.locationAuthCallback) {
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        result.keepCallback = @TRUE;
        [self.commandDelegate sendPluginResult:result callbackId:self.locationAuthCallback];
    }
}

- (void) setLocationAuthorizationCallback:(CDVInvokedUrlCommand*)command
{
    if(!self.locationManager)
    {
        self.locationManager = [[CLLocationManager alloc]init];
        self.locationManager.delegate = self;
    }
    self.locationAuthCallback = command.callbackId;
}

- (void) manualLocationInitialization:(CDVInvokedUrlCommand*)command
{
    [MCESdk.sharedInstance manualLocationInitialization];
}

- (void) locationAuthorization:(CDVInvokedUrlCommand*)command
{
    switch(CLLocationManager.authorizationStatus)
    {
        case kCLAuthorizationStatusNotDetermined:
        {
            CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt: 0];
            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
            break;
        }
        case kCLAuthorizationStatusAuthorizedAlways:
        {
            CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt: 1];
            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
            break;
        }
        case kCLAuthorizationStatusAuthorizedWhenInUse:
        {
            CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt: -2];
            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
            break;
        }
        default:
        {
            CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt: -1];
            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
            break;
        }
    }
}

- (void) setLocationUpdatedCallback:(CDVInvokedUrlCommand*)command
{
    [[NSNotificationCenter defaultCenter]addObserverForName:MCEEventSuccess object:nil queue:[NSOperationQueue mainQueue] usingBlock: ^(NSNotification*note){
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        result.keepCallback = @TRUE;
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

- (void) syncLocations:(CDVInvokedUrlCommand*)command
{
    [[[MCELocationClient alloc]init] scheduleSync];
}

@end
