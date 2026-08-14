package com.stellfinder.app

import android.content.SharedPreferences

const val STELLFINDER_PREFERENCES_NAME = "stellfinder_preferences"

enum class NotificationCategory(val apiValue: String, val label: String) {
    PERFORMANCE("performance", "공연"),
    GOODS("goods", "굿즈"),
    COLLABORATION("collaboration", "콜라보"),
    OFFLINE("offline", "오프라인"),
}

enum class NotificationLeadTime(val days: Int, val label: String) {
    DAYS_7(7, "7일 전"),
    DAYS_5(5, "5일 전"),
    DAYS_3(3, "3일 전"),
    DAYS_1(1, "1일 전"),
    TODAY(0, "당일"),
}

data class NotificationSelection(
    val categories: Set<NotificationCategory>,
    val leadDays: Set<Int>,
) {
    val isEnabled: Boolean get() = categories.isNotEmpty() && leadDays.isNotEmpty()
}

fun shouldNotify(daysUntil: Long, selection: NotificationSelection): Boolean =
    daysUntil >= 0 && daysUntil.toInt() in selection.leadDays

fun multiChoiceDialogTitle(title: String): String = "$title\n복수 선택 가능"

object NotificationSettings {
    private const val CATEGORY_KEY = "notification_categories"
    private const val LEAD_DAY_KEY = "notification_lead_days"
    private const val CONFIGURED_KEY = "notification_configured"

    fun read(preferences: SharedPreferences): NotificationSelection = NotificationSelection(
        categories = preferences.getStringSet(CATEGORY_KEY, emptySet())
            .orEmpty()
            .mapNotNull { value -> NotificationCategory.entries.firstOrNull { it.name == value } }
            .toSet(),
        leadDays = preferences.getStringSet(LEAD_DAY_KEY, emptySet())
            .orEmpty()
            .mapNotNull { it.toIntOrNull() }
            .toSet(),
    )

    fun save(preferences: SharedPreferences, selection: NotificationSelection) {
        preferences.edit()
            .putStringSet(CATEGORY_KEY, selection.categories.map { it.name }.toSet())
            .putStringSet(LEAD_DAY_KEY, selection.leadDays.map { it.toString() }.toSet())
            .putBoolean(CONFIGURED_KEY, true)
            .apply()
    }

    fun isConfigured(preferences: SharedPreferences): Boolean = preferences.getBoolean(CONFIGURED_KEY, false)
}
