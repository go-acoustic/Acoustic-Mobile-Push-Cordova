/*
 * Copyright (C) 2024 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

#import "WebViewController.h"
#import <AcousticMobilePush/AcousticMobilePush.h>

@interface WebViewController ()

@end

@implementation WebViewController

-(instancetype)initWithURL:(NSURL*)url;
{
    if(self=[super init])
    {
        const NSInteger toolbarHeight = 44;
        UIScreen * screen = [UIScreen mainScreen];
        NSInteger statusHeight = [UIApplication sharedApplication].statusBarFrame.size.height;
        NSInteger webVerticalOffset = statusHeight + toolbarHeight;
        
        CGRect toolbarFrame = screen.bounds;
        toolbarFrame.size.height = toolbarHeight;
        toolbarFrame.origin.y = statusHeight;
        
        UIToolbar * toolbar = [[UIToolbar alloc] initWithFrame: toolbarFrame];
        [self.view addSubview:toolbar];
        
        UIBarButtonItem * dismiss = [[UIBarButtonItem alloc]initWithBarButtonSystemItem:UIBarButtonSystemItemDone target:self action: @selector(dismiss:)];
        toolbar.items = @[dismiss];
        
        CGRect webFrame = screen.bounds;
        webFrame.origin.y += webVerticalOffset;
        webFrame.size.height -= webVerticalOffset;
        
        WKWebView * webView = [[WKWebView alloc] initWithFrame:webFrame];
        [webView loadRequest: [NSURLRequest requestWithURL: url]];
        [self.view addSubview:webView];
        webView.navigationDelegate = self;
        
        self.view.backgroundColor = [UIColor whiteColor];
    }
    return self;
}

- (BOOL)webView:(WKWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(WKNavigationType)navigationType
{
    NSLog(@"url: %@", request.URL);
    if([request.URL.scheme isEqual:@"action"])
    {
        int index = [request.URL.lastPathComponent intValue];
        if(self.payload && self.payload[@"web-actions"] && [self.payload[@"web-actions"] count]>=index)
        {
            NSDictionary * action = self.payload[@"web-actions"][index];
            [[MCEActionRegistry sharedInstance] performAction:action forPayload:self.payload source:SimpleNotificationSource attributes:nil userText:nil];
        }
        
        return FALSE;
    }
    return TRUE;
}

-(IBAction)dismiss:(id)sender
{
    [self dismissViewControllerAnimated:TRUE completion:nil];
}

@end
