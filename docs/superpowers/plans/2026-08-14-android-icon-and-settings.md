# Android 아이콘 및 설정 버튼 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 단순한 Stellfinder 런처 아이콘, 아이콘 전용 설정 버튼, 사용자가 고른 일정 알림을 Android 앱에 적용한다.

**Architecture:** 런처 아이콘은 앱 리소스 PNG 하나를 Manifest에 연결해 Android 홈 화면에 표시한다. 설정 버튼의 표현은 작은 순수 Kotlin 모델로 정의하고, `MainActivity`가 이를 이용해 접근성 설명을 가진 아이콘 전용 버튼을 구성한다. Android WorkManager가 기존 월별 공식 일정 API를 매일 조회해 사용자가 선택한 종류와 시점의 로컬 알림을 보낸다.

**Tech Stack:** Kotlin, Android SDK 35, JUnit 4, Android WorkManager, Android 리소스 XML

## Global Constraints

- 별은 얼굴 없는 파스텔 네 꼭짓점 형태이고 망원경보다 작다.
- 배경은 짙은 남색이며 장식·글자·작은 반짝임을 추가하지 않는다.
- 설정 버튼은 제공받은 연한 회보라색 톱니 모양과 흰색 중앙 원형을 사용한다.
- 링크 열기 방식 선택 동작은 변경하지 않는다.
- 알림 종류와 알림 시점은 각각 복수 선택 가능하다는 문구를 표시한다.
- 알림 종류는 공연, 굿즈, 콜라보, 오프라인이며 알림 시점은 7일 전, 5일 전, 3일 전, 1일 전, 당일이다.
- `.env.local` 및 비밀 값은 읽지 않는다.

---

### Task 1: 아이콘 전용 설정 버튼 표현

**Files:**
- Create: `android/app/src/main/java/com/stellfinder/app/SettingsButtonPresentation.kt`
- Modify: `android/app/src/test/java/com/stellfinder/app/LinkOpenModeTest.kt`
- Modify: `android/app/src/main/java/com/stellfinder/app/MainActivity.kt`

**Interfaces:**
- Produces: `settingsButtonPresentation(): SettingsButtonPresentation`
- Consumes: `SettingsButtonPresentation.contentDescription: String`, `SettingsButtonPresentation.isIconOnly: Boolean`

- [ ] **Step 1: Write the failing test**

```kotlin
@Test
fun `presents settings as an icon-only control with an accessible label`() {
    val presentation = settingsButtonPresentation()

    assertTrue(presentation.isIconOnly)
    assertEquals("설정", presentation.contentDescription)
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `gradle testDebugUnitTest --tests com.stellfinder.app.LinkOpenModeTest`

Expected: FAIL because `settingsButtonPresentation` is not defined.

- [ ] **Step 3: Write minimal implementation**

```kotlin
data class SettingsButtonPresentation(
    val isIconOnly: Boolean,
    val contentDescription: String,
)

fun settingsButtonPresentation() = SettingsButtonPresentation(true, "설정")
```

Use this presentation when creating `ImageButton` in `MainActivity`; remove its text while retaining `showLinkModeDialog(false)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `gradle testDebugUnitTest --tests com.stellfinder.app.LinkOpenModeTest`

Expected: PASS.

### Task 2: 톱니 및 런처 아이콘 리소스

**Files:**
- Create: `android/app/src/main/res/drawable/ic_settings_gear.xml`
- Create: `android/app/src/main/res/drawable-nodpi/stellfinder_launcher.png`
- Modify: `android/app/src/main/AndroidManifest.xml`
- Modify: `android/app/src/main/java/com/stellfinder/app/MainActivity.kt`

**Interfaces:**
- Consumes: `@drawable/ic_settings_gear` for the toolbar `ImageButton`
- Produces: `@drawable/stellfinder_launcher` as `android:icon` and `android:roundIcon`

- [ ] **Step 1: Add drawable resources**

Create a light gray-lavender vector gear with a white circular center. Copy the approved, generated launcher PNG into `drawable-nodpi` without overwriting its source image.

- [ ] **Step 2: Connect resources**

Set the application icon and round icon in the Manifest to `@drawable/stellfinder_launcher`. Use `@drawable/ic_settings_gear` in a 40dp square `ImageButton` with no background and the tested content description.

- [ ] **Step 3: Build the debug APK**

Run: `gradle testDebugUnitTest assembleDebug`

Expected: exit code 0 and an APK at `android/app/build/outputs/apk/debug/app-debug.apk`.

### Task 3: 사용자 선택형 일정 알림

**Files:**
- Create: `android/app/src/main/java/com/stellfinder/app/NotificationPreferences.kt`
- Create: `android/app/src/main/java/com/stellfinder/app/EventNotificationWorker.kt`
- Modify: `android/app/src/test/java/com/stellfinder/app/LinkOpenModeTest.kt`
- Modify: `android/app/src/main/java/com/stellfinder/app/MainActivity.kt`
- Modify: `android/app/src/main/AndroidManifest.xml`
- Modify: `android/app/build.gradle.kts`

**Interfaces:**
- Produces: `NotificationSelection(categories: Set<NotificationCategory>, leadDays: Set<Int>)`
- Produces: `shouldNotify(daysUntil: Long, selection: NotificationSelection): Boolean`
- Consumes: existing `GET /api/events?month=YYYY-MM` response

- [ ] **Step 1: Write the failing tests**

```kotlin
@Test
fun `notifies only selected lead days`() {
    val selection = NotificationSelection(
        categories = setOf(NotificationCategory.GOODS),
        leadDays = setOf(7, 3, 0),
    )

    assertTrue(shouldNotify(3, selection))
    assertFalse(shouldNotify(5, selection))
}
```

Run: `gradle testDebugUnitTest --tests com.stellfinder.app.LinkOpenModeTest`

Expected: FAIL because `NotificationSelection` and `shouldNotify` are not defined.

- [ ] **Step 2: Implement selection persistence and setup UI**

Persist category and lead-day sets in app preferences. Show two multi-choice dialogs with the exact headings `알림을 받을 일정 종류를 선택하세요` and `알림을 받을 때를 선택하세요`, each followed by `복수 선택 가능`. Request `POST_NOTIFICATIONS` only after both selections are saved. Add settings menu entries to reopen link-mode and notification setup.

- [ ] **Step 3: Implement daily worker**

Use WorkManager with network constraint and a 24-hour interval. Fetch this month and next month from the existing HTTPS events endpoint, filter verified user-selected categories, calculate Korea-local days until each `startAt`, and post one notification only when a selected lead day matches. Store an event id/start date/lead-day key to avoid duplicate notifications.

- [ ] **Step 4: Run Android verification**

Run: `gradle testDebugUnitTest assembleDebug`

Expected: PASS and a debug APK.

### Task 4: 전체 검증 및 배포

**Files:**
- Modify: `C:\Users\dhlee\OneDrive\바탕 화면\Stellfinder-android.apk.zip` (distribution archive)

- [ ] **Step 1: Run web verification**

Run: `npm run lint`, `npm run test:run -- --pool=forks`, `npm run build`.

- [ ] **Step 2: Update distribution archive**

Replace only the `app-debug.apk` entry in the existing Desktop ZIP with the newly built APK.

- [ ] **Step 3: Commit and push**

Run: `git add` for the implementation, tests, and documentation; commit on `master`; then `git push origin master`.

- [ ] **Step 4: Verify automatic deployment**

Check `https://stellfinder.vercel.app` after the push without viewing any environment-variable values.
