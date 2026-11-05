package expo.modules.streakwidget

import android.content.Context
import org.json.JSONObject
import java.time.LocalDate

/**
 * Persists the study history written by the JS side so the widget can render
 * on its own (even when the app is closed).
 *
 * Payload (JSON):
 * {
 *   "days": { "2026-11-05": 120, "2026-11-04": 40, ... },   // XP per day
 *   "dailyGoal": 50,
 *   "totalXp": 1234,
 *   "level": 7
 * }
 */
object WidgetStore {
  private const val PREFS = "engineer_academy_widget"
  private const val KEY = "payload"

  data class Snapshot(
    val days: Map<LocalDate, Int>,
    val dailyGoal: Int,
    val totalXp: Int,
    val level: Int,
  )

  fun save(context: Context, json: String) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY, json)
      .apply()
  }

  fun load(context: Context): Snapshot {
    val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null)
    if (raw.isNullOrBlank()) return Snapshot(emptyMap(), 50, 0, 1)
    return try {
      val obj = JSONObject(raw)
      val daysObj = obj.optJSONObject("days")
      val map = HashMap<LocalDate, Int>()
      if (daysObj != null) {
        val it = daysObj.keys()
        while (it.hasNext()) {
          val k = it.next()
          try {
            map[LocalDate.parse(k)] = daysObj.optInt(k, 0)
          } catch (_: Exception) {
          }
        }
      }
      Snapshot(
        days = map,
        dailyGoal = obj.optInt("dailyGoal", 50).coerceAtLeast(1),
        totalXp = obj.optInt("totalXp", 0),
        level = obj.optInt("level", 1),
      )
    } catch (_: Exception) {
      Snapshot(emptyMap(), 50, 0, 1)
    }
  }

  /** Consecutive studied days ending today (or yesterday, if today is still open). */
  fun currentStreak(days: Map<LocalDate, Int>, today: LocalDate = LocalDate.now()): Int {
    var d = if ((days[today] ?: 0) > 0) today else today.minusDays(1)
    var count = 0
    while ((days[d] ?: 0) > 0) {
      count++
      d = d.minusDays(1)
    }
    return count
  }

  fun totalStudiedDays(days: Map<LocalDate, Int>): Int = days.values.count { it > 0 }
}
