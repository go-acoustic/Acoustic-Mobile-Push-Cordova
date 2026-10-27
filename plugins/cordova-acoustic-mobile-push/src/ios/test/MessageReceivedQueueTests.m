/*
 * Copyright (C) 2026 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

// Tests of the queue behind MCEPlugin setMessageReceivedCallback: the pushes that arrive while no JavaScript
// callback is registered. The queue keeps the newest 50 messages, and removeMessageReceivedCallback clears the
// "used" flag and deletes what was queued. The tests run inside the Cordova app (hosted tests) against the real
// callback database of the SDK, and reach the plugin classes at runtime so that no Cordova header is needed.
// Run them with plugins/run_ios_unit_tests.sh.

#import <XCTest/XCTest.h>
#import <AcousticMobilePush/AcousticMobilePush.h>

static NSString * const kUsedKey = @"co.acoustic.mobile.push.messageReceivedUsed";
static NSString * const kQueueName = @"messageReceived";
static const NSUInteger kMaxQueued = 50;

// The methods of the plugin classes that the tests call
@interface NSObject (MCEMessageReceivedTests)
- (void)messageReceived:(NSDictionary *)userInfo;
- (void)removeMessageReceivedCallback:(id)command;
@end

@interface MessageReceivedQueueTests : XCTestCase
@property (nonatomic, strong) id appDelegate;
@property (nonatomic, strong) id plugin;
@end

@implementation MessageReceivedQueueTests

- (void)setUp
{
    Class delegateClass = NSClassFromString(@"AppDelegate");
    Class pluginClass = NSClassFromString(@"MCEPlugin");
    XCTAssertNotNil(delegateClass, @"AppDelegate is not in the host app");
    XCTAssertNotNil(pluginClass, @"MCEPlugin is not in the host app");
    self.appDelegate = [[delegateClass alloc] init];
    self.plugin = [[pluginClass alloc] init];
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:kUsedKey];
    [self clearQueue];
}

- (void)tearDown
{
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:kUsedKey];
    [self clearQueue];
}

// A push whose payload value is the given number, as the SDK passes it to the app delegate
- (NSDictionary *)pushNumber:(NSInteger)number
{
    return @{@"notification-action": @{@"type": @"test", @"value": [NSString stringWithFormat:@"%ld", (long)number]},
             @"aps": @{@"content-available": @1}};
}

// The queued messages in the order the database returns them, with their ids
- (NSArray *)queuedValues:(NSArray **)idsOut
{
    __block NSArray * values = @[];
    __block NSArray * ids = @[];
    XCTestExpectation * done = [self expectationWithDescription:@"select"];
    [[MCECallbackDatabaseManager sharedInstance] selectCallbacks:kQueueName withBlock:^(NSArray * dictionaries, NSArray * callbackIds) {
        NSMutableArray * collected = [NSMutableArray array];
        for (NSDictionary * dictionary in dictionaries) {
            [collected addObject:dictionary[@"payload"] ?: @""];
        }
        values = collected;
        ids = callbackIds;
        [done fulfill];
    }];
    [self waitForExpectations:@[done] timeout:10];
    if (idsOut) {
        *idsOut = ids;
    }
    return values;
}

- (void)clearQueue
{
    NSArray * ids = nil;
    [self queuedValues:&ids];
    if ([ids count]) {
        [[MCECallbackDatabaseManager sharedInstance] deleteCallbacksById:ids];
        [self waitUntilQueueHas:0 timeout:10];
    }
}

// The database is written on its own queue: poll until it holds the expected number of messages
- (BOOL)waitUntilQueueHas:(NSUInteger)count timeout:(NSTimeInterval)timeout
{
    NSDate * end = [NSDate dateWithTimeIntervalSinceNow:timeout];
    while ([end timeIntervalSinceNow] > 0) {
        if ([[self queuedValues:nil] count] == count) {
            return YES;
        }
        [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.2]];
    }
    return [[self queuedValues:nil] count] == count;
}

// Nothing is kept until the app has registered the callback once
- (void)testPushIsNotKeptWhenTheCallbackWasNeverUsed
{
    [self.appDelegate messageReceived:[self pushNumber:1]];
    [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:1]];
    XCTAssertEqual([[self queuedValues:nil] count], 0u);
}

// More pushes than the limit: the queue keeps the newest ones, oldest first
- (void)testQueueKeepsTheNewestMessages
{
    [[NSUserDefaults standardUserDefaults] setBool:YES forKey:kUsedKey];
    NSInteger sent = kMaxQueued + 5;
    for (NSInteger number = 1; number <= sent; number++) {
        [self.appDelegate messageReceived:[self pushNumber:number]];
    }
    XCTAssertTrue([self waitUntilQueueHas:kMaxQueued timeout:15], @"the queue should settle at the limit");

    NSArray * values = [self queuedValues:nil];
    XCTAssertEqual([values count], kMaxQueued);
    XCTAssertEqualObjects(values.firstObject, @"6", @"the 5 oldest pushes are dropped");
    NSString * newest = [NSString stringWithFormat:@"%ld", (long)sent];
    XCTAssertEqualObjects(values.lastObject, newest, @"the newest push is kept");
}

// Exactly at the limit nothing is dropped
- (void)testQueueAtTheLimitDropsNothing
{
    [[NSUserDefaults standardUserDefaults] setBool:YES forKey:kUsedKey];
    for (NSInteger number = 1; number <= (NSInteger)kMaxQueued; number++) {
        [self.appDelegate messageReceived:[self pushNumber:number]];
    }
    XCTAssertTrue([self waitUntilQueueHas:kMaxQueued timeout:15]);
    [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:1]];
    NSArray * values = [self queuedValues:nil];
    XCTAssertEqual([values count], kMaxQueued);
    XCTAssertEqualObjects(values.firstObject, @"1");
}

// removeMessageReceivedCallback deletes what was queued and clears the flag, so later pushes are not kept
- (void)testRemoveDeletesTheQueueAndStopsKeepingMessages
{
    [[NSUserDefaults standardUserDefaults] setBool:YES forKey:kUsedKey];
    for (NSInteger number = 1; number <= 3; number++) {
        [self.appDelegate messageReceived:[self pushNumber:number]];
    }
    XCTAssertTrue([self waitUntilQueueHas:3 timeout:10]);

    [self.plugin removeMessageReceivedCallback:nil];

    XCTAssertTrue([self waitUntilQueueHas:0 timeout:10], @"the kept messages are deleted");
    XCTAssertFalse([[NSUserDefaults standardUserDefaults] boolForKey:kUsedKey], @"the flag is cleared");

    [self.appDelegate messageReceived:[self pushNumber:4]];
    [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:1]];
    XCTAssertEqual([[self queuedValues:nil] count], 0u, @"nothing is kept after the remove");
}

@end
