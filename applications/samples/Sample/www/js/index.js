/*
 * Copyright © 2015, 2019 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */

// Geofence Page

function updateLocationStatus() {
    MCEGeofencePlugin.geofenceEnabled(function (status) {
        console.log("Update Geofence Status");

        if (status) {
            MCELocationPlugin.locationAuthorization(function (status) {
                $("#geofences .status")
                    .removeClass("delayed")
                    .removeClass("disabled")
                    .removeClass("enabled");
                if (status == 0) {
                    $("#geofences .status")
                        .html("DELAYED (touch to enable)")
                        .addClass("delayed");
                } else if (status == -1) {
                    $("#geofences .status").html("DENIED").addClass("disabled");
                } else if (status == -2) {
                    $("#geofences .status")
                        .html("FOREGROUND (touch to enable)")
                        .addClass("delayed");
                } else if (status == 1) {
                    $("#geofences .status").html("ENABLED").addClass("enabled");
                }
            });
        } else $("#geofences .status").html("DISABLED").addClass("disabled");
    });
}

function setupLocationPage() {
    if (
        typeof MCELocationPlugin == "undefined" ||
        typeof MCEGeofencePlugin == "undefined"
    ) {
        $("#geofenceButton").hide();
        return;
    }

    $("#geofences .status").click(function () {
        MCELocationPlugin.manualLocationInitialization();
    });

    MCELocationPlugin.setLocationAuthorizationCallback(function () {
        updateBeaconStatus();
        updateLocationStatus();
    });

    $("#geofences").on("pagebeforeshow", function () {
        updateLocationStatus();
    });

    updateLocationStatus();
    MCEGeofencePlugin.geofencesNear(function (geofences) {}, 10, 10, 1000);

    MCELocationPlugin.setLocationUpdatedCallback(function () {
        $(document).trigger("locationUpdate");
    });

    $(document).on("pageshow", "#geofences", function (e, data) {
        setTimeout(function () {
            var map = new google.maps.Map(document.getElementById("map"), {
                zoom: 15,
            });

            var mappedCircles = {};

            function updateGeofences(geolocate) {
                var newGeofences = new Set();
                MCEGeofencePlugin.geofencesNear(
                    function (geofences) {
                        geofences.forEach(function (geofence) {
                            var key = JSON.stringify(geofence);
                            newGeofences.add(key);
                            if (!mappedCircles[key]) {
                                mappedCircles[key] = new google.maps.Circle({
                                    strokeColor: "#0000FF",
                                    strokeOpacity: 0.8,
                                    strokeWeight: 2,
                                    fillColor: "#0000FF",
                                    fillOpacity: 0.35,
                                    map: map,
                                    center: new google.maps.LatLng(
                                        geofence.latitude,
                                        geofence.longitude
                                    ),
                                    radius: geofence.radius,
                                });
                            }
                        });

                        var deleteMaps = [];
                        for (key in mappedCircles) {
                            if (!newGeofences.has(key)) {
                                mappedCircles[key].setMap(null);
                                deleteMaps.push(key);
                            }
                        }

                        deleteMaps.forEach(function (map) {
                            delete mappedCircles[map];
                        });
                    },
                    geolocate.lat(),
                    geolocate.lng(),
                    1000
                );
            }

            var lastLocation;

            $(document).on("locationUpdate", function () {
                updateGeofences(lastLocation);
            });

            navigator.geolocation.getCurrentPosition(function (position) {
                var geolocate = new google.maps.LatLng(
                    position.coords.latitude,
                    position.coords.longitude
                );
                lastLocation = geolocate;
                var currentLocation = new google.maps.Marker({
                    position: new google.maps.LatLng(
                        position.coords.latitude,
                        position.coords.longitude
                    ),
                    icon: "images/blue.png",
                    map: map,
                });

                updateGeofences(geolocate);
                map.setCenter(geolocate);

                var autoCenter = true;
                $("#gps_refresh").click(function () {
                    MCELocationPlugin.syncLocations();
                });

                $("#gps_button")
                    .css("opacity", 1)
                    .click(function () {
                        autoCenter = !autoCenter;
                        if (autoCenter) {
                            $("#gps_button").css("opacity", 1);
                            map.setCenter(lastLocation);
                        } else {
                            $("#gps_button").css("opacity", 0.5);
                        }
                    });

                map.addListener("drag", function () {
                    autoCenter = false;
                    $("#gps_button").css("opacity", 0.5);
                });

                navigator.geolocation.watchPosition(function (position) {
                    var geolocate = new google.maps.LatLng(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    lastLocation = geolocate;
                    if (autoCenter) {
                        map.setCenter(geolocate);
                        map.setZoom(15);
                    }
                    currentLocation.setPosition(geolocate);

                    updateGeofences(geolocate);
                });
            });
        }, 250);
    });
}

document.addEventListener(
    "backbutton",
    function () {
        if ($.mobile.activePage.is("#sample")) {
            navigator.app.exitApp();
        } else {
            navigator.app.backHistory();
        }
    },
    false
);

function updateBeaconStatus() {
    MCEBeaconPlugin.beaconEnabled(function (status) {
        console.log("Update Beacon Status");
        if (status) {
            MCELocationPlugin.locationAuthorization(function (status) {
                $("#beacons .status")
                    .removeClass("delayed")
                    .removeClass("disabled")
                    .removeClass("enabled");
                if (status == 0) {
                    $("#beacons .status")
                        .html("DELAYED (touch to enable)")
                        .addClass("delayed");
                } else if (status == -1) {
                    $("#beacons .status").html("DENIED").addClass("disabled");
                } else if (status == -2) {
                    $("#beacons .status")
                        .html("FOREGROUND (touch to enable)")
                        .addClass("delayed");
                } else if (status == 1) {
                    $("#beacons .status").html("ENABLED").addClass("enabled");
                }
            });
        } else $("#beacons .status").html("DISABLED").addClass("disabled");
    });
}

function setupBeaconPage() {
    if (
        typeof MCELocationPlugin == "undefined" ||
        typeof MCEBeaconPlugin == "undefined"
    ) {
        $("#beaconButton").hide();
        return;
    }

    var lastRegions = [];
    var beaconStatus = {};

    $("#beacons").on("pagebeforeshow", function () {
        updateBeaconStatus();
    });

    $("#beacon_refresh").click(function () {
        MCELocationPlugin.syncLocations();
    });

    function updateBeaconRegions() {
        $("#beaconRegions").empty();
        lastRegions.forEach(function (region) {
            $("#beaconRegions").append(
                $("<li>", { class: "ui-li-static ui-body-inherit ui-grid-a" })
                    .append(
                        $("<div>", { class: "ui-block-a" }).html(region.major)
                    )
                    .append(
                        $("<div>", { class: "ui-block-b right" }).html(
                            beaconStatus[region.major]
                                ? beaconStatus[region.major]
                                : ""
                        )
                    )
            );
        });
    }

    $("#beacons .status").click(function () {
        MCELocationPlugin.manualLocationInitialization();
    });

    updateBeaconStatus();

    MCEBeaconPlugin.beaconUUID(function (uuid) {
        $("#uuid").html(uuid);
    });

    $(document).on("locationUpdate", function () {
        MCEBeaconPlugin.beaconRegions(function (regions) {
            lastRegions = regions;
            updateBeaconRegions();
        });
    });

    MCEBeaconPlugin.setBeaconEnterCallback(function (beacon) {
        beaconStatus[beacon.major] = "Entered Minor " + beacon.minor;
        updateBeaconRegions();
    });

    MCEBeaconPlugin.setBeaconExitCallback(function (beacon) {
        beaconStatus[beacon.major] = "Exited Minor " + beacon.minor;
        updateBeaconRegions();
    });

    MCEBeaconPlugin.beaconRegions(function (regions) {
        lastRegions = regions;
        updateBeaconRegions();
    });
}

function setupInboxPage() {
    if (typeof MCEInboxPlugin == "undefined") {
        $("#inboxButton").hide();
        return;
    }

    $("#inbox_refresh_button").click(function () {
        MCEInboxPlugin.syncInboxMessages();
    });

    $("head").append(
        $("<link>", {
            rel: "stylesheet",
            type: "text/css",
            href: "css/inbox.css",
        })
    );
    $("head").append(
        $("<link>", {
            rel: "stylesheet",
            type: "text/css",
            href: "css/inbox_default.css",
        })
    );
    $("head").append(
        $("<link>", {
            rel: "stylesheet",
            type: "text/css",
            href: "css/inbox_post.css",
        })
    );
}

document.addEventListener(
    "deviceready",
    function () {
        MCEPlugin.setRegisteredActionCallback(function (action, payload) {
            if (navigator.userAgent.match(/Android/)) {
                window.open(
                    "mailto:" +
                        action["value"]["recipient"] +
                        "?subject=" +
                        encodeURIComponent(action["value"]["subject"]) +
                        "&body=" +
                        encodeURIComponent(action["value"]["body"]),
                    "_system"
                );
            } else {
                cordova.plugins.email.open(
                    {
                        to: [action["value"]["recipient"]],
                        subject: action["value"]["subject"],
                        body: action["value"]["body"],
                    },
                    function () {}
                );
            }
        }, "sendEmail");

        // Replace on load
        MCEPlugin.replaceImages();

        // Listen for dark mode changes
        window
            .matchMedia("(prefers-color-scheme: dark)")
            .addListener(function (e) {
                e.matches && MCEPlugin.replaceImages();
            });

        // Listen for light mode changes
        window
            .matchMedia("(prefers-color-scheme: light)")
            .addListener(function (e) {
                e.matches && MCEPlugin.replaceImages();
            });

        MCEPlugin.getPluginVersion(function (version) {
            $("#pluginVersion span").html(version);
        });
        MCEPlugin.getSdkVersion(function (version) {
            $("#sdkVersion span").html(version);
        });

        setupLocationPage();
        FastClick.attach(document.body);
        setupInAppPage();
        setupInboxPage();
        setupDefaults();
        setupRegistrationPage();
        setupEventPage();
        setupAttributesPage();
        setupBeaconPage();
        setupCustomActionPage();
    },
    false
);

function setupCustomActionPage() {
    MCEPlugin.setActionNotRegisteredCallback(function (actionType) {
        $("#customActionStatus")
            .attr("class", "")
            .addClass("errorStatus")
            .html("Unregistered Custom Action Received: " + actionType);
    });

    MCEPlugin.setActionNotYetRegisteredCallback(function (actionType) {
        $("#customActionStatus")
            .attr("class", "")
            .addClass("warningStatus")
            .html(
                "Previously Registered Custom Action Received: " + actionType
            );
    });

    $("#customActionRegister").click(function () {
        var type = $("#customActionType").val();
        MCEPlugin.setRegisteredActionCallback(function (action, payload) {
            $("#customActionStatus")
                .attr("class", "")
                .addClass("successStatus")
                .html("Recevied push for action type: " + type);
        }, type);
        $("#customActionStatus")
            .attr("class", "")
            .addClass("successStatus")
            .html("Registered handler for action type: " + type);
    });

    $("#customActionUnregister").click(function () {
        var type = $("#customActionType").val();
        MCEPlugin.unregisterActionCallback(type);
        $("#customActionStatus")
            .attr("class", "")
            .addClass("successStatus")
            .html("Unregistered handler for action type: " + type);
    });
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return (
        s4() +
        s4() +
        "-" +
        s4() +
        "-" +
        s4() +
        "-" +
        s4() +
        "-" +
        s4() +
        s4() +
        s4()
    );
}

function setupInAppPage() {
    if (typeof MCEInAppPlugin == "undefined") {
        $("#inAppButton").hide();
        return;
    }

    $("#inapp_refresh_button").click(function () {
        MCEInAppPlugin.syncInAppMessages(function () {
            console.log("InApp messages successfully synced.");
        });
    });

    $("head").append(
        $("<link>", {
            rel: "stylesheet",
            type: "text/css",
            href: "css/inapp_media.css",
        })
    );
    $("head").append(
        $("<link>", {
            rel: "stylesheet",
            type: "text/css",
            href: "css/inapp_banner.css",
        })
    );
    $("head").append(
        $("<link>", {
            rel: "stylesheet",
            type: "text/css",
            href: "css/inapp_image.css",
        })
    );
    $("head").append(
        $("<link>", {
            rel: "stylesheet",
            type: "text/css",
            href: "css/inapp_video.css",
        })
    );

    $("#cannedInAppBannerTop").click(function () {
        var expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 1);

        var triggerDate = new Date();
        triggerDate.setDate(triggerDate.getDate() - 1);

        MCEInAppPlugin.addInAppMessage({
            inAppMessageId: guid(),
            rules: ["topBanner", "all"],
            maxViews: 5,
            template: "default",
            content: {
                orientation: "top",
                action: { type: "url", value: "https://acoustic.co" },
                text: "Canned Banner Template Text",
                icon: "note",
                color: "0077FF",
            },
            triggerDate: triggerDate.toISOString(),
            expirationDate: expirationDate.toISOString(),
        });
    });
    $("#cannedInAppBannerBottom").click(function () {
        var expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 1);

        var triggerDate = new Date();
        triggerDate.setDate(triggerDate.getDate() - 1);

        MCEInAppPlugin.addInAppMessage({
            inAppMessageId: guid(),
            rules: ["bottomBanner", "all"],
            maxViews: 5,
            template: "default",
            content: {
                action: { type: "url", value: "https://acoustic.co" },
                text: "Canned Banner Template Text",
                icon: "note",
                color: "0077FF",
            },
            triggerDate: triggerDate.toISOString(),
            expirationDate: expirationDate.toISOString(),
        });
    });
    $("#cannedInAppImage").click(function () {
        var expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 1);

        var triggerDate = new Date();
        triggerDate.setDate(triggerDate.getDate() - 1);

        MCEInAppPlugin.addInAppMessage({
            inAppMessageId: guid(),
            rules: ["image", "all"],
            maxViews: 5,
            template: "image",
            content: {
                action: { type: "url", value: "https://acoustic.co" },
                title: "Canned Image Template Title",
                text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque rhoncus, eros sed imperdiet finibus, purus nibh placerat leo, non fringilla massa tortor in tellus. Donec aliquet pharetra dui ac tincidunt. Ut eu mi at ligula varius suscipit. Vivamus quis quam nec urna sollicitudin egestas eu at elit. Nulla interdum non ligula in lobortis. Praesent lobortis justo at cursus molestie. Aliquam lectus velit, elementum non laoreet vitae, blandit tempus metus. Nam ultricies arcu vel lorem cursus aliquam. Nunc eget tincidunt ligula, quis suscipit libero. Integer velit nisi, lobortis at malesuada at, dictum vel nisi. Ut vulputate nunc mauris, nec porta nisi dignissim ac. Sed ut ante sapien. Quisque tempus felis id maximus congue. Aliquam quam eros, congue at augue et, varius scelerisque leo. Vivamus sed hendrerit erat. Mauris quis lacus sapien. Nullam elit quam, porttitor non nisl et, posuere volutpat enim. Praesent euismod at lorem et vulputate. Maecenas fermentum odio non arcu iaculis egestas. Praesent et augue quis neque elementum tincidunt. ",
                image: "https://picsum.photos/200/300",
            },
            triggerDate: triggerDate.toISOString(),
            expirationDate: expirationDate.toISOString(),
        });
    });
    $("#cannedInAppVideo").click(function () {
        var expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 1);

        var triggerDate = new Date();
        triggerDate.setDate(triggerDate.getDate() - 1);

        MCEInAppPlugin.addInAppMessage({
            inAppMessageId: guid(),
            rules: ["video", "all"],
            maxViews: 5,
            template: "video",
            content: {
                action: { type: "url", value: "http://acoustic.co" },
                title: "Canned Video Template Title",
                text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque rhoncus, eros sed imperdiet finibus, purus nibh placerat leo, non fringilla massa tortor in tellus. Donec aliquet pharetra dui ac tincidunt. Ut eu mi at ligula varius suscipit. Vivamus quis quam nec urna sollicitudin egestas eu at elit. Nulla interdum non ligula in lobortis. Praesent lobortis justo at cursus molestie. Aliquam lectus velit, elementum non laoreet vitae, blandit tempus metus. Nam ultricies arcu vel lorem cursus aliquam. Nunc eget tincidunt ligula, quis suscipit libero. Integer velit nisi, lobortis at malesuada at, dictum vel nisi. Ut vulputate nunc mauris, nec porta nisi dignissim ac. Sed ut ante sapien. Quisque tempus felis id maximus congue. Aliquam quam eros, congue at augue et, varius scelerisque leo. Vivamus sed hendrerit erat. Mauris quis lacus sapien. Nullam elit quam, porttitor non nisl et, posuere volutpat enim. Praesent euismod at lorem et vulputate. Maecenas fermentum odio non arcu iaculis egestas. Praesent et augue quis neque elementum tincidunt. ",
                video: "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4",
            },
            triggerDate: triggerDate.toISOString(),
            expirationDate: expirationDate.toISOString(),
        });
    });

    $("#inAppBannerTop").click(function () {
        MCEInAppPlugin.executeInAppRule(["topBanner"]);
    });

    $("#inAppBannerBottom").click(function () {
        MCEInAppPlugin.executeInAppRule(["bottomBanner"]);
    });

    $("#inAppImage").click(function () {
        MCEInAppPlugin.executeInAppRule(["image"]);
    });

    $("#inAppVideo").click(function () {
        MCEInAppPlugin.executeInAppRule(["video"]);
    });

    $("#inAppNext").click(function () {
        MCEInAppPlugin.executeInAppRule(["all"]);
    });
}

