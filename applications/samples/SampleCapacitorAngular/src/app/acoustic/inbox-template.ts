/*
 * Copyright (C) 2026 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any
 * intellectual or industrial property rights of Acoustic, L.P. except as may
 * be provided in an agreement with Acoustic, L.P. Any unauthorized copying or
 * distribution of content from this file is prohibited.
 */

import { InboxMessage } from './acoustic-campaign';

/**
 * An inbox message comes in two shapes. A traditional message keeps its title in `content.messagePreview` and the
 * finished HTML in `content.messageDetails.richContent`. A template message (image, video and so on) keeps the
 * data in `content` (`header`, `subHeader`, `headerImage`, `contentImage` or `contentVideo`, `contentText`,
 * `actions`) and has no HTML: the default Inbox screen of the plugin builds it from the template. These helpers
 * read both shapes so that the list and the message page work for every message.
 */

export function inboxSubject(message: InboxMessage): string {
    const content = message['content'];
    return content?.messagePreview?.subject ?? content?.header ?? message['subject'] ?? '';
}

export function inboxPreview(message: InboxMessage): string {
    const content = message['content'];
    return content?.messagePreview?.previewContent ?? content?.subHeader ?? message['preview'] ?? '';
}

/** The HTML of the message: the rich content when there is one, otherwise the template content drawn here. */
export function inboxHtml(message: InboxMessage): string {
    const content = message['content'] ?? {};
    const richContent = content.messageDetails?.richContent;
    if (typeof richContent === 'string' && richContent.length > 0) {
        return richContent;
    }
    return templateHtml(content);
}

const ESCAPES: { [character: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

function escape(value: unknown): string {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ESCAPES[character]);
}

/** Only http(s) addresses are used for media; anything else is dropped. */
function mediaUrl(value: unknown): string {
    return /^https?:\/\//i.test(String(value ?? '')) ? escape(value) : '';
}

function templateHtml(content: { [key: string]: any }): string {
    const headerImage = mediaUrl(content['headerImage']);
    const video = mediaUrl(content['contentVideo']);
    const image = mediaUrl(content['contentImage']);
    const actions: any[] = Array.isArray(content['actions']) ? content['actions'] : [];

    let html =
        '<meta name="color-scheme" content="light dark">' +
        '<style>' +
        'body{font:16px system-ui,sans-serif;margin:0;padding:12px}' +
        'img,video{max-width:100%;display:block;margin:12px auto}' +
        '.head{display:flex;align-items:center;gap:12px}' +
        '.headerImage{width:48px;height:48px;margin:0;object-fit:cover}' +
        '.title{font-size:1.2em;font-weight:bold}' +
        '.subtitle{opacity:.7}' +
        '.text{margin:12px 0}' +
        '.actions{display:flex;flex-wrap:wrap;gap:16px;margin-top:16px}' +
        'a{color:#706cff;cursor:pointer;text-decoration:underline}' +
        '</style>';
    html += '<div class="head">';
    if (headerImage) {
        html += '<img class="headerImage" src="' + headerImage + '">';
    }
    html +=
        '<div><div class="title">' + escape(content['header']) + '</div>' +
        '<div class="subtitle">' + escape(content['subHeader']) + '</div></div></div>';
    if (video) {
        html += '<video controls playsinline preload="metadata" src="' + video + '"></video>';
    } else if (image) {
        html += '<img class="contentImage" src="' + image + '">';
    }
    if (content['contentText']) {
        html += '<div class="text">' + escape(content['contentText']) + '</div>';
    }
    if (actions.length > 0) {
        html += '<div class="actions">';
        for (const action of actions) {
            // the message page reads this attribute when the link is tapped and runs it with executeInboxAction
            html += '<a action="' + escape(JSON.stringify(action)) + '">' + escape(action?.name) + '</a>';
        }
        html += '</div>';
    }
    return html;
}
