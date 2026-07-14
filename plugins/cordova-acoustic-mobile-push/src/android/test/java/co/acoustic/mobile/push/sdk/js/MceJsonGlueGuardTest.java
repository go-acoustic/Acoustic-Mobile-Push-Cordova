/*
 * Copyright (C) 2026 Acoustic, L.P. All rights reserved.
 *
 * NOTICE: This file contains material that is confidential and proprietary to
 * Acoustic, L.P. and/or other developers. No license is granted under any intellectual or
 * industrial property rights of Acoustic, L.P. except as may be provided in an agreement with
 * Acoustic, L.P. Any unauthorized copying or distribution of content from this file is
 * prohibited.
 */
package co.acoustic.mobile.push.sdk.js;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import android.app.NotificationManager;
import android.content.Context;

import androidx.test.core.app.ApplicationProvider;

import co.acoustic.mobile.push.sdk.api.MceSdk;
import co.acoustic.mobile.push.sdk.api.notification.NotificationsClient;
import co.acoustic.mobile.push.sdk.api.notification.NotificationsPreference;

import org.json.JSONArray;
import org.json.JSONException;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/**
 * Forced-failure guard tests for the Cordova glue layer.
 *
 * These reproduce the production crash reported on Android SDK 3.10.14 (Zendesk #409239):
 * MceJsonApplication.onCreate -> createNotificationChannel -> NotificationsPreference
 * .setNotificationChannelId -> Preferences.setString -> Preferences.getEditor threw a
 * NullPointerException, which fails inside Application.onCreate and prevents the app from
 * starting. A clean emulator cannot reproduce it because EncryptedSharedPreferences init only
 * fails on certain devices, so we force the failure here by mocking the SDK to throw / return
 * null and assert the glue swallows it instead of crashing.
 *
 * Private static members are invoked via reflection, matching the native SDK's PreferencesTest
 * convention (no production-visibility changes).
 */
// Use a plain Application for the test environment so Robolectric does NOT instantiate and run
// the real MceJsonApplication.onCreate (which triggers full native SDK init) during setup. These
// tests exercise the guarded static methods directly.
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 34, application = android.app.Application.class)
public class MceJsonGlueGuardTest {

    private static final String CHANNEL_ID = "mce_test_channel";

    private Context context;

    @Before
    public void setUp() {
        context = ApplicationProvider.getApplicationContext();
    }

    /**
     * The exact reported crash: the notification-channel preference write throws the same
     * NullPointerException that Preferences.getEditor produced on 3.10.14. The guard must
     * swallow it and still create the channel so app startup is never affected.
     */
    @Test
    public void createNotificationChannel_preferenceWriteThrows_doesNotCrashAndStillCreatesChannel() {
        // Arrange: getNotificationsClient().getNotificationsPreference().setNotificationChannelId()
        // throws, mirroring the Preferences.getEditor NPE on the affected native version.
        NotificationsPreference preference = mock(NotificationsPreference.class);
        Mockito.doThrow(new NullPointerException("simulated Preferences.getEditor NPE"))
                .when(preference).setNotificationChannelId(Mockito.any(), Mockito.eq(CHANNEL_ID));
        NotificationsClient client = mock(NotificationsClient.class);
        when(client.getNotificationsPreference()).thenReturn(preference);

        try (MockedStatic<MceSdk> mceSdk = Mockito.mockStatic(MceSdk.class)) {
            mceSdk.when(MceSdk::getNotificationsClient).thenReturn(client);

            // Act
            invokeCreateNotificationChannel(context, "Name", "Description", CHANNEL_ID);

            // Assert: channel still created despite the preference write failing.
            assertNotNull("Notification channel should be created even when the SDK "
                    + "preference write fails", notificationManager().getNotificationChannel(CHANNEL_ID));
        }
    }