function animateGreen(item) {
    setTimeout(function () {
        $(item).animate(
            { "background-color": "green", "border-color": "green" },
            500,
            "swing",
            function () {
                $(item).animate(
                    {
                        "background-color": "#4e6d8d",
                        "border-color": "#4e6d8d",
                    },
                    500,
                    "swing",
                    function () {
                        $(item).attr("style", "");
                    }
                );
            }
        );
    });
}

function animateRed(item) {
    setTimeout(function () {
        $(item).animate(
            { "background-color": "red", "border-color": "red" },
            500,
            "swing",
            function () {
                $(item).animate(
                    {
                        "background-color": "#4e6d8d",
                        "border-color": "#4e6d8d",
                    },
                    500,
                    "swing",
                    function () {
                        $(item).attr("style", "");
                    }
                );
            }
        );
    });
}

function setupAttributesPage() {
    var valueType = getValueForId("value-type");
    $("#" + valueType + "-type").prop("checked", true);

    var action = getValueForId("action");
    $("#" + action + "-action").prop("checked", true);

    updateActions();

    $("input[name=action]").change(function () {
        saveValueForId("action", $(this).attr("value"));
        updateActions();
    });

    MCEPlugin.setAttributeQueueCallbacks(
        function (details) {
            console.log("attribute success");
            $("#sendAttributesStatus")
                .css({ color: "green" })
                .html(JSON.stringify(details));
            animateGreen($("#sendAttributes"));
        },
        function (error) {
            console.log("attribute failure");
            $("#sendAttributesStatus")
                .css({ color: "red" })
                .html(JSON.stringify(error));
            animateRed($("#sendAttributes"));
        }
    );

    updateValueType();
    $("[name=type]").change(function () {
        updateValueType();
    });

    $("#value")
        .click(function () {
            clickValueField();
        })
        .keypress(function (event) {
            editValueField();
        });

    $("#sendAttributes").click(function () {
        var valueType = $("[name=type]:checked").val();
        if (valueType == "bool") {
            var value = $("[name=bool-value]:checked").val() == "true";
        } else {
            var value = $("#value").val();
            if (valueType == "number") {
                value = parseFloat(value);
                if (isNaN(value)) {
                    value = 0;
                }
            } else if (valueType == "date") {
                value = Date.parse(value);
                if (isNaN(value)) {
                    value = new Date();
                } else {
                    value = new Date(value);
                }
            }
        }
        var attribute = $("#attribute").val();

        var action = getValueForId("action");
        var json = {};
        json[attribute] = value;

        if (action == "update") {
            MCEPlugin.queueUpdateUserAttributes(json);
            $("#sendAttributesStatus")
                .css({ color: "gray" })
                .html("Queued attribute update " + attribute + "=" + value);
        } else if (action == "delete") {
            MCEPlugin.queueDeleteUserAttributes([attribute]);
            $("#sendAttributesStatus")
                .css({ color: "gray" })
                .html("Queued attribute delete " + attribute);
        } else {
            console.log("unknown action value");
        }
    });
}

