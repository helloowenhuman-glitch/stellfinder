package com.stellfinder.app

data class SettingsButtonPresentation(
    val isIconOnly: Boolean,
    val contentDescription: String,
)

fun settingsButtonPresentation() = SettingsButtonPresentation(
    isIconOnly = true,
    contentDescription = "설정",
)
