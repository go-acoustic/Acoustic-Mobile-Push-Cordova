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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.test.core.app.ApplicationProvider;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Tests of the queue behind MCEPlugin.setMessageReceivedCallback (the messages that arrive while no JavaScript
 * callback is registered): the queue keeps the newest MESSAGE_RECEIVED_MAX_QUEUED messages, and
 * removeMessageReceivedCallback clears the "used" flag and deletes what was queued.
 *
 * The callbacks database sits behind JsonCallbacksRegistry, which is mocked here, so the tests check what the
 * receiver reads and deletes. Private static members are reached through reflection, as in MceJsonGlueGuardTest.
 */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 34, application = android.app.Application.class)
public class MessageReceivedQueueTest {

    private static final String CALLBACK_NAME = "messageReceivedCallback";
    private static final String PREFERENCES = "co.acoustic.mobile.push.js.messageReceived";
    private static final String USED_KEY = "used";

    private Context context;

    @Before
    public void setUp() throws ReflectiveOperationException {
        context = ApplicationProvider.getApplicationContext();
        resetReceiverState();
    }

    @After
    public void tearDown() throws ReflectiveOperationException {
        resetReceiverState();
    }

    /** More messages than the limit: the oldest ones (lowest ids) are deleted, whatever order the database returns. */
    @Test
    public void trim_overTheLimit_deletesTheOldestMessages() {
        int excess = 5;
        List<JsonCallbacksRegistry.RegisteredCallback> queued = queuedMessages(JsonMceBroadcastReceiver.MESSAGE_RECEIVED_MAX_QUEUED + excess);
        Collections.shuffle(queued, new java.util.Random(7));

        try (MockedStatic<JsonCallbacksRegistry> registry = Mockito.mockStatic(JsonCallbacksRegistry.class)) {
            registry.when(() -> JsonCallbacksRegistry.getRegisteredCallbacks(any(), eq(CALLBACK_NAME))).thenReturn(queued);

            invokeTrim();

            ArgumentCaptor<List<JsonCallbacksRegistry.RegisteredCallback>> deleted = ArgumentCaptor.forClass(List.class);
            registry.verify(() -> JsonCallbacksRegistry.deleteCallbacks(any(), deleted.capture()));
            List<Integer> deletedIds = new ArrayList<>();
            for (JsonCallbacksRegistry.RegisteredCallback callback : deleted.getValue()) {
                deletedIds.add(callback.getId());
            }
            Collections.sort(deletedIds);
            assertEquals("Only the messages over the limit are deleted", excess, deletedIds.size());
            for (int i = 0; i < excess; i++) {
                assertEquals("The oldest message goes first", Integer.valueOf(i + 1), deletedIds.get(i));
            }
        }
    }

    /** Exactly at the limit nothing is deleted (deleteCallbacks must not be called with an empty list). */
    @Test
    public void trim_atTheLimit_deletesNothing() {
        List<JsonCallbacksRegistry.RegisteredCallback> queued = queuedMessages(JsonMceBroadcastReceiver.MESSAGE_RECEIVED_MAX_QUEUED);

        try (MockedStatic<JsonCallbacksRegistry> registry = Mockito.mockStatic(JsonCallbacksRegistry.class)) {
            registry.when(() -> JsonCallbacksRegistry.getRegisteredCallbacks(any(), eq(CALLBACK_NAME))).thenReturn(queued);

            invokeTrim();

            registry.verify(() -> JsonCallbacksRegistry.deleteCallbacks(any(), any()), Mockito.never());
        }
    }

