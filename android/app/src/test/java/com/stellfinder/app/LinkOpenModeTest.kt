package com.stellfinder.app

import org.junit.Assert.assertFalse
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LinkOpenModeTest {
    @Test
    fun `puts multi-select guidance in the dialog title so option rows stay available`() {
        assertEquals(
            "알림을 받을 일정 종류를 선택하세요\n복수 선택 가능",
            multiChoiceDialogTitle("알림을 받을 일정 종류를 선택하세요"),
        )
    }

    @Test
    fun `notifies only selected lead days`() {
        val selection = NotificationSelection(
            categories = setOf(NotificationCategory.GOODS),
            leadDays = setOf(7, 3, 0),
        )

        assertTrue(shouldNotify(3, selection))
        assertFalse(shouldNotify(5, selection))
    }

    @Test
    fun `presents settings as an icon-only control with an accessible label`() {
        val presentation = settingsButtonPresentation()

        assertTrue(presentation.isIconOnly)
        assertEquals("설정", presentation.contentDescription)
    }

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
