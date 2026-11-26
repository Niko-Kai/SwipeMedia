package expo.modules.mediatools

import android.app.Activity
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.os.StatFs
import android.provider.MediaStore
import android.provider.OpenableColumns
import android.util.Log
import androidx.media3.common.MediaItem
import androidx.media3.effect.Presentation
import androidx.media3.transformer.Composition
import androidx.media3.transformer.EditedMediaItem
import androidx.media3.transformer.Effects
import androidx.media3.transformer.ExportException
import androidx.media3.transformer.ExportResult
import androidx.media3.transformer.ProgressHolder
import androidx.media3.transformer.Transformer
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Queues
import java.io.File

private const val TRASH_REQUEST_CODE = 41001
private const val DELETE_REQUEST_CODE = 41002

/**
 * Local Expo module for what the JS SDKs don't expose:
 * - storage stats (StatFs)
 * - batch asset sizes (MediaStore SIZE column)
 * - batched trash/delete requests: ONE system dialog for the whole batch
 *   (spec 04a: "one 'allow' at the end trashes all 36 items").
 * - video compression via MediaTransformer (P4), mirrored in a foreground
 *   service notification so the batch survives app switching.
 */
class MediaToolsModule : Module() {
  private var pendingTrash: Promise? = null
  private var pendingDelete: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("MediaTools")
    Events("onCompressProgress")

    AsyncFunction("getStorageStats") {
      val stat = StatFs(Environment.getExternalStorageDirectory().absolutePath)
      mapOf(
        "totalBytes" to stat.totalBytes.toDouble(),
        "freeBytes" to stat.availableBytes.toDouble()
      )
    }

    AsyncFunction("getSizes") { uris: List<String> ->
      val ctx = appContext.reactContext
        ?: appContext.currentActivity?.applicationContext
        ?: appContext.currentActivity
      val resolver = ctx?.contentResolver
      Log.e("MediaTools", "getSizes ctx=${ctx != null} resolver=${resolver != null} uris=${uris.size}")
      val projection = arrayOf(OpenableColumns.SIZE)
      uris.map { uri ->
        try {
          resolver?.query(Uri.parse(uri), projection, null, null, null)?.use { cursor ->
            if (cursor.moveToFirst() && !cursor.isNull(0)) cursor.getLong(0).toDouble()
            else {
              Log.e("MediaTools", "no size row for $uri")
              -1.0
            }
          } ?: run {
            Log.e("MediaTools", "null cursor for $uri")
            -1.0
          }
        } catch (e: Exception) {
          Log.e("MediaTools", "size query failed for $uri: ${e.message}")
          -1.0
        }
      }
    }

    // One system dialog for the whole batch (API 30+ batch trashing).
    AsyncFunction("requestTrash") { uris: List<String>, trash: Boolean, promise: Promise ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
        promise.reject(CodedException("ERR_UNSUPPORTED_API", "batch trash requests need Android 11+", null))
        return@AsyncFunction
      }
      val activity = appContext.currentActivity
        ?: run {
          promise.reject(CodedException("ERR_NO_ACTIVITY", "no foreground activity", null))
          return@AsyncFunction
        }
      try {
        pendingTrash = promise
        val parsed = uris.map { Uri.parse(it) }
        val request = MediaStore.createTrashRequest(activity.contentResolver, parsed, trash)
        activity.startIntentSenderForResult(request.intentSender, TRASH_REQUEST_CODE, null, 0, 0, 0)
      } catch (e: Exception) {
        pendingTrash = null
        promise.reject(CodedException("ERR_TRASH_REQUEST", e.message, e))
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("requestDelete") { uris: List<String>, promise: Promise ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
        promise.reject(CodedException("ERR_UNSUPPORTED_API", "batch delete requests need Android 11+", null))
        return@AsyncFunction
      }
      val activity = appContext.currentActivity
        ?: run {
          promise.reject(CodedException("ERR_NO_ACTIVITY", "no foreground activity", null))
          return@AsyncFunction
        }
      try {
        pendingDelete = promise
        val parsed = uris.map { Uri.parse(it) }
        val request = MediaStore.createDeleteRequest(activity.contentResolver, parsed)
        activity.startIntentSenderForResult(request.intentSender, DELETE_REQUEST_CODE, null, 0, 0, 0)
      } catch (e: Exception) {
        pendingDelete = null
        promise.reject(CodedException("ERR_DELETE_REQUEST", e.message, e))
      }
    }.runOnQueue(Queues.MAIN)

    /** Transcode one video to `heightPx` tall (1080 balanced / 720 max savings).
     *  Emits onCompressProgress 0..1; resolves { uri, sizeBytes }. */
    AsyncFunction("compressVideo") { uri: String, heightPx: Int, promise: Promise ->
      val context = appContext.reactContext ?: appContext.currentActivity
      if (context == null) {
        promise.reject(CodedException("ERR_NO_CONTEXT", "no app context", null))
        return@AsyncFunction
      }
      val outputDir = File(context.cacheDir, "compressed").apply { mkdirs() }
      val outputFile = File(outputDir, "out_${System.currentTimeMillis()}.mp4")

      val mediaItem = MediaItem.Builder().setUri(Uri.parse(uri)).build()
      val edited = EditedMediaItem.Builder(mediaItem)
        .setEffects(
          Effects(
            emptyList(),
            listOf(Presentation.createForHeight(heightPx))
          )
        )
        .build()

      val handler = Handler(Looper.getMainLooper())
      var finished = false

      val transformer = Transformer.Builder(context)
        .addListener(object : Transformer.Listener {
          override fun onCompleted(composition: Composition, exportResult: ExportResult) {
            finished = true
            CompressService.stop(context)
            promise.resolve(
              mapOf(
                "uri" to outputFile.absolutePath,
                "sizeBytes" to outputFile.length().toDouble()
              )
            )
          }

          override fun onError(
            composition: Composition,
            exportResult: ExportResult,
            exportException: ExportException
          ) {
            finished = true
            CompressService.stop(context)
            outputFile.delete()
            Log.e("MediaTools", "compress failed", exportException)
            promise.reject(CodedException("ERR_COMPRESS", exportException.message, exportException))
          }
        })
        .build()

      val holder = ProgressHolder()
      val poll = object : Runnable {
        override fun run() {
          if (finished) return
          if (transformer.getProgress(holder) == Transformer.PROGRESS_STATE_AVAILABLE) {
            sendEvent("onCompressProgress", mapOf("progress" to holder.progress / 100.0))
            CompressService.update(context, "compressing… ${holder.progress}%")
          }
          handler.postDelayed(this, 500)
        }
      }

      try {
        CompressService.start(context, "compressing…")
        transformer.start(edited, outputFile.absolutePath)
        handler.postDelayed(poll, 500)
      } catch (e: Exception) {
        finished = true
        CompressService.stop(context)
        outputFile.delete()
        promise.reject(CodedException("ERR_COMPRESS_START", e.message, e))
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("stopCompression") {
      CompressService.stop(appContext.reactContext ?: return@AsyncFunction false)
      true
    }

    OnActivityResult { _, payload ->
      when (payload.requestCode) {
        TRASH_REQUEST_CODE -> {
          val promise = pendingTrash ?: return@OnActivityResult
          pendingTrash = null
          promise.resolve(mapOf("granted" to (payload.resultCode == Activity.RESULT_OK)))
        }
        DELETE_REQUEST_CODE -> {
          val promise = pendingDelete ?: return@OnActivityResult
          pendingDelete = null
          promise.resolve(mapOf("granted" to (payload.resultCode == Activity.RESULT_OK)))
        }
      }
    }
  }
}
