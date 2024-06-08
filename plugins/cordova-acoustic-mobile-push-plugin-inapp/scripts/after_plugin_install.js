﻿/*
 * Copyright © 2015, 2019 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

var filestocopy = [
  'css/inapp_media.css',
  'css/inapp_banner.css',
  'css/inapp_image.css',
  'css/inapp_video.css',

  'images/inApp/cancel-light.png',
  'images/inApp/cancel-light@2x.png',
  'images/inApp/cancel-light@3x.png',
  'images/inApp/cancel.png',
  'images/inApp/cancel@2x.png',
  'images/inApp/cancel@3x.png',
  'images/inApp/comment.png',
  'images/inApp/comment@2x.png',
  'images/inApp/comment@3x.png',
  'images/inApp/dismiss-light.png',
  'images/inApp/dismiss-light@2x.png',
  'images/inApp/dismiss-light@3x.png',
  'images/inApp/dismiss.png',
  'images/inApp/dismiss@2x.png',
  'images/inApp/dismiss@3x.png',
  'images/inApp/handle-light.png',
  'images/inApp/handle-light@2x.png',
  'images/inApp/handle-light@3x.png',
  'images/inApp/handle.png',
  'images/inApp/handle@2x.png',
  'images/inApp/handle@3x.png',
  'images/inApp/note-light.png',
  'images/inApp/note-light@2x.png',
  'images/inApp/note-light@3x.png',
  'images/inApp/note.png',
  'images/inApp/note@2x.png',
  'images/inApp/note@3x.png',
  'images/inApp/notification.png',
  'images/inApp/notification@2x.png',
  'images/inApp/notification@3x.png',
  'images/inApp/offer.png',
  'images/inApp/offer@2x.png',
  'images/inApp/offer@3x.png',
  'images/inApp/store.png',
  'images/inApp/store@2x.png',
  'images/inApp/store@3x.png',
];

var fs = require('fs');
var path = require('path');

var rootdir = path.join(process.env.PWD, 'plugins', 'cordova-acoustic-mobile-push-plugin-inapp', 'assets');

filestocopy.forEach(function (val) {
  var srcfile = path.join(rootdir, val);
  var destfile = path.join(process.env.PWD, 'www', val);
  var destdir = path.dirname(destfile);

  if (!fs.existsSync(destdir)) {
    fs.mkdirSync(destdir);
  }

  if (fs.existsSync(srcfile)) {
    fs.createReadStream(srcfile).pipe(fs.createWriteStream(destfile));
  } else {
    console.error('Could not find source file ' + srcfile);
  }
});
