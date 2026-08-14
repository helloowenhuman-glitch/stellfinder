package com.stellfinder.app

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.view.WindowInsets
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ImageButton
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
        val settingsPresentation = settingsButtonPresentation()
        val settingsButton = ImageButton(this).apply {
            setImageResource(R.drawable.ic_settings_gear)
            contentDescription = settingsPresentation.contentDescription
            background = null
            setPadding(dp(4), dp(4), dp(4), dp(4))
            setOnClickListener { showSettingsDialog() }
        }
        toolbar.addView(title, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        toolbar.addView(settingsButton, LinearLayout.LayoutParams(dp(40), dp(40)))
        root.setOnApplyWindowInsetsListener { _, insets ->
            toolbar.setPadding(dp(16), toolbarTopPadding(dp(4), insets.getInsets(WindowInsets.Type.statusBars()).top), dp(8), dp(4))
            insets
        }

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
        } else if (!NotificationSettings.isConfigured(preferences)) {
            showNotificationCategoryDialog(isFirstLaunch = true)
        }
    }

    @Deprecated("Deprecated in Java")
    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    private val preferences by lazy { getSharedPreferences(STELLFINDER_PREFERENCES_NAME, MODE_PRIVATE) }

    private fun currentLinkOpenMode(): LinkOpenMode =
        LinkOpenMode.fromStoredValue(preferences.getString(LINK_MODE_KEY, null)).orElse(LinkOpenMode.IN_APP)

    private fun showSettingsDialog() {
        AlertDialog.Builder(this)
            .setTitle("설정")
            .setItems(arrayOf("공식 링크 열기 방식", "일정 알림")) { _, which ->
                if (which == 0) showLinkModeDialog(false) else showNotificationCategoryDialog(false)
            }
            .show()
    }

    private fun showLinkModeDialog(isFirstLaunch: Boolean) {
        AlertDialog.Builder(this)
            .setTitle(if (isFirstLaunch) "공식 링크 열기 방식" else "링크 열기 방식 변경")
            .setMessage("공식 공지, 구매, 예매 링크를 여는 방식을 선택해 주세요. 설정에서 언제든 바꿀 수 있습니다.")
            .setPositiveButton("앱 안에서 열기") { _, _ ->
                saveLinkOpenMode(LinkOpenMode.IN_APP)
                if (isFirstLaunch) showNotificationCategoryDialog(true)
            }
            .setNegativeButton("기본 브라우저로 열기") { _, _ ->
                saveLinkOpenMode(LinkOpenMode.DEFAULT_BROWSER)
                if (isFirstLaunch) showNotificationCategoryDialog(true)
            }
            .setCancelable(!isFirstLaunch)
            .show()
    }

    private fun showNotificationCategoryDialog(isFirstLaunch: Boolean) {
        val selectedCategories = NotificationSettings.read(preferences).categories.toMutableSet()
        val categories = NotificationCategory.entries.toTypedArray()
        AlertDialog.Builder(this)
            .setTitle("알림을 받을 일정 종류를 선택하세요")
            .setMessage("복수 선택 가능")
            .setMultiChoiceItems(categories.map(NotificationCategory::label).toTypedArray(), BooleanArray(categories.size) { categories[it] in selectedCategories }) { _, which, checked ->
                if (checked) selectedCategories += categories[which] else selectedCategories -= categories[which]
            }
            .setPositiveButton("다음") { _, _ -> showNotificationLeadDayDialog(selectedCategories, isFirstLaunch) }
            .setNegativeButton(if (isFirstLaunch) "나중에" else "취소") { _, _ ->
                if (isFirstLaunch) NotificationSettings.save(preferences, NotificationSelection(emptySet(), emptySet()))
            }
            .setCancelable(!isFirstLaunch)
            .show()
    }

    private fun showNotificationLeadDayDialog(categories: Set<NotificationCategory>, isFirstLaunch: Boolean) {
        val selectedDays = NotificationSettings.read(preferences).leadDays.toMutableSet()
        val leadTimes = NotificationLeadTime.entries.toTypedArray()
        AlertDialog.Builder(this)
            .setTitle("알림을 받을 때를 선택하세요")
            .setMessage("복수 선택 가능")
            .setMultiChoiceItems(leadTimes.map(NotificationLeadTime::label).toTypedArray(), BooleanArray(leadTimes.size) { leadTimes[it].days in selectedDays }) { _, which, checked ->
                if (checked) selectedDays += leadTimes[which].days else selectedDays -= leadTimes[which].days
            }
            .setPositiveButton("저장") { _, _ -> saveNotificationSelection(NotificationSelection(categories, selectedDays)) }
            .setNegativeButton("이전") { _, _ -> showNotificationCategoryDialog(isFirstLaunch) }
            .setCancelable(!isFirstLaunch)
            .show()
    }

    private fun saveNotificationSelection(selection: NotificationSelection) {
        NotificationSettings.save(preferences, selection)
        if (selection.isEnabled) {
            scheduleEventNotifications(applicationContext)
            requestNotificationPermissionIfNeeded()
        } else {
            cancelEventNotifications(applicationContext)
        }
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), REQUEST_NOTIFICATIONS)
        }
    }

    private fun saveLinkOpenMode(mode: LinkOpenMode) {
        preferences.edit().putString(LINK_MODE_KEY, mode.name).apply()
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private companion object {
        const val WEBSITE_URL = "https://stellfinder.vercel.app"
        const val LINK_MODE_KEY = "link_open_mode"
        const val REQUEST_NOTIFICATIONS = 1
    }
}

fun toolbarTopPadding(basePadding: Int, statusBarInset: Int): Int = basePadding + statusBarInset
