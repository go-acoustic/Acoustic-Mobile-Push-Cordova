/*
* Copyright © 2022 Acoustic, L.P. All rights reserved.
*
* NOTICE: This file contains material that is confidential and proprietary to
* Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
* industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
* Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
* prohibited.
*/

#import "MCEManualConfiguration.h"
#import <objc/runtime.h>
#import <Cordova/CDVConfigParser.h>

@implementation MCEManualConfiguration

+ (NSDictionary*)loadSettings
{
    CDVConfigParser* delegate = [[CDVConfigParser alloc] init];
    
    // read from config.xml in the app bundle
    NSString* path = [[NSBundle mainBundle] pathForResource:@"config" ofType:@"xml"];
    
    if (![[NSFileManager defaultManager] fileExistsAtPath:path]) {
        NSAssert(NO, @"ERROR: config.xml does not exist. Please run cordova-ios/bin/cordova_plist_to_config_xml path/to/project.");
        return nil;
    }
    
    NSURL* url = [NSURL fileURLWithPath:path];
    
    NSXMLParser * configParser = [[NSXMLParser alloc] initWithContentsOfURL:url];
    if (configParser == nil) {
        NSLog(@"Failed to initialize XML parser.");
        return nil;
    }
    [configParser setDelegate:((id < NSXMLParserDelegate >)delegate)];
    [configParser parse];
    
    objc_setAssociatedObject(self, @"settings", delegate.settings, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    
    return delegate.settings;
}
+ (id)settingForKey:(NSString*)key
{
    NSDictionary * settings = objc_getAssociatedObject(self, @"settings");
    if(!settings)
        settings = [self loadSettings];
    return [settings objectForKey:[key lowercaseString]];
}

+ (NSDictionary*) xmlSettings {

    NSString * devAppKey = [self settingForKey:@"devAppKey"];
    NSString * prodAppKey = [self settingForKey:@"prodAppKey"];
    NSString * loglevel = [self settingForKey:@"loglevel"];

    NSString * autoReinitializeString = [self settingForKey:@"autoReinitialize"];
    NSNumber * autoReinitialize = ([autoReinitializeString caseInsensitiveCompare: @"true"] == NSOrderedSame || [autoReinitializeString caseInsensitiveCompare: @"yes"] == NSOrderedSame) ? @YES : @NO;

    NSString * baseUrl = [self settingForKey:@"baseUrl"];

    NSString * autoInitializeString = [self settingForKey:@"autoInitialize"];
    NSNumber * autoInitialize = ([autoInitializeString caseInsensitiveCompare: @"true"] == NSOrderedSame || [autoInitializeString caseInsensitiveCompare: @"yes"] == NSOrderedSame) ? @YES : @NO;

    NSString * invalidateExistingUserString = [self settingForKey:@"invalidateExistingUser"];
    NSNumber * invalidateExistingUser = ([invalidateExistingUserString caseInsensitiveCompare: @"true"] == NSOrderedSame || [invalidateExistingUserString caseInsensitiveCompare: @"yes"] == NSOrderedSame) ? @YES : @NO;

    NSMutableDictionary * config = [@{@"invalidateExistingUser":invalidateExistingUser, @"autoReinitialize": autoReinitialize, @"loglevel":loglevel,@"baseUrl":baseUrl, @"appKey":@{ @"prod":prodAppKey, @"dev":devAppKey}, @"autoInitialize":autoInitialize, @"location": [NSMutableDictionary dictionary] } mutableCopy];

    if([self settingForKey:@"geofence"] && [[self settingForKey:@"geofence"] caseInsensitiveCompare: @"true"] == NSOrderedSame)
    {
        config[@"location"][@"geofence"] = [NSMutableDictionary dictionary];
    }


    NSString * autoInitializeLocation = [self settingForKey:@"autoInitializeLocation"];
    NSNumber * geofenceSyncInterval = (NSNumber*)[self settingForKey:@"locationSyncInterval"];
    NSNumber * geofenceSyncRadius = (NSNumber*)[self settingForKey:@"locationSyncRadius"];

    if(geofenceSyncRadius && geofenceSyncInterval)
    {
        config[@"location"][@"sync"] = [NSMutableDictionary dictionary];
        config[@"location"][@"sync"][@"syncRadius"] = geofenceSyncRadius;
        config[@"location"][@"sync"][@"syncInterval"] = geofenceSyncInterval;
    }

    if(autoInitializeLocation && [autoInitializeLocation caseInsensitiveCompare: @"true"] == NSOrderedSame) {
        config[@"location"][@"autoInitialize"] = @YES;
    } else {
        config[@"location"][@"autoInitialize"] = @NO;
    }

    if([self settingForKey:@"geofence"] && [[self settingForKey:@"ibeacon"] caseInsensitiveCompare: @"true"] == NSOrderedSame)
    {
        config[@"location"][@"ibeacon"] = [NSMutableDictionary dictionary];

        NSString * beaconUUID = (NSString*)[self settingForKey:@"beaconUUID"];
        if(beaconUUID)
        {
            config[@"location"][@"ibeacon"][@"UUID"] = beaconUUID;
        }
    }

    return config;
}

@end
