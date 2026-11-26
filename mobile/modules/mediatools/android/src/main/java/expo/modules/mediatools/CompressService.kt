package expo.modules.mediatools

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder

/**
 * Foreground service that keeps the compression batch alive while the user
 * switches apps (spec 04a: "android won't stop the job if you switch apps").
 * The transformer itself runs in MediaToolsModule; this service only holds the
 * process priority and mirrors progress in a notification.
 */
class CompressService : Service() {
  companion object {
    const val CHANNEL_ID = "swipemedia.compress"
    const val NOTIFICATION_ID = 4101
    const val EXTRA_TEXT = "text"

    fun start(context: Context, text: String) {
      val intent = Intent(context, CompressService::class.java).putExtra(EXTRA_TEXT, text)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun update(context: Context, text: String) {
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.notify(NOTIFICATION_ID, build(context, text))
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, CompressService::class.java))
    }

    fun build(context: Context, text: String): Notification {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(CHANNEL_ID) == null) {
          manager.createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "compression", NotificationManager.IMPORTANCE_LOW)
          )
        }
      }
      val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Notification.Builder(context, CHANNEL_ID)
      } else {
        @Suppress("DEPRECATION")
        Notification.Builder(context)
      }
      return builder
        .setContentTitle("swipe media")
        .setContentText(text)
        .setSmallIcon(android.R.drawable.stat_sys_download)
        .setOngoing(true)
        .build()
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val text = intent?.getStringExtra(EXTRA_TEXT) ?: "compressing…"
    startForeground(NOTIFICATION_ID, build(this, text))
    return START_NOT_STICKY
  }

  override fun onBind(intent: Intent?): IBinder? = null
}