    /** removeMessageReceivedCallback clears the flag in memory and in the preferences and deletes the queued messages. */
    @Test
    public void remove_clearsTheUsedFlagAndDeletesTheQueuedMessages() throws ReflectiveOperationException {
        preferences().edit().putBoolean(USED_KEY, true).commit();
        List<JsonCallbacksRegistry.RegisteredCallback> queued = queuedMessages(3);

        try (MockedStatic<JsonCallbacksRegistry> registry = Mockito.mockStatic(JsonCallbacksRegistry.class)) {
            registry.when(() -> JsonCallbacksRegistry.getRegisteredCallbacks(any(), eq(CALLBACK_NAME))).thenReturn(queued);

            JsonMceBroadcastReceiver.removeMessageReceivedCallback(context);

            registry.verify(() -> JsonCallbacksRegistry.deleteCallbacks(any(), eq(queued)));
        }
        assertFalse("The flag is cleared in the preferences", preferences().getBoolean(USED_KEY, true));
        assertEquals("The flag is cleared in memory", Boolean.FALSE, readStatic("messageReceivedUsed"));
        assertNull("The callback is unregistered", readStatic("messageReceivedCallback"));
    }

    /** With nothing queued, deleteCallbacks must not be called: it reads the first element of the list. */
    @Test
    public void remove_nothingQueued_doesNotDelete() {
        try (MockedStatic<JsonCallbacksRegistry> registry = Mockito.mockStatic(JsonCallbacksRegistry.class)) {
            registry.when(() -> JsonCallbacksRegistry.getRegisteredCallbacks(any(), eq(CALLBACK_NAME)))
                    .thenReturn(new ArrayList<>());

            JsonMceBroadcastReceiver.removeMessageReceivedCallback(context);

            registry.verify(() -> JsonCallbacksRegistry.deleteCallbacks(any(), any()), Mockito.never());
        }
        assertFalse(preferences().getBoolean(USED_KEY, false));
    }

    /** Setting a callback marks the messages as wanted again after a remove. */
    @Test
    public void setCallback_afterRemove_marksTheMessagesAsWantedAgain() {
        try (MockedStatic<JsonCallbacksRegistry> registry = Mockito.mockStatic(JsonCallbacksRegistry.class)) {
            registry.when(() -> JsonCallbacksRegistry.getRegisteredCallbacks(any(), eq(CALLBACK_NAME)))
                    .thenReturn(new ArrayList<>());

            JsonMceBroadcastReceiver.removeMessageReceivedCallback(context);
            assertFalse(preferences().getBoolean(USED_KEY, false));

            JsonMceBroadcastReceiver.setMessageReceivedCallback(context, Mockito.mock(JsonCallback.class));

            assertTrue(preferences().getBoolean(USED_KEY, false));
        }
    }

    // --- helpers ---

    private SharedPreferences preferences() {
        return context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
    }

    // ids 1..count, the way the database numbers the messages in the order they arrived
    private static List<JsonCallbacksRegistry.RegisteredCallback> queuedMessages(int count) {
        List<JsonCallbacksRegistry.RegisteredCallback> queued = new ArrayList<>();
        for (int id = 1; id <= count; id++) {
            queued.add(new JsonCallbacksRegistry.RegisteredCallback(id, CALLBACK_NAME, true, "{\"n\":" + id + "}"));
        }
        return queued;
    }

    private void invokeTrim() {
        try {
            Method method = JsonMceBroadcastReceiver.class.getDeclaredMethod("trimQueuedMessageReceivedCallbacks", Context.class);
            method.setAccessible(true);
            method.invoke(null, context);
        } catch (InvocationTargetException e) {
            throw new AssertionError("trimQueuedMessageReceivedCallbacks must not throw, but threw: " + e.getCause(), e.getCause());
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException("Reflection failure invoking trimQueuedMessageReceivedCallbacks", e);
        }
    }

    // The receiver keeps its state in static fields: reset them so the tests do not depend on their order
    private void resetReceiverState() throws ReflectiveOperationException {
        writeStatic("messageReceivedCallback", null);
        writeStatic("messageReceivedUsed", null);
        preferences().edit().clear().commit();
    }

    private static Object readStatic(String name) throws ReflectiveOperationException {
        Field field = JsonMceBroadcastReceiver.class.getDeclaredField(name);
        field.setAccessible(true);
        return field.get(null);
    }

    private static void writeStatic(String name, Object value) throws ReflectiveOperationException {
        Field field = JsonMceBroadcastReceiver.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(null, value);
    }
}
