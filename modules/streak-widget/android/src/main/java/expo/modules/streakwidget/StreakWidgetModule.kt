package expo.modules.streakwidget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.os.Build
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class StreakWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("StreakWidget")

    /** Saves the study history JSON and redraws every widget instance. */
    AsyncFunction("updateAsync") { json: String ->
      val ctx = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      WidgetStore.save(ctx, json)
      StudyHeatmapWidget.refreshAll(ctx)
      true
    }

    /** Number of widget instances currently on the home screen. */
    AsyncFunction("countAsync") {
      val ctx = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val manager = AppWidgetManager.getInstance(ctx)
      manager.getAppWidgetIds(ComponentName(ctx, StudyHeatmapWidget::class.java)).size
    }

    /** Opens the launcher's "add widget" dialog (One UI supports this). */
    AsyncFunction("requestPinAsync") {
      val ctx = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return@AsyncFunction false
      val manager = AppWidgetManager.getInstance(ctx)
      if (!manager.isRequestPinAppWidgetSupported) return@AsyncFunction false
      manager.requestPinAppWidget(ComponentName(ctx, StudyHeatmapWidget::class.java), null, null)
    }
  }
}
