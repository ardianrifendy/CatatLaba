package com.catatlaba.app;

import static org.junit.Assert.assertEquals;

import android.content.Context;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import org.junit.Test;
import org.junit.runner.RunWith;

/** Confirms the installed application exposes the expected target context. */
@RunWith(AndroidJUnit4.class)
public class AppSmokeTest {

    @Test
    public void targetContextUsesCatatlabaPackage() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();

        assertEquals("com.catatlaba.app", appContext.getPackageName());
    }
}
