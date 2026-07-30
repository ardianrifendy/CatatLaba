package com.catatlaba.app;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

/** Verifies the primary Android activity is in the expected app package. */
public class AppConfigurationTest {

    @Test
    public void mainActivityUsesCatatlabaPackage() {
        assertEquals("com.catatlaba.app", MainActivity.class.getPackageName());
    }
}
