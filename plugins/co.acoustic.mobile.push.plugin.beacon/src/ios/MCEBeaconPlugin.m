/*
 * Copyright © 2011, 2019 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

#import "MCEBeaconPlugin.h"
#import <AcousticMobilePush/AcousticMobilePush.h>
#import <Cordova/CDVCommandDelegate.h>
#import <AcousticMobilePush/MCELocationDatabase.h>

@implementation MCEBeaconPlugin

- (void) beaconEnabled:(CDVInvokedUrlCommand*)command
{
    MCEConfig* config = [[MCESdk sharedInstance] config];
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool: config.beaconEnabled];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void) beaconUUID:(CDVInvokedUrlCommand*)command
{
    MCEConfig* config = [[MCESdk sharedInstance] config];
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString: [config.beaconUUID UUIDString] ];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void) beaconRegions:(CDVInvokedUrlCommand*)command
{
    NSSet * beacons = [[MCELocationDatabase sharedInstance] beaconRegions];

    NSMutableArray * beaconArray = [NSMutableArray array];
    for(CLBeaconRegion * beacon in beacons)
    {
        [beaconArray addObject: @{ @"major": beacon.major } ];
    }

    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray: beaconArray];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void) setBeaconEnterCallback:(CDVInvokedUrlCommand*)command
{
    [[NSNotificationCenter defaultCenter]addObserverForName:EnteredBeacon object:nil queue:[NSOperationQueue mainQueue] usingBlock: ^(NSNotification*note){
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary: note.userInfo];
        result.keepCallback = @TRUE;
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

- (void) setBeaconExitCallback:(CDVInvokedUrlCommand*)command
{
    [[NSNotificationCenter defaultCenter]addObserverForName:ExitedBeacon object:nil queue:[NSOperationQueue mainQueue] usingBlock: ^(NSNotification*note){
        CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary: note.userInfo];
        result.keepCallback = @TRUE;
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

@end
