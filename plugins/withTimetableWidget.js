const fs = require("fs");
const path = require("path");
const { withAndroidManifest, withDangerousMod } = require("expo/config-plugins");

const WEEK_LAYOUT = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="10dp"
    android:background="@drawable/widget_bg">
    <TextView
        android:id="@+id/widget_title"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:textSize="12sp"
        android:textStyle="bold"
        android:textColor="#111827"
        android:maxLines="1"
        android:ellipsize="end"
        android:text="课表" />
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:orientation="horizontal"
        android:paddingTop="6dp">
__COLS__
    </LinearLayout>
</LinearLayout>`;

const COL = `        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1"
            android:orientation="vertical"
            android:paddingLeft="1dp"
            android:paddingRight="1dp">
            <TextView
                android:id="@+id/day__I___label"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:gravity="center"
                android:textSize="9sp"
                android:textColor="#6B7280"
                android:maxLines="1" />
            <TextView
                android:id="@+id/day__I___body"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="3dp"
                android:textSize="8sp"
                android:textColor="#111827"
                android:lineSpacingExtra="2dp" />
        </LinearLayout>`;

const TODAY_LAYOUT = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="12dp"
    android:background="@drawable/widget_bg">
    <TextView
        android:id="@+id/widget_today_title"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:textSize="12sp"
        android:textStyle="bold"
        android:textColor="#111827"
        android:text="今天" />
    <TextView
        android:id="@+id/widget_today_sub"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:textSize="10sp"
        android:textColor="#6B7280"
        android:layout_marginTop="2dp" />
__ROWS__
</LinearLayout>`;

const ROW = `    <LinearLayout
        android:id="@+id/row__I__"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:layout_marginTop="6dp">
        <TextView
            android:id="@+id/row__I___time"
            android:layout_width="42dp"
            android:layout_height="wrap_content"
            android:textSize="10sp"
            android:textColor="#2F5BFF"
            android:textStyle="bold" />
        <TextView
            android:id="@+id/row__I___name"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:textSize="11sp"
            android:textColor="#111827"
            android:maxLines="1"
            android:ellipsize="end" />
        <TextView
            android:id="@+id/row__I___room"
            android:layout_width="72dp"
            android:layout_height="wrap_content"
            android:textSize="9sp"
            android:textColor="#6B7280"
            android:maxLines="1"
            android:ellipsize="end"
            android:gravity="end" />
    </LinearLayout>`;

const WIDGET_BG = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#FFFFFF" />
    <corners android:radius="16dp" />
    <stroke android:width="1dp" android:color="#E5E7EB" />
</shape>`;

const INFO_WEEK = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="320dp"
    android:minHeight="180dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/widget_week"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />`;

const INFO_TODAY = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/widget_today"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />`;

const DATA_KT = `package __PKG__.widget

import android.content.Context
import org.json.JSONObject
import java.io.File

object WidgetData {
  fun load(context: Context): JSONObject? {
    return try {
      val file = File(context.filesDir, "widget-data.json")
      if (!file.exists()) null else JSONObject(file.readText())
    } catch (e: Exception) {
      null
    }
  }
}`;

const WEEK_KT = `package __PKG__.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews

class WeekWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    val views = build(context)
    appWidgetIds.forEach { appWidgetManager.updateAppWidget(it, views) }
  }

  private fun id(context: Context, name: String): Int =
    context.resources.getIdentifier(name, "id", context.packageName)

  private fun build(context: Context): RemoteViews {
    val views = RemoteViews(context.packageName, context.resources.getIdentifier("widget_week", "layout", context.packageName))
    val data = WidgetData.load(context)
    views.setTextViewText(id(context, "widget_title"), data?.optString("title") ?: "课表：打开应用后生成")

    val days = data?.optJSONArray("days")
    for (i in 0 until 7) {
      val day = if (days != null && i < days.length()) days.optJSONObject(i) else null
      views.setTextViewText(id(context, "day" + i + "_label"), day?.optString("label") ?: "")
      val lines = StringBuilder()
      val arr = day?.optJSONArray("lines")
      if (arr != null) {
        for (j in 0 until arr.length()) {
          if (j > 0) lines.append("\n")
          lines.append(arr.optString(j))
        }
      }
      views.setTextViewText(id(context, "day" + i + "_body"), lines.toString())
    }

    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
    if (launch != null) {
      val pi = PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      views.setOnClickPendingIntent(id(context, "widget_root"), pi)
    }
    return views
  }
}`;

