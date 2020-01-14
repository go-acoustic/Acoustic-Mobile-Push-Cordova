/*
 * Copyright © 2014, 2019 Acoustic, L.P. All rights reserved.
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

-(void)performAction:(NSDictionary*)action payload:(NSDictionary*)payload
{
    WebViewController * viewController = [[WebViewController alloc] initWithURL:[NSURL URLWithString:action[@"value"]]];
    viewController.payload=payload;
    UIWindow * window = [[UIApplication sharedApplication] keyWindow];
    [window.rootViewController presentViewController:viewController animated:TRUE completion:nil];
}

- (void)pluginInitialize
{
    MCEActionRegistry * registry = [MCEActionRegistry sharedInstance];
    [registry registerTarget: self withSelector:@selector(performAction:payload:) forAction: @"displayWebView"];
}

@end
