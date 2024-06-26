/*
 * Copyright (C) 2024 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

#import "AppDelegate+MCE.h"
#import <objc/runtime.h>
#import <Cordova/CDVConfigParser.h>
#import "MCEManualConfiguration.h"
#import <AcousticMobilePush/AcousticMobilePush.h>
#import "MCEEventCallbackQueue.h"

@implementation AppDelegate (mce)

-(void)updateUserAttributeFailure:(NSNotification*)notification
{
    [self attributeFailureDomain: @"user" operation: @"update" notification: notification];
}
-(void)updateUserAttributeSuccess:(NSNotification*)notification
{
    [self attributeSuccessDomain: @"user" operation: @"update" notification: notification];
}
-(void)deleteUserAttributeFailure:(NSNotification*)notification
{
    [self attributeFailureDomain: @"user" operation: @"delete" notification: notification];
}
-(void)deleteUserAttributeSuccess:(NSNotification*)notification
{
    [self attributeSuccessDomain: @"user" operation: @"delete" notification: notification];
}

-(void)actionNotYetRegistered: (NSNotification*)note {
    MCEPlugin * plugin = self.plugin;
    if(plugin && plugin.actionNotYetRegistered) {
        [plugin sendActionNotYetRegistered: note.userInfo];
    } else {
        [[MCECallbackDatabaseManager sharedInstance] insertCallback: @"actionNotYetRegistered" dictionary: note.userInfo];
    }
}

-(void)actionNotRegistered: (NSNotification*)note {
    MCEPlugin * plugin = self.plugin;
    if(plugin && plugin.actionNotRegistered) {
        [plugin sendActionNotRegistered: note.userInfo];
    } else {
        [[MCECallbackDatabaseManager sharedInstance] insertCallback: @"actionNotRegistered" dictionary: note.userInfo];
    }
}

-(void)attributeSuccessDomain:(NSString*)domain operation: (NSString*)operation notification:(NSNotification*)notification
{
    NSDictionary * details = @{@"operation": operation, @"domain": domain, @"attributes": [NSMutableDictionary dictionary]};
    NSDictionary * attributes = notification.userInfo[@"attributes"];
    for (NSString * key in attributes) {
        id value = attributes[key];
        
        if([value isKindOfClass:NSDate.class]) {
            NSDate * date = value;
            value = @{ @"mcedate": [NSNumber numberWithDouble: [date timeIntervalSince1970] * 1000] };
        }
        
        details[@"attributes"][key]=value;
    }
    
    MCEPlugin * plugin = self.plugin;
    if(plugin && plugin.attributeCallback)
    {
        [plugin sendAttributeSuccess: details];
    }
    else
    {
        [[MCECallbackDatabaseManager sharedInstance] insertCallback: @"attributeSuccess" dictionary: details];
    }
}

-(void)attributeFailureDomain:(NSString*)domain operation: (NSString*)operation notification:(NSNotification*)notification
{
    NSMutableDictionary * details = [notification.userInfo mutableCopy];
    NSError * error = details[@"error"];
    if(error && [error isKindOfClass:NSError.class]) {
        details[@"error"] = [error localizedDescription];
    }
    details[@"operation"] = operation;
    details[@"domain"] = domain;
    
    MCEPlugin * plugin = self.plugin;
    if(plugin && plugin.attributeCallback)
    {
        [plugin sendAttributeFailure: details];
    }
    else
    {
        [[MCECallbackDatabaseManager sharedInstance] insertCallback: @"attributeFailure" dictionary: details];
    }
}

-(void)appDidFinishLaunching:(NSNotification*)notification
{
    UIApplication * application = [UIApplication sharedApplication];
    
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
    NSDictionary * channelAttributes = @{@"sdk": @"cordova", @"cordova": [[MCESdk sharedInstance] sdkVersion] };
    if(MCERegistrationDetails.sharedInstance.mceRegistered) {
        [MCEAttributesQueueManager.sharedInstance updateChannelAttributes: channelAttributes];
    } else {
        [NSNotificationCenter.defaultCenter addObserverForName:MCERegisteredNotification object:nil queue:NSOperationQueue.mainQueue usingBlock:^(NSNotification * _Nonnull note) {
            [MCEAttributesQueueManager.sharedInstance updateChannelAttributes: channelAttributes];
        }];
    }
    
    if([UNUserNotificationCenter class])
    {
        UNUserNotificationCenter * center = [UNUserNotificationCenter currentNotificationCenter];
        center.delegate=MCENotificationDelegate.sharedInstance;
        NSUInteger options = UNAuthorizationOptionAlert|UNAuthorizationOptionSound|UNAuthorizationOptionBadge|UNAuthorizationOptionCarPlay;
        [center requestAuthorizationWithOptions: options completionHandler:^(BOOL granted, NSError * _Nullable error) {
            // Enable or disable features based on authorization.
            NSLog(@"Notifications response %d, %@", granted, error);
            [application performSelectorOnMainThread:@selector(registerForRemoteNotifications) withObject:nil waitUntilDone:NO];
        }];
    }
    else if ([application respondsToSelector:@selector(registerUserNotificationSettings:)])
    {
        UIUserNotificationSettings *settings = [UIUserNotificationSettings settingsForTypes:UIUserNotificationTypeBadge|UIUserNotificationTypeSound|UIUserNotificationTypeAlert categories:nil];
        [application registerUserNotificationSettings:settings];
        [application registerForRemoteNotifications];
    }
    else {
        //register to receive notifications iOS <8
        UIRemoteNotificationType myTypes = UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeAlert | UIRemoteNotificationTypeSound;
        [application registerForRemoteNotificationTypes:myTypes];
    }
#pragma GCC diagnostic pop
}

// its dangerous to override a method from within a category.
// Instead we will use method swizzling. we set this up in the load call.
+ (void)load
{
    Method original = class_getInstanceMethod(self, @selector(application:didFinishLaunchingWithOptions:));
    Method swizzled = class_getInstanceMethod(self, @selector(mceApplication:didFinishLaunchingWithOptions:));
    method_exchangeImplementations(original, swizzled);
}

- (BOOL)mceApplication:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    NSLog(@"swizzled_init");
    // This calls the original application:didFinishLaunchingWithOptions: method
    [self mceApplication:application didFinishLaunchingWithOptions:launchOptions];
    
    NSNotificationCenter * center = [NSNotificationCenter defaultCenter];
    [center addObserver:self selector:@selector(actionNotYetRegistered:) name:MCECustomPushNotYetRegistered object:nil];
    [center addObserver:self selector:@selector(actionNotRegistered:) name:MCECustomPushNotRegistered object:nil];

    [center addObserver:self selector:@selector(appDidFinishLaunching:) name:UIApplicationDidFinishLaunchingNotification object:nil];
    [center addObserver:self selector:@selector(registration:) name:MCERegisteredNotification object:nil];
    [center addObserver:self selector:@selector(registration:) name:MCERegistrationChangedNotification object:nil];
    [center addObserver:self selector:@selector(eventSuccess:) name:MCEEventSuccess object:nil];
    [center addObserver:self selector:@selector(eventFailure:) name:MCEEventFailure object:nil];
    
    
    [center addObserver:self selector:@selector(updateUserAttributeFailure:) name:UpdateUserAttributesError object:nil];
    [center addObserver:self selector:@selector(updateUserAttributeSuccess:) name:UpdateUserAttributesSuccess object:nil];
    [center addObserver:self selector:@selector(deleteUserAttributeFailure:) name:DeleteUserAttributesError object:nil];
    [center addObserver:self selector:@selector(deleteUserAttributeSuccess:) name:DeleteUserAttributesSuccess object:nil];
    
    [[MCESdk sharedInstance] handleApplicationLaunchWithConfig:MCEManualConfiguration.xmlSettings];
    return YES;
}

// Forward Event Success Message if plugin is registered, queue it in database otherwise
-(void)eventSuccess:(NSNotification*)notification
{
    MCEPlugin * plugin = self.plugin;
    if(plugin && plugin.eventCallback)
    {
        [plugin sendEventSuccess: notification.userInfo[@"events"]];
    }
    else
    {
        NSLog(@"event success queue: %@", notification.userInfo);
        
        MCEEventCallbackQueue * eventCallbackQueue = [MCEEventCallbackQueue sharedInstance];
        [eventCallbackQueue queueEvents: notification.userInfo[@"events"]];
    }
}

// Forward Event Failure Message if plugin is registered, queue it in database otherwise
-(void)eventFailure:(NSNotification*)notification
{
    MCEPlugin * plugin = self.plugin;
    NSError * error = notification.userInfo[@"error"];
    if(plugin && plugin.eventCallback)
    {
        [plugin sendEventFailure: notification.userInfo[@"events"] error: [error localizedDescription]];
    }
    else
    {
        NSLog(@"event failure queue: %@", notification.userInfo);
        
        MCEEventCallbackQueue * eventCallbackQueue = [MCEEventCallbackQueue sharedInstance];
        [eventCallbackQueue queueEvents: notification.userInfo[@"events"] error: [error localizedDescription]];
    }
}

-(void)registration:(NSNotification *)notification
{
    MCEPlugin * plugin = self.plugin;
    if(plugin && plugin.registrationCallbacks)
    {
        [plugin sendRegistration];
    }
    else
    {
        [self setNeedsRegistration: TRUE];
    }
}

-(void)action:(NSDictionary*)action payload:(NSDictionary*)payload
{
    if(self.plugin && [self.plugin executeActionCallback: action payload: payload])
    {
        return;
    }
    NSLog(@"Couldn't deliver action %@ with payload %@", action, payload);
}

-(void)dealloc
{
    NSNotificationCenter * center = [NSNotificationCenter defaultCenter];
    [center removeObserver:self name:UIApplicationDidFinishLaunchingNotification object:nil];
    [center removeObserver:self name:MCERegisteredNotification object:nil];
    [center removeObserver:self name:MCERegistrationChangedNotification object:nil];
    [center removeObserver:self name:MCEEventSuccess object:nil];
    [center removeObserver:self name:MCEEventFailure object:nil];
    [center removeObserver:self name:SetUserAttributesError object:nil];
    [center removeObserver:self name:SetUserAttributesSuccess object:nil];
    [center removeObserver:self name:UpdateUserAttributesError object:nil];
    [center removeObserver:self name:UpdateUserAttributesSuccess object:nil];
    [center removeObserver:self name:DeleteUserAttributesError object:nil];
    [center removeObserver:self name:DeleteUserAttributesSuccess object:nil];
    [center removeObserver:self name:SetChannelAttributesError object:nil];
    [center removeObserver:self name:SetChannelAttributesSuccess object:nil];
    [center removeObserver:self name:UpdateChannelAttributesError object:nil];
    [center removeObserver:self name:UpdateChannelAttributesSuccess object:nil];
    [center removeObserver:self name:DeleteChannelAttributesError object:nil];
    [center removeObserver:self name:DeleteChannelAttributesSuccess object:nil];
    [center removeObserver:self name:MCECustomPushNotYetRegistered object:nil];
    [center removeObserver:self name:MCECustomPushNotRegistered object:nil];
}

// if this is iOS 8 then the user notification event goes here
- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings
{
    [MCEEventService.sharedInstance sendPushEnabledEvent];
}

-(void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
    [[MCESdk sharedInstance] deviceTokenRegistrationFailed];
}

-(void) application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
    
    // if this is iOS 7 then the user notification event goes here, else it'll show up in application:didRegisterUserNotificationSettings: above
    if(![application respondsToSelector:@selector(registerUserNotificationSettings:)])
    {
        [MCEEventService.sharedInstance sendPushEnabledEvent];
    }
    
    [[MCESdk sharedInstance]registerDeviceToken:deviceToken];
    NSLog(@"deviceToken: %@", [MCEApiUtil deviceToken: [MCERegistrationDetails.sharedInstance pushToken]]);
}

-(BOOL)executeCategory: (NSDictionary *)response
{
    NSString * category = response[@"payload"][@"aps"][@"category"];
    NSUserDefaults * defaults = [NSUserDefaults standardUserDefaults];
    NSMutableSet * categories = [NSMutableSet setWithArray: [defaults arrayForKey: @"categoryRegistry"]];
    
    if(self.plugin && [self.plugin executeCategoryCallback: response])
    {
        NSLog(@"sending to app");
        return TRUE;
    }
    else if (categories && [categories containsObject:category])
    {
        NSLog(@"queue");
        // queue response
        [[MCECallbackDatabaseManager sharedInstance] insertCallback: @"queuedCategories" dictionary: response];
        return TRUE;
    }
    
    return FALSE;
}

// This is where remote notifications with categories get delivered to iOS8+ when a choice is made
- (void)application:(UIApplication *)application handleActionWithIdentifier:(NSString *)identifier forRemoteNotification:(NSDictionary *)userInfo completionHandler:(void (^)())completionHandler
{
    [[MCEInAppManager sharedInstance] processPayload: userInfo];
    
    [self executeCategory:@{@"payload":userInfo, @"identifier": identifier}];
    [[MCESdk sharedInstance] processCategoryNotification: userInfo identifier:identifier];
    completionHandler();
}

// This is where remote notifications get delivered for iOS7 or iOS8+ without categories or when choice is not made
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
{
    [[MCEInAppManager sharedInstance] processPayload: userInfo];
    
    if(![self executeCategory:@{@"payload":userInfo}])
    {
        [[MCESdk sharedInstance] performNotificationAction: userInfo];
    }
}

// This is where the silent notifications get delivered OR when notifications are delievered when app is open.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
    [[MCEInAppManager sharedInstance] processPayload: userInfo];
    
    NSLog(@"This is where remote notifications get delivered for iOS when didReceiveRemoteNotification:fetchCompletionHandler: is defined.");
    [[MCESdk sharedInstance] presentDynamicCategoryNotification: userInfo];
    completionHandler(UIBackgroundFetchResultNewData);
}


// This is where marketer defined categories get delivered on iOS 7 or iOS 8 when choice isn't made (even when app is open!)
- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
{
    NSLog(@"This is where dynamic categories get delivered on iOS 7 or iOS 8 when choice isn't made");
    [[MCESdk sharedInstance] performNotificationAction: notification.userInfo];
}

// This is where dynamic categories get delivered on iOS 8+ when a choice is made
- (void)application:(UIApplication *)application handleActionWithIdentifier:(NSString *)identifier forLocalNotification:(UILocalNotification *)notification completionHandler:(void (^)())completionHandler
{
    [[MCESdk sharedInstance] processDynamicCategoryNotification: notification.userInfo identifier:identifier userText:nil];
    completionHandler();
}

-(BOOL)needsRegistration
{
    return [[NSUserDefaults standardUserDefaults] boolForKey:@"NeedRegistration"];
}

-(void)setNeedsRegistration:(BOOL)value
{
    [[NSUserDefaults standardUserDefaults] setBool:value forKey:@"NeedRegistration"];
}

-(MCEPlugin*)plugin
{
    return objc_getAssociatedObject(self, @"MCEPlugin");
}

-(void)setPlugin:(MCEPlugin*)sender
{
    objc_setAssociatedObject(self, @"MCEPlugin", sender, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

@end
