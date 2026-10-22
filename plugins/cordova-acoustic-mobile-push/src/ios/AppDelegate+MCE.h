/*
 * Copyright © 2011, 2019 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

// Capacitor with Swift Package Manager ships AppDelegate.h inside the Cordova framework
#if __has_include(<Cordova/AppDelegate.h>)
#import <Cordova/AppDelegate.h>
#else
#import "AppDelegate.h"
#endif
#import "MCEPlugin.h"

@interface AppDelegate (mce)

- (void) application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken;
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo;
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler;
- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification;
- (void)application:(UIApplication *)application handleActionWithIdentifier:(NSString *)identifier forLocalNotification:(UILocalNotification *)notification completionHandler:(void (^)())completionHandler;

+ (void)mceInjectIntoDelegateClass:(Class)target;

-(void)action:(NSDictionary*)action payload:(NSDictionary*)payload;
-(void)setPlugin:(MCEPlugin*)sender;
-(MCEPlugin*)plugin;
-(BOOL)needsRegistration;
-(void)setNeedsRegistration:(BOOL)value;

@end