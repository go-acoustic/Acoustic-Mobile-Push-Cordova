"use strict";
/*
 * Copyright © 2015, 2019 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var MCEInboxPlugin_1 = __importDefault(require("./MCEInboxPlugin"));
var MCEInbox;
(function (MCEInbox) {
    var inboxRegistry = {};
    var inboxMessages = [];
    MCEInbox.setInboxRegistry = function (name, handlers) {
        inboxRegistry[name] = handlers;
    };
    MCEInbox.openInboxMessage = function (inboxMessage) {
        MCEPlugin.queueAddEvent({
            type: "inbox",
            name: "messageOpened",
            timestamp: new Date(),
            attributes: {
                richContentId: inboxMessage.richContentId,
                inboxMessageId: inboxMessage.inboxMessageId,
                attribution: inboxMessage.attribution,
                mailingId: inboxMessage.mailingId,
            },
        });
        jQuery("#inboxMessageContent").attr("inboxMessageId", inboxMessage["inboxMessageId"]);
        MCEInboxPlugin_1.default.readMessageId(inboxMessage["inboxMessageId"]);
        var messageElem = jQuery("#inboxMessages div[inboxMessageId=" + inboxMessage["inboxMessageId"] + "] .titleOrSubject");
        messageElem.addClass('old');
        inboxMessage["expirationDate"] =
            new Date(inboxMessage["expirationDate"]).getTime() / 1000;
        inboxMessage["sendDate"] =
            new Date(inboxMessage["sendDate"]).getTime() / 1000;
        var template = inboxMessage["template"];
        var html = inboxRegistry[template]["display"](inboxMessage);
        jQuery("#inboxMessageContent").html(html);
        jQuery.mobile.changePage("#inboxMessage", { transition: "slide" });
        var inboxMessageId = inboxMessage["inboxMessageId"];
        var messageIndex = MCEInbox.findMessageIndex(inboxMessageId);
        jQuery("#down_button").css("opacity", 1);
        jQuery("#up_button").css("opacity", 1);
        if (messageIndex == 0)
            jQuery("#up_button").css("opacity", 0.5);
        if (messageIndex == inboxMessages.length - 1)
            jQuery("#down_button").css("opacity", 0.5);
        jQuery("#inboxMessageContent a").attr("inboxMessageId", inboxMessage["inboxMessageId"]);
        jQuery("#inboxMessageContent a").click(function () {
            var parts = jQuery(this).attr("href").split(":");
            if (parts[0].toLowerCase() == "actionid") {
                var actions = inboxRegistry[template]["actions"](inboxMessage);
                var action = actions[parts[1]];
                MCEInboxPlugin_1.default.executeInboxAction(action, jQuery(this).attr("inboxMessageId"));
                return false;
            }
            return true;
        });
    };
    MCEInbox.findMessageIndex = function (inboxMessageId) {
        var messageIndex = 0;
        for (var i = 0; i < inboxMessages.length; i++) {
            var inboxMessage = inboxMessages[i];
            if (inboxMessageId == inboxMessage["inboxMessageId"])
                messageIndex = i;
        }
        return messageIndex;
    };
    document.addEventListener("deviceready", function () {
        // Default inbox UI requires jQuery, and either jQuery Mobile or an #inboxMessages container on the page.
        // Apps without them (for example an Angular app that loads jQuery for the in-app templates) use
        // MCEInboxPlugin directly.
        if (typeof jQuery === "undefined" || (!jQuery.mobile && !jQuery("#inboxMessages").length)) {
            return;
        }
        jQuery(document).on("click", "#inboxMessages [inboxMessageId] [open]", function (event) {
            var inboxMessageId = jQuery(this)
                .parents("[inboxMessageId]")
                .attr("inboxMessageId");
            MCEInboxPlugin_1.default.fetchInboxMessageId(inboxMessageId, function (inboxMessage) {
                MCEInbox.openInboxMessage(inboxMessage);
            });
        });
        jQuery("#up_button").click(function () {
            var inboxMessageId = jQuery("#inboxMessageContent").attr("inboxMessageId");
            var messageIndex = MCEInbox.findMessageIndex(inboxMessageId);
            if (messageIndex > 0)
                messageIndex--;
            MCEInbox.openInboxMessage(inboxMessages[messageIndex]);
        });
        jQuery("#down_button").click(function () {
            var inboxMessageId = jQuery("#inboxMessageContent").attr("inboxMessageId");
            var messageIndex = MCEInbox.findMessageIndex(inboxMessageId);
            if (messageIndex < inboxMessages.length - 1)
                messageIndex++;
            MCEInbox.openInboxMessage(inboxMessages[messageIndex]);
        });
        jQuery("#delete_button").click(function () {
            var inboxMessageId = jQuery("#inboxMessageContent").attr("inboxMessageId");
            jQuery("#inboxMessages div[inboxMessageId=" + inboxMessageId + "]").hide(400);
            MCEInboxPlugin_1.default.deleteMessageId(inboxMessageId);
            if (navigator.userAgent.match(/iPad/i) ||
                navigator.userAgent.match(/iPhone/i) ||
                navigator.userAgent.match(/iPod/i)) {
                jQuery.mobile.changePage("#inbox", {
                    transition: "slide",
                    reverse: true,
                });
            }
            else {
                // Not sure what library adds navigator.app, but it's non-standard.
                // @ts-ignore
                navigator.app.backHistory();
            }
            var messageIndex = MCEInbox.findMessageIndex(inboxMessageId);
            inboxMessages.splice(messageIndex, 1);
            if (inboxMessages.length == 0) {
                jQuery("#inboxMessages").append(jQuery("<div>", { class: "emptyInbox" }).html("Inbox has no messages."));
            }
            jQuery("#inboxMessageContent").html("");
        });
        jQuery("#refresh_button").click(function () {
            MCEInboxPlugin_1.default.syncInboxMessages();
        });
        MCEPlugin.setRegisteredActionCallback(function (action, payload) {
            MCEInboxPlugin_1.default.fetchInboxMessageId(action["inboxMessageId"], function (inboxMessage) {
                MCEInbox.openInboxMessage(inboxMessage);
            });
        }, "openInboxMessage");
        // Before starting sync, setup the handler for the sync callback
        MCEInboxPlugin_1.default.setInboxMessagesUpdateCallback(function (newInboxMessages) {
            inboxMessages = newInboxMessages;
            var scrollPosition = jQuery("body").scrollTop();
            // Smoother refresh, cache html of message
            var inboxMessageCache = {};
            for (var i = 0; i < inboxMessages.length; i++) {
                var inboxMessage = inboxMessages[i];
                var inboxMessageId = inboxMessage["inboxMessageId"];
                inboxMessageCache[inboxMessageId] = jQuery("#inboxMessages div[inboxMessageId=" + inboxMessageId + "]").html();
            }
            jQuery("#inboxMessages").html("");
            if (inboxMessages.length == 0) {
                jQuery("#inboxMessages").append(jQuery("<div>", { class: "emptyInbox" }).html("Inbox has no messages."));
            }
            for (var i = 0; i < inboxMessages.length; i++) {
                var inboxMessage = inboxMessages[i];
                inboxMessage["expirationDate"] = new Date(inboxMessage["expirationDate"]).getTime();
                inboxMessage["sendDate"] = new Date(inboxMessage["sendDate"]).getTime();
                var inboxMessageId = inboxMessage["inboxMessageId"];
                var template = inboxMessage["template"];
                // Smoother refresh, use cached html instead of just "loading"
                var preview = inboxMessageCache[inboxMessageId]
                    ? inboxMessageCache[inboxMessageId]
                    : "<div>Loading...</div>";
                jQuery("#inboxMessages").append("<div index='" +
                    i +
                    "' class='messagePreview " +
                    template +
                    "Preview' inboxMessageId='" +
                    inboxMessageId +
                    "'>" +
                    preview +
                    "</div>");
                // This will delay loading of the content until the div is scrolled into view.
                // Alternatively, you could just disable the outer block and load the contents immediately.
                jQuery("#inboxMessages [inboxMessageId=" + inboxMessageId + "]").one("inview", function (event, visible) {
                    var i = jQuery(this).attr("index");
                    var inboxMessage = inboxMessages[i];
                    var inboxMessageId = jQuery(this).attr("inboxMessageId");
                    var template = inboxMessage["template"];
                    var html = inboxRegistry[template]["preview"](inboxMessage);
                    jQuery("#inboxMessages div[inboxMessageId=" +
                        inboxMessageId +
                        "]").html(html);
                });
            }
            jQuery("body").scrollTop(scrollPosition);
        });
        MCEInboxPlugin_1.default.syncInboxMessages();
    });
})(MCEInbox || (MCEInbox = {}));
module.exports = MCEInbox;