function editValueField() {
    var valueType = $("[name=type]:checked").val();
    if (valueType == "number") {
        if (!event.key.match(/[\d\.]/)) {
            event.preventDefault();
        }
    }
}

function updateValueType() {
    var valueType = $("[name=type]:checked").val();
    saveValueForId("value-type", valueType);
    if (valueType == "bool") {
        $("#bool-value-container").show();
        $("#value-container").hide();
    } else {
        $("#bool-value-container").hide();
        $("#value-container").show();
        if (valueType == "date") {
            var value = Date.parse($("#value"));
            if (isNaN(value)) {
                value = new Date();
            }
            $("#value").val(value.toISOString());
        } else if (valueType == "number") {
            var value = parseFloat($("#value").val());
            if (isNaN(value)) {
                value = 0;
            }
            $("#value").val(value);
        } else if (valueType == "string") {
        }
    }
}

function clickValueField() {
    $("#value").attr("type", "text");
    var type = $("[name=type]:checked").val();
    if (type == "date") {
        cordova.plugins.DateTimePicker.show({
            mode: "datetime",
            allowOldDates: true,
            allowFutureDates: true,
            okText: "Select",
            cancelText: "Cancel",
            success: function (newDate) {
                $("#value").val(newDate.toISOString());
            },
        });
    } else if (type == "number") {
        $("#value").attr("type", "number");
    }
}