const TODAY_KT = `package __PKG__.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.view.View
import android.widget.RemoteViews

class TodayWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    val views = build(context)
    appWidgetIds.forEach { appWidgetManager.updateAppWidget(it, views) }
  }

  private fun id(context: Context, name: String): Int =
    context.resources.getIdentifier(name, "id", context.packageName)

  private fun build(context: Context): RemoteViews {
    val views = RemoteViews(context.packageName, context.resources.getIdentifier("widget_today", "layout", context.packageName))
    val data = WidgetData.load(context)
    views.setTextViewText(id(context, "widget_today_title"), data?.optString("todayTitle") ?: "今天")
    views.setTextViewText(id(context, "widget_today_sub"), data?.optString("todaySub") ?: "打开应用同步课表")

    val items = data?.optJSONArray("todayItems")
    for (i in 0 until 6) {
      val rowId = id(context, "row" + i)
      val item = if (items != null && i < items.length()) items.optJSONObject(i) else null
      if (item == null) {
        views.setViewVisibility(rowId, View.GONE)
      } else {
        views.setViewVisibility(rowId, View.VISIBLE)
        views.setTextViewText(id(context, "row" + i + "_time"), item.optString("time"))
        views.setTextViewText(id(context, "row" + i + "_name"), item.optString("name"))
        views.setTextViewText(id(context, "row" + i + "_room"), item.optString("room"))
      }
    }

    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
    if (launch != null) {
      val pi = PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      views.setOnClickPendingIntent(id(context, "widget_root"), pi)
    }
    return views
  }
}`;

module.exports = function withTimetableWidget(config) {
  const pkg = config.android?.package || "com.example.app";

  config = withDangerousMod(config, [
    "android",
    async (cfg) => {
      const root = cfg.modRequest.platformProjectRoot; // .../android
      const javaDir = path.join(root, "app", "src", "main", "java", ...pkg.split("."), "widget");
      const resDir = path.join(root, "app", "src", "main", "res");
      fs.mkdirSync(javaDir, { recursive: true });
      fs.mkdirSync(path.join(resDir, "layout"), { recursive: true });
      fs.mkdirSync(path.join(resDir, "xml"), { recursive: true });
      fs.mkdirSync(path.join(resDir, "drawable"), { recursive: true });

      const cols = Array.from({ length: 7 }, (_, i) => COL.replace(/__I__/g, String(i))).join("\n");
      const rows = Array.from({ length: 6 }, (_, i) => ROW.replace(/__I__/g, String(i))).join("\n");

      fs.writeFileSync(path.join(root, "app", "src", "main", "res", "layout", "widget_week.xml"), WEEK_LAYOUT.replace("__COLS__", cols));
      fs.writeFileSync(path.join(root, "app", "src", "main", "res", "layout", "widget_today.xml"), TODAY_LAYOUT.replace("__ROWS__", rows));
      fs.writeFileSync(path.join(root, "app", "src", "main", "res", "drawable", "widget_bg.xml"), WIDGET_BG);
      fs.writeFileSync(path.join(root, "app", "src", "main", "res", "xml", "widget_week_info.xml"), INFO_WEEK);
      fs.writeFileSync(path.join(root, "app", "src", "main", "res", "xml", "widget_today_info.xml"), INFO_TODAY);

      fs.writeFileSync(path.join(javaDir, "WidgetData.kt"), DATA_KT.replace(/__PKG__/g, pkg));
      fs.writeFileSync(path.join(javaDir, "WeekWidgetProvider.kt"), WEEK_KT.replace(/__PKG__/g, pkg));
      fs.writeFileSync(path.join(javaDir, "TodayWidgetProvider.kt"), TODAY_KT.replace(/__PKG__/g, pkg));
      return cfg;
    },
  ]);

  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;
    app.receiver = app.receiver || [];
    const exists = (name) => app.receiver.some((r) => r.$?.["android:name"] === name);
    if (!exists(pkg + ".widget.WeekWidgetProvider")) {
      app.receiver.push({
        $: { "android:name": pkg + ".widget.WeekWidgetProvider", "android:exported": "true" },
        "intent-filter": [{ action: [{ $: { "android:name": "android.appwidget.action.APPWIDGET_UPDATE" } }] }],
        "meta-data": [{ $: { "android:name": "android.appwidget.provider", "android:resource": "@xml/widget_week_info" } }],
      });
    }
    if (!exists(pkg + ".widget.TodayWidgetProvider")) {
      app.receiver.push({
        $: { "android:name": pkg + ".widget.TodayWidgetProvider", "android:exported": "true" },
        "intent-filter": [{ action: [{ $: { "android:name": "android.appwidget.action.APPWIDGET_UPDATE" } }] }],
        "meta-data": [{ $: { "android:name": "android.appwidget.provider", "android:resource": "@xml/widget_today_info" } }],
      });
    }
    return cfg;
  });

  return config;
};