    /**
     * When the notifications subsystem is not yet initialized, getNotificationsClient() returns
     * null. The guard must not dereference it, and must still create the channel.
     */
    @Test
    public void createNotificationChannel_notificationsClientNull_doesNotCrashAndStillCreatesChannel() {
        try (MockedStatic<MceSdk> mceSdk = Mockito.mockStatic(MceSdk.class)) {
            mceSdk.when(MceSdk::getNotificationsClient).thenReturn(null);

            invokeCreateNotificationChannel(context, "Name", "Description", CHANNEL_ID);

            assertNotNull("Notification channel should be created even when the notifications "
                    + "client is null", notificationManager().getNotificationChannel(CHANNEL_ID));
        }
    }

    /** A null/empty channel id must be skipped rather than crashing the NotificationChannel ctor. */
    @Test
    public void createNotificationChannel_nullChannelId_doesNotCrash() {
        try (MockedStatic<MceSdk> mceSdk = Mockito.mockStatic(MceSdk.class)) {
            mceSdk.when(MceSdk::getNotificationsClient).thenReturn(mock(NotificationsClient.class));
            invokeCreateNotificationChannel(context, "Name", "Description", null);
            // No assertion beyond "did not throw"; invokeCreateNotificationChannel fails the test
            // if the underlying method throws.
        }
    }

    /** The MceJsonApi helper must return null (never throw) when the SDK client throws. */
    @Test
    public void notificationsPreferenceOrNull_clientThrows_returnsNull() {
        try (MockedStatic<MceSdk> mceSdk = Mockito.mockStatic(MceSdk.class)) {
            mceSdk.when(MceSdk::getNotificationsClient)
                    .thenThrow(new IllegalStateException("SDK not initialized"));
            assertNull(invokeNotificationsPreferenceOrNull());
        }
    }

    /** The MceJsonApi helper must return null when the SDK client is null. */
    @Test
    public void notificationsPreferenceOrNull_clientNull_returnsNull() {
        try (MockedStatic<MceSdk> mceSdk = Mockito.mockStatic(MceSdk.class)) {
            mceSdk.when(MceSdk::getNotificationsClient).thenReturn(null);
            assertNull(invokeNotificationsPreferenceOrNull());
        }
    }

    /**
     * setIcon must not throw and must still complete the callback when the notifications
     * preference is unavailable (SDK not ready) — the setter's null-pref branch is a silent
     * no-op, so this asserts the callback still fires rather than hanging the JS bridge.
     */
    @Test
    public void setIcon_notificationsPreferenceUnavailable_noResultAndNoThrow() throws JSONException {
        JsonCallback callback = mock(JsonCallback.class);
        JSONArray parameters = new JSONArray();
        parameters.put("ic_notification");

        try (MockedStatic<MceSdk> mceSdk = Mockito.mockStatic(MceSdk.class)) {
            mceSdk.when(MceSdk::getNotificationsClient).thenReturn(null);

            MceJsonApi.setIcon(context, parameters, callback);

            verify(callback).noResult();
        }
    }

    // --- reflection helpers (private static methods under test) ---

    private NotificationManager notificationManager() {
        return (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    }

    private void invokeCreateNotificationChannel(Context ctx, CharSequence name,
            String description, String channelId) {
        try {
            Method m = MceJsonApplication.class.getDeclaredMethod(
                    "createNotificationChannel", Context.class, CharSequence.class,
                    String.class, String.class);
            m.setAccessible(true);
            m.invoke(null, ctx, name, description, channelId);
        } catch (InvocationTargetException e) {
            fail("createNotificationChannel must not propagate an exception, but threw: "
                    + e.getCause());
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException("Reflection failure invoking createNotificationChannel", e);
        }
    }

    private Object invokeNotificationsPreferenceOrNull() {
        try {
            Method m = MceJsonApi.class.getDeclaredMethod("notificationsPreferenceOrNull");
            m.setAccessible(true);
            return m.invoke(null);
        } catch (InvocationTargetException e) {
            fail("notificationsPreferenceOrNull must not propagate an exception, but threw: "
                    + e.getCause());
            return null; // unreachable
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException("Reflection failure invoking notificationsPreferenceOrNull", e);
        }
    }
}
