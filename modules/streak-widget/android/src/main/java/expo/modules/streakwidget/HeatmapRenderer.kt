package expo.modules.streakwidget

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

/**
 * Draws a GitHub-style contribution heatmap (7 rows x N weeks) plus a header
 * with the current streak. Everything is drawn into a bitmap so it looks the
 * same on any launcher.
 */
object HeatmapRenderer {
  private val LEVELS = intArrayOf(
    Color.parseColor("#161B22"),
    Color.parseColor("#0E4429"),
    Color.parseColor("#006D32"),
    Color.parseColor("#26A641"),
    Color.parseColor("#39D353"),
  )
  private val BG = Color.parseColor("#0D1117")
  private val TEXT = Color.parseColor("#E6EDF3")
  private val MUTED = Color.parseColor("#8B949E")
  private val FIRE = Color.parseColor("#FF9F1C")

  fun level(xp: Int, goal: Int): Int = when {
    xp <= 0 -> 0
    xp < goal / 2 -> 1
    xp < goal -> 2
    xp < goal * 2 -> 3
    else -> 4
  }

  fun render(
    snap: WidgetStore.Snapshot,
    widthDp: Int,
    heightDp: Int,
    density: Float,
    today: LocalDate = LocalDate.now(),
  ): Bitmap {
    val wDp = max(widthDp, 120)
    val hDp = max(heightDp, 60)
    // Cap bitmap memory (RemoteViews limit) by lowering the render scale if needed.
    var scale = density
    val maxPixels = 1_400_000f
    if (wDp * hDp * scale * scale > maxPixels) {
      scale = kotlin.math.sqrt(maxPixels / (wDp * hDp))
    }
    val w = (wDp * scale).toInt()
    val h = (hDp * scale).toInt()
    val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
    val c = Canvas(bmp)
    fun dp(v: Float) = v * scale

    val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = BG }
    c.drawRoundRect(RectF(0f, 0f, w.toFloat(), h.toFloat()), dp(24f), dp(24f), bgPaint)

    val pad = dp(14f)
    val streak = WidgetStore.currentStreak(snap.days, today)
    val total = WidgetStore.totalStudiedDays(snap.days)
    val todayXp = snap.days[today] ?: 0

    val compact = hDp < 100
    val titlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = TEXT
      textSize = dp(if (compact) 13f else 16f)
      typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
    }
    val subPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = MUTED
      textSize = dp(if (compact) 10f else 11.5f)
    }
    val firePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = FIRE
      textSize = titlePaint.textSize
      typeface = titlePaint.typeface
    }

    // Header
    val headerBaseline = pad + titlePaint.textSize * 0.9f
    val fireText = "🔥 $streak"
    c.drawText(fireText, pad, headerBaseline, firePaint)
    val fireW = firePaint.measureText(fireText)
    val label = if (streak == 1) " dia seguido" else " dias seguidos"
    c.drawText(label, pad + fireW, headerBaseline, titlePaint)

    val rightText = if (todayXp > 0) "hoje: $todayXp XP ✓" else "estude hoje!"
    val rightPaint = Paint(subPaint).apply {
      color = if (todayXp > 0) LEVELS[4] else FIRE
      typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
    }
    val rw = rightPaint.measureText(rightText)
    if (pad + fireW + titlePaint.measureText(label) + rw + dp(12f) < w - pad) {
      c.drawText(rightText, w - pad - rw, headerBaseline, rightPaint)
    }

    var top = headerBaseline + dp(if (compact) 6f else 8f)
    if (!compact) {
      val sub = "$total dias estudados · nível ${snap.level} · ${snap.totalXp} XP"
      c.drawText(sub, pad, top + subPaint.textSize, subPaint)
      top += subPaint.textSize + dp(8f)
    }

    // Grid area
    val legendH = if (compact) 0f else dp(14f)
    val monthH = if (compact) 0f else dp(12f)
    val gridTop = top + monthH
    val gridBottom = h - pad - legendH
    val availH = gridBottom - gridTop
    val availW = w - 2 * pad
    val gapRatio = 0.22f
    // cell size from height (7 rows)
    var cell = availH / (7 + 6 * gapRatio)
    var gap = cell * gapRatio
    var weeks = floor((availW + gap) / (cell + gap)).toInt()
    if (weeks > 53) {
      weeks = 53
    }
    if (weeks < 4) {
      weeks = 4
      cell = availW / (weeks + (weeks - 1) * gapRatio)
      gap = cell * gapRatio
    }
    val gridW = weeks * cell + (weeks - 1) * gap
    val left = pad + (availW - gridW) / 2f

    // Column 0 starts on the Sunday (weeks-1) weeks before this week's Sunday.
    val dowToday = today.dayOfWeek.value % 7 // Sunday=0
    val thisSunday = today.minusDays(dowToday.toLong())
    val firstSunday = thisSunday.minusWeeks((weeks - 1).toLong())

    val cellPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    val outline = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      style = Paint.Style.STROKE
      strokeWidth = max(1f, dp(1.4f))
      color = if (todayXp > 0) TEXT else FIRE
    }
    val monthPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = MUTED
      textSize = dp(9.5f)
    }
    val r = cell * 0.22f
    var lastMonth = -1
    var lastLabelRight = -1000f
    for (col in 0 until weeks) {
      val colSunday = firstSunday.plusWeeks(col.toLong())
      val x = left + col * (cell + gap)
      // month labels
      if (monthH > 0f) {
        val m = colSunday.plusDays(6).monthValue
        if (m != lastMonth) {
          val name = colSunday.plusDays(6).month.getDisplayName(TextStyle.SHORT, Locale("pt", "BR")).replace(".", "")
          if (x > lastLabelRight + dp(4f) && col < weeks - 1) {
            c.drawText(name, x, gridTop - dp(3f), monthPaint)
            lastLabelRight = x + monthPaint.measureText(name)
          }
          lastMonth = m
        }
      }
      for (row in 0 until 7) {
        val day = colSunday.plusDays(row.toLong())
        if (day.isAfter(today)) continue
        val xp = snap.days[day] ?: 0
        cellPaint.color = LEVELS[level(xp, snap.dailyGoal)]
        val y = gridTop + row * (cell + gap)
        val rect = RectF(x, y, x + cell, y + cell)
        c.drawRoundRect(rect, r, r, cellPaint)
        if (day == today) {
          val inset = outline.strokeWidth / 2f
          c.drawRoundRect(RectF(x + inset, y + inset, x + cell - inset, y + cell - inset), r, r, outline)
        }
      }
    }

    // Legend
    if (legendH > 0f) {
      val lp = Paint(subPaint).apply { textSize = dp(9.5f) }
      val ls = min(cell, dp(10f))
      val y = h - pad - ls
      var x = w - pad - (5 * (ls + dp(3f))) - lp.measureText("Mais") - dp(4f)
      val lessW = lp.measureText("Menos")
      c.drawText("Menos", x - lessW - dp(4f), y + ls * 0.85f, lp)
      for (i in 0 until 5) {
        cellPaint.color = LEVELS[i]
        c.drawRoundRect(RectF(x, y, x + ls, y + ls), ls * 0.22f, ls * 0.22f, cellPaint)
        x += ls + dp(3f)
      }
      c.drawText("Mais", x + dp(1f), y + ls * 0.85f, lp)
      c.drawText("Engineer Academy", pad, y + ls * 0.85f, lp)
    }
    return bmp
  }

  @Suppress("unused")
  private fun isWeekend(d: LocalDate) = d.dayOfWeek == DayOfWeek.SATURDAY || d.dayOfWeek == DayOfWeek.SUNDAY
}
