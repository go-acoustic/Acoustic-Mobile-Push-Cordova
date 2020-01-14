/*
 * Copyright © 2011, 2019 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

#import "MCEGeofencePlugin.h"
#import <AcousticMobilePush/AcousticMobilePush.h>
#import <Cordova/CDVCommandDelegate.h>
#import <AcousticMobilePush/MCELocationDatabase.h>

@implementation MCEGeofencePlugin

- (void) geofenceEnabled:(CDVInvokedUrlCommand*)command
{
    MCEConfig* config = [[MCESdk sharedInstance] config];
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool: config.geofenceEnabled];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void) geofencesNear:(CDVInvokedUrlCommand*)command
{
    NSNumber * latitude = [command argumentAtIndex:0];
    NSNumber * longitude = [command argumentAtIndex:1];
    NSNumber * radius = [command argumentAtIndex:2];

    CLLocationCoordinate2D coord = CLLocationCoordinate2DMake([latitude doubleValue], [longitude doubleValue]);
    NSSet * geofences = [[MCELocationDatabase sharedInstance] geofencesNearCoordinate: coord radius: [radius doubleValue]];
    
    NSMutableArray * geofenceArray = [NSMutableArray array];
    for(MCEGeofence * geofence in geofences)
    {
        [geofenceArray addObject: @{ @"latitude": @(geofence.latitude), @"longitude": @(geofence.longitude), @"radius": @(geofence.radius) } ];
    }

    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray: geofenceArray];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void) setGeofenceEnterCallback:(CDVInvokedUrlCommand*)command
{
    [[NSNotificationCenter defaultCenter]addObserverForName:EnteredGeofence object:nil queue:[NSOperationQueue mainQueue] usingBlock: ^(NSNotification*note){
        CLCircularRegion * region = note.userInfo[@"region"];
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary: @{ @"latitude": @(region.center.latitude), @"longitude": @(region.center.longitude), @"radius": @(region.radius), @"locationId": region.identifier } ];
        result.keepCallback = @TRUE;
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

- (void) setGeofenceExitCallback:(CDVInvokedUrlCommand*)command
{
    [[NSNotificationCenter defaultCenter]addObserverForName:ExitedGeofence object:nil queue:[NSOperationQueue mainQueue] usingBlock: ^(NSNotification*note){
    
        CLCircularRegion * region = note.userInfo[@"region"];
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary: @{ @"latitude": @(region.center.latitude), @"longitude": @(region.center.longitude), @"radius": @(region.radius), @"locationId": region.identifier } ];
        result.keepCallback = @TRUE;
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

@end
