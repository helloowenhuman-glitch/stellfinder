package com.stellfinder.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.YearMonth
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import java.util.concurrent.TimeUnit

private const val NOTIFICATION_WORK_NAME = "stellfinder_event_notifications"
private const val NOTIFICATION_CHANNEL_ID = "stellfinder_schedule"
private const val NOTIFICATION_MARKER_PREFIX = "notified_event_"
private val KOREA_ZONE: ZoneId = ZoneId.of("Asia/Seoul")

fun scheduleEventNotifications(context: Context) {
    val constraints = Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()
    val request = PeriodicWorkRequestBuilder<EventNotificationWorker>(24, TimeUnit.HOURS)
        .setConstraints(constraints)
        .build()

    WorkManager.getInstance(context).enqueueUniquePeriodicWork(
        NOTIFICATION_WORK_NAME,
        ExistingPeriodicWorkPolicy.UPDATE,
        request,
    )
}

fun cancelEventNotifications(context: Context) {
    WorkManager.getInstance(context).cancelUniqueWork(NOTIFICATION_WORK_NAME)
}

class EventNotificationWorker(context: Context, parameters: WorkerParameters) : Worker(context, parameters) {
    override fun doWork(): Result {
        val preferences = applicationContext.getSharedPreferences(STELLFINDER_PREFERENCES_NAME, Context.MODE_PRIVATE)
        val selection = NotificationSettings.read(preferences)
        if (!selection.isEnabled || !canPostNotifications()) return Result.success()

        return try {
            val today = LocalDate.now(KOREA_ZONE)
            val months = setOf(YearMonth.from(today), YearMonth.from(today.plusDays(7)))
            months.flatMap { fetchEvents(it) }
                .filter { it.category in selection.categories.map(NotificationCategory::apiValue).toSet() }
                .forEach { event -> notifyIfDue(event, today, selection, preferences) }
            Result.success()
        } catch (_: Exception) {
            Result.retry()
        }
    }

    private fun canPostNotifications(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            applicationContext.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

    private fun fetchEvents(month: YearMonth): List<UpcomingEvent> {
        val connection = URL("https://stellfinder.vercel.app/api/events?month=$month").openConnection() as HttpURLConnection
        return try {
            connection.connectTimeout = 10_000
            connection.readTimeout = 10_000
            if (connection.responseCode !in 200..299) throw IllegalStateException("Unable to load events")
            val events = JSONObject(connection.inputStream.bufferedReader().use { it.readText() }).getJSONArray("events")
            List(events.length()) { index ->
                val event = events.getJSONObject(index)
                UpcomingEvent(
                    id = event.getString("id"),
                    title = event.getString("title"),
                    category = event.getString("category"),
                    startAt = event.getString("startAt"),
                )
            }
        } finally {
            connection.disconnect()
        }
    }

    private fun notifyIfDue(
        event: UpcomingEvent,
        today: LocalDate,
        selection: NotificationSelection,
        preferences: android.content.SharedPreferences,
    ) {
        val startDate = OffsetDateTime.parse(event.startAt).atZoneSameInstant(KOREA_ZONE).toLocalDate()
        val daysUntil = ChronoUnit.DAYS.between(today, startDate)
        if (!shouldNotify(daysUntil, selection)) return

        val marker = "$NOTIFICATION_MARKER_PREFIX${event.id}_${event.startAt}_${daysUntil}"
        if (preferences.getBoolean(marker, false)) return

        createNotificationChannel()
        val contentIntent = PendingIntent.getActivity(
            applicationContext,
            marker.hashCode(),
            Intent(applicationContext, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val categoryLabel = NotificationCategory.entries.first { it.apiValue == event.category }.label
        val message = if (daysUntil == 0L) {
            "$categoryLabel 일정이 오늘입니다."
        } else {
            "$categoryLabel 일정까지 ${daysUntil}일 남았습니다."
        }
        val notification = NotificationCompat.Builder(applicationContext, NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(event.title)
            .setContentText(message)
            .setContentIntent(contentIntent)
            .setAutoCancel(true)
            .build()

        NotificationManagerCompat.from(applicationContext).notify(marker.hashCode(), notification)
        preferences.edit().putBoolean(marker, true).apply()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Stellfinder 일정 알림",
                NotificationManager.IMPORTANCE_DEFAULT,
            )
            applicationContext.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }
}

private data class UpcomingEvent(
    val id: String,
    val title: String,
    val category: String,
    val startAt: String,
)
