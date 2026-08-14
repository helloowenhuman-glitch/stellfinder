package com.stellfinder.app

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.WHITE)
        }
        val toolbar = LinearLayout(this).apply {
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(16), dp(4), dp(8), dp(4))
        }
        val title = TextView(this).apply {
            text = "Stellfinder"
            textSize = 18f
            setTextColor(Color.rgb(16, 43, 82))
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        }
        val settingsButton = Button(this).apply {
            text = "설정"
            contentDescription = "설정"
            setOnClickListener { showLinkModeDialog(false) }
        }
        toolbar.addView(title, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        toolbar.addView(settingsButton)

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    val url = request.url.toString()
                    if (shouldOpenInExternalBrowser(currentLinkOpenMode(), url)) {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        return true
                    }
                    return false
                }
            }
            loadUrl(WEBSITE_URL)
        }

        root.addView(toolbar, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        root.addView(webView, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
        setContentView(root)

        if (!LinkOpenMode.fromStoredValue(preferences.getString(LINK_MODE_KEY, null)).isPresent) {
            showLinkModeDialog(true)
        }
    }

    @Deprecated("Deprecated in Java")
    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    private val preferences by lazy { getSharedPreferences(PREFERENCES_NAME, MODE_PRIVATE) }

    private fun currentLinkOpenMode(): LinkOpenMode =
        LinkOpenMode.fromStoredValue(preferences.getString(LINK_MODE_KEY, null)).orElse(LinkOpenMode.IN_APP)

    private fun showLinkModeDialog(isFirstLaunch: Boolean) {
        AlertDialog.Builder(this)
            .setTitle(if (isFirstLaunch) "공식 링크 열기 방식" else "링크 열기 방식 변경")
            .setMessage("공식 공지, 구매, 예매 링크를 여는 방식을 선택해 주세요. 설정에서 언제든 바꿀 수 있습니다.")
            .setPositiveButton("앱 안에서 열기") { _, _ -> saveLinkOpenMode(LinkOpenMode.IN_APP) }
            .setNegativeButton("기본 브라우저로 열기") { _, _ -> saveLinkOpenMode(LinkOpenMode.DEFAULT_BROWSER) }
            .setCancelable(!isFirstLaunch)
            .show()
    }

    private fun saveLinkOpenMode(mode: LinkOpenMode) {
        preferences.edit().putString(LINK_MODE_KEY, mode.name).apply()
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private companion object {
        const val WEBSITE_URL = "https://stellfinder.vercel.app"
        const val PREFERENCES_NAME = "stellfinder_preferences"
        const val LINK_MODE_KEY = "link_open_mode"
    }
}