function updateActions() {
    var action = getValueForId("action");
    if (action == "update") $("#value-container-container").show();
    else $("#value-container-container").hide();
}

function setupEventPage() {
    MCEPlugin.setEventQueueCallbacks(
        function (events) {
            animateGreen($("#send_click_queue"));
            console.log("event queue success");
        },
        function (events) {
            animateRed($("#send_click_queue"));
            console.log("event queue fail");
        }
    );
    $("#send_click_queue").click(function () {
        MCEPlugin.queueAddEvent({
            type: "simpleNotification",
            name: "appOpened",
            timestamp: new Date(),
        });
    });
}

function getValueForId(id) {
    var value = window.localStorage.getItem(id);
    if (value == undefined || value.length == 0)
        value = $("#" + id).attr("default");
    //console.log('getValueForId(' + id + ") = " + value)
    return value;
}

function saveValueForId(id, value) {
    window.localStorage.setItem(id, value);
    //console.log('saveValueForId(' + id + ", " + value + ")")
}

function saveValueForElement(item) {
    var id = $(item).attr("id");
    var value = undefined;
    if (item.nodeName == "INPUT") value = $(item).val();
    else if (item.nodeName == "DIV") value = $(item).html();

    //console.log('saveValueForElement(' + item + ")")
    saveValueForId(id, value);
}

