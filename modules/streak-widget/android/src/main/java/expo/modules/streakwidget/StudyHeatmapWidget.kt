package expo.modules.streakwidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.RemoteViews

class StudyHeatmapWidget : AppWidgetProvider() {

  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    for (id in ids) updateOne(context, manager, id)
  }

  override fun onAppWidgetOptionsChanged(
    context: Context,
    manager: AppWidgetManager,
    id: Int,
    newOptions: Bundle,
  ) {
    updateOne(context, manager, id)
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    when (intent.action) {
      Intent.ACTION_DATE_CHANGED, Intent.ACTION_TIMEZONE_CHANGED -> refreshAll(context)
    }
  }

  companion object {
    fun refreshAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, StudyHeatmapWidget::class.java))
      for (id in ids) updateOne(context, manager, id)
    }

    fun updateOne(context: Context, manager: AppWidgetManager, id: Int) {
      val views = RemoteViews(context.packageName, R.layout.widget_heatmap)
      try {
        val opts = manager.getAppWidgetOptions(id)
        // Portrait: width = MIN_WIDTH, height = MAX_HEIGHT
        var wDp = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 250)
        var hDp = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 110)
        if (wDp <= 0) wDp = 250
        if (hDp <= 0) hDp = 110
        val density = context.resources.displayMetrics.density
        val snap = WidgetStore.load(context)
        val bmp = HeatmapRenderer.render(snap, wDp, hDp, density)
        views.setImageViewBitmap(R.id.heatmap_image, bmp)
        views.setViewVisibility(R.id.placeholder_text, View.GONE)
      } catch (e: Exception) {
        views.setViewVisibility(R.id.placeholder_text, View.VISIBLE)
      }

      val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
      if (launch != null) {
        launch.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        val pi = PendingIntent.getActivity(
          context,
          0,
          launch,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        views.setOnClickPendingIntent(R.id.widget_root, pi)
      }
      manager.updateAppWidget(id, views)
    }
  }
}
