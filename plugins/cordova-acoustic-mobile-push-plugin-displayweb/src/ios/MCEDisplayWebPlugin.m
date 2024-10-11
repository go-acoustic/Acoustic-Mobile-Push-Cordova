/*
 * Copyright (C) 2024 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

#import "MCEDisplayWebPlugin.h"
#import "WebViewController.h"

@implementation MCEDisplayWebPlugin

+ (instancetype)sharedInstance
{
    static id sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[self alloc] init];
    });
    return sharedInstance;
}

-(void)performAction:(NSDictionary*)action payload:(NSDictionary*)payload
{
    WebViewController * viewController = [[WebViewController alloc] initWithURL:[NSURL URLWithString:action[@"value"][@"url"]]];
    viewController.payload=payload;
    UIWindow * window = [[MCESdk sharedInstance] getAppWindow];
    [window.rootViewController presentViewController:viewController animated:TRUE completion:nil];
}

+(void)registerPlugin
{
    MCEActionRegistry * registry = [MCEActionRegistry sharedInstance];
    [registry registerTarget: [self sharedInstance] withSelector:@selector(performAction:payload:) forAction: @"displayWebView"];
}

@end
