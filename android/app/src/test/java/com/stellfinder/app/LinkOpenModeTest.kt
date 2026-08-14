package com.stellfinder.app

import org.junit.Assert.assertFalse
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LinkOpenModeTest {
    @Test
    fun `adds the status bar inset to the toolbar top padding`() {
        assertEquals(28, toolbarTopPadding(basePadding = 4, statusBarInset = 24))
    }

    @Test
    fun `returns no mode when the user has not made an initial selection`() {
        assertFalse(LinkOpenMode.fromStoredValue(null).isPresent)
    }

    @Test
    fun `restores the selected default browser mode`() {
        assertTrue(LinkOpenMode.fromStoredValue("DEFAULT_BROWSER").orElseThrow() == LinkOpenMode.DEFAULT_BROWSER)
    }

    @Test
    fun `opens official external links in the default browser when browser mode is selected`() {
        assertTrue(shouldOpenInExternalBrowser(LinkOpenMode.DEFAULT_BROWSER, "https://example.com/tickets"))
    }

    @Test
    fun `keeps Stellfinder pages inside the app regardless of the selected mode`() {
        assertFalse(shouldOpenInExternalBrowser(LinkOpenMode.DEFAULT_BROWSER, "https://stellfinder.vercel.app"))
    }

    @Test
    fun `opens official external links inside the app when in-app mode is selected`() {
        assertFalse(shouldOpenInExternalBrowser(LinkOpenMode.IN_APP, "https://example.com/tickets"))
    }
}
