package com.stellfinder.app

import java.util.Optional

enum class LinkOpenMode {
    IN_APP,
    DEFAULT_BROWSER,

    ;

    companion object {
        fun fromStoredValue(value: String?): Optional<LinkOpenMode> =
            entries.firstOrNull { it.name == value }.let { Optional.ofNullable(it) }
    }
}

fun shouldOpenInExternalBrowser(mode: LinkOpenMode, url: String): Boolean {
    val host = url.substringAfter("//").substringBefore('/').substringBefore(':')

    return mode == LinkOpenMode.DEFAULT_BROWSER && host != "stellfinder.vercel.app"
}