function restoreValueForElement(item) {
    if (item.nodeName == "INPUT") $(item).val(getValueForElement(item));
    else if (item.nodeName == "DIV") $(item).html(getValueForElement(item));

    //console.log('restoreValueForElement(' + item + ")")
}

function getValueForElement(item) {
    var id = $(item).attr("id");
    var value = getValueForId(id);

    //console.log('getValueForElement(' + item + ") id:" + id + " = " + value)
    return value;
}

function setupDefaults() {
    $("[default]").each(function () {
        restoreValueForElement(this);
    });

    $("input[type=text]").change(function () {
        saveValueForElement(this);
    });
}

function getStandardValue() {
    var standardType = getValueForId("standardType");
    if (standardType == "url") {
        return JSON.parse(getValueForId("standardUrlValue"));
    } else if (standardType == "dial") {
        return JSON.parse(getValueForId("standardDialValue"));
    }
    return undefined;
}

function getStandardName() {
    var standardType = getValueForId("standardType");
    if (standardType == "url") {
        return getValueForId("standardUrlName");
    } else if (standardType == "dial") {
        return getValueForId("standardDialName");
    } else if (standardType == "openApp") {
        return getValueForId("standardOpenAppName");
    }
    return undefined;
}

var registrationComplete = false;

function updateRegistration(details) {
    var userId = "";
    var channelId = "";
    var status = "";
    if (
        typeof details["userId"] == "undefined" ||
        typeof details["channelId"] == "undefined"
    ) {
        registrationComplete = false;
        status = "Click to register";
        userId = "not registered";
        channelId = "not registered";
    } else {
        registrationComplete = true;
        status = "Registered";
        userId = details["userId"];
        channelId = details["channelId"];
    }
    MCEPlugin.userInvalidated(function (invalidated) {
        if (invalidated) {
            status += " (Invalidated State)";
        }
        $("#registration_status").html(status);
        $(".userId").html(userId);
        $(".channelId").html(channelId);
    });

    MCEPlugin.getAppKey(function (appKey) {
        $(".appKey").html(appKey);
    });
}

function setupRegistrationPage() {
    $("#registration_status").click(function () {
        if (!registrationComplete) {
            $("#registration_status").html("Registering");
            MCEPlugin.manualInitialization();
        }
    });
    MCEPlugin.setRegistrationCallback(function (details) {
        updateRegistration(details);
    });

    MCEPlugin.getRegistrationDetails(function (details) {
        updateRegistration(details);
    });

    MCEPlugin.getAppKey(function (appKey) {
        $(".appKey").html(appKey);
    });
}
