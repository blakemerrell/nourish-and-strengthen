package com.blakemerrell.nourish

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.BodyFatRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ExerciseSegment
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.records.LeanBodyMassRecord
import androidx.health.connect.client.records.MealType
import androidx.health.connect.client.records.NutritionRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.RespiratoryRateRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.records.Vo2MaxRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.records.metadata.Metadata
import androidx.health.connect.client.aggregate.AggregateMetric
import androidx.health.connect.client.request.AggregateGroupByPeriodRequest
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.health.connect.client.units.Energy
import androidx.health.connect.client.units.Mass
import androidx.lifecycle.lifecycleScope
import androidx.webkit.WebViewAssetLoader
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withPermit
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.Period
import java.time.ZoneId
import kotlin.reflect.KClass
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.roundToInt

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var pendingWebPermissionRequest: PermissionRequest? = null
    private val otaSyncRunning = AtomicBoolean(false)
    private val otaLock = Any()

    companion object {
        private const val OTA_BASE_URL = "https://blakemerrell.github.io/nourish-and-strengthen"
    }

    /* Everything Health Connect holds that this app has a use for
       (Blake, 2026-10-30: "get it so we get ALL of health connect data that
       makes sense to get on this end"). Read: activity (steps, distance,
       active and total calories, workouts from the watch), the heart
       (resting rate, variability, and the rate during a workout), sleep with
       its stages, the body (weight, body fat, lean mass, VO2 max) and the
       night's breathing (oxygen saturation, respiratory rate). Left out on
       purpose: hydration and nutrition reads, which would count food and
       water this app already logs a second time. Write: as before. */
    private val readTypes: List<KClass<out Record>> = listOf(
        StepsRecord::class, SleepSessionRecord::class, WeightRecord::class,
        DistanceRecord::class, ActiveCaloriesBurnedRecord::class, TotalCaloriesBurnedRecord::class,
        ExerciseSessionRecord::class, HeartRateRecord::class, RestingHeartRateRecord::class,
        HeartRateVariabilityRmssdRecord::class, BodyFatRecord::class, LeanBodyMassRecord::class,
        Vo2MaxRecord::class, OxygenSaturationRecord::class, RespiratoryRateRecord::class
    )

    private val healthPermissions: Set<String> =
        readTypes.map { HealthPermission.getReadPermission(it) }.toSet() + setOf(
            "android.permission.health.READ_HEALTH_DATA_HISTORY",
            HealthPermission.getWritePermission(WeightRecord::class),
            HealthPermission.getWritePermission(ExerciseSessionRecord::class),
            HealthPermission.getWritePermission(NutritionRecord::class)
        )

    private val requestHealthPermissionsLauncher = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract()
    ) { _ ->
        lifecycleScope.launch {
            syncHealthDataToWeb()
        }
    }

    private val requestCameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        val req = pendingWebPermissionRequest
        pendingWebPermissionRequest = null
        if (req != null) {
            if (granted) {
                req.grant(req.resources)
            } else {
                req.deny()
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val isNight = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
        val chromeColor = 0xFF26211C.toInt()

        val statusBarResId = resources.getIdentifier("status_bar_height", "dimen", "android")
        val statusBarDimenPx = if (statusBarResId > 0) resources.getDimensionPixelSize(statusBarResId) else 0
        val density = resources.displayMetrics.density
        val minTopInsetPx = maxOf(statusBarDimenPx, (48f * density).roundToInt())
        val minBottomInsetPx = (24f * density).roundToInt()

        val rootLayout = FrameLayout(this).apply {
            setBackgroundColor(chromeColor)
            setPadding(0, minTopInsetPx, 0, minBottomInsetPx)
        }
        webView = WebView(this)
        rootLayout.addView(
            webView,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )
        setContentView(rootLayout)

        WindowInsetsControllerCompat(window, window.decorView).apply {
            // Top bar (--chrome) is always dark in both light and dark themes
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = !isNight
        }

        val applySafeInsets = { dispatched: WindowInsetsCompat? ->
            val rootInsets = ViewCompat.getRootWindowInsets(window.decorView)
            val barsMask = WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            val imeMask = WindowInsetsCompat.Type.ime()
            val rootBars = rootInsets?.getInsets(barsMask)
            val dispBars = dispatched?.getInsets(barsMask)
            val rootIme = rootInsets?.getInsets(imeMask)
            val dispIme = dispatched?.getInsets(imeMask)

            val topPx = maxOf(minTopInsetPx, rootBars?.top ?: 0, dispBars?.top ?: 0)
            val bottomPx = maxOf(
                minBottomInsetPx,
                rootBars?.bottom ?: 0,
                dispBars?.bottom ?: 0,
                rootIme?.bottom ?: 0,
                dispIme?.bottom ?: 0
            )
            val leftPx = maxOf(rootBars?.left ?: 0, dispBars?.left ?: 0)
            val rightPx = maxOf(rootBars?.right ?: 0, dispBars?.right ?: 0)
            rootLayout.setPadding(leftPx, topPx, rightPx, bottomPx)
        }

        ViewCompat.setOnApplyWindowInsetsListener(window.decorView) { v, windowInsets ->
            applySafeInsets(windowInsets)
            ViewCompat.onApplyWindowInsets(v, windowInsets)
        }
        ViewCompat.setOnApplyWindowInsetsListener(rootLayout) { _, windowInsets ->
            applySafeInsets(windowInsets)
            WindowInsetsCompat.CONSUMED
        }
        rootLayout.post { applySafeInsets(null) }

        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
            setSupportMultipleWindows(false)
        }

        webView.addJavascriptInterface(NourishBridge(), "NourishAndroid")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                val url = request.url
                if (url.host == "appassets.androidplatform.net") {
                    val path = url.path ?: ""
                    if (path.startsWith("/assets/public/")) {
                        val relPath = path.removePrefix("/assets/public/").ifEmpty { "index.html" }
                        if (!relPath.contains("..")) {
                            val otaBytes = synchronized(otaLock) {
                                val f = File(otaLiveDir(), relPath)
                                if (f.isFile && f.length() > 0L) f.readBytes() else null
                            }
                            if (otaBytes != null) {
                                return WebResourceResponse(
                                    mimeTypeFor(relPath),
                                    encodingFor(relPath),
                                    200,
                                    "OK",
                                    mapOf(
                                        "Cache-Control" to "no-store",
                                        "Access-Control-Allow-Origin" to "*"
                                    ),
                                    otaBytes.inputStream()
                                )
                            }
                        }
                    }
                }
                val assetRes = assetLoader.shouldInterceptRequest(url)
                if (assetRes != null) {
                    val headers = (assetRes.responseHeaders ?: emptyMap()).toMutableMap()
                    headers["Cache-Control"] = "no-store"
                    assetRes.responseHeaders = headers
                }
                return assetRes
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val url = request.url
                if (url.host == "appassets.androidplatform.net") {
                    return false
                }
                return try {
                    startActivity(Intent(Intent.ACTION_VIEW, url))
                    true
                } catch (_: Exception) {
                    true
                }
            }

            override fun onPageFinished(view: WebView, url: String?) {
                super.onPageFinished(view, url)
                lifecycleScope.launch {
                    if (currentHealthStatus() == "granted") {
                        syncHealthDataToWeb()
                    }
                }
                lifecycleScope.launch {
                    syncOtaBundle()
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                if (request.resources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
                    if (ContextCompat.checkSelfPermission(
                            this@MainActivity,
                            Manifest.permission.CAMERA
                        ) == PackageManager.PERMISSION_GRANTED
                    ) {
                        request.grant(request.resources)
                    } else {
                        pendingWebPermissionRequest = request
                        requestCameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                    }
                } else {
                    request.deny()
                }
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        webView.loadUrl("https://appassets.androidplatform.net/assets/public/index.html")
    }

    override fun onResume() {
        super.onResume()
        lifecycleScope.launch {
            if (currentHealthStatus() == "granted") {
                askForNewPermissionsOnce()
                syncHealthDataToWeb()
            }
        }
        lifecycleScope.launch {
            syncOtaBundle()
        }
    }

    private fun prefs() = getSharedPreferences("nourish_health", Context.MODE_PRIVATE)

    private fun otaLiveDir(): File = File(filesDir, "ota_live")

    private fun mimeTypeFor(relPath: String): String {
        val lower = relPath.lowercase()
        return when {
            lower.endsWith(".html") -> "text/html"
            lower.endsWith(".js") -> "application/javascript"
            lower.endsWith(".css") -> "text/css"
            lower.endsWith(".webmanifest") -> "application/manifest+json"
            lower.endsWith(".json") -> "application/json"
            lower.endsWith(".svg") -> "image/svg+xml"
            lower.endsWith(".png") -> "image/png"
            lower.endsWith(".webp") -> "image/webp"
            lower.endsWith(".gif") -> "image/gif"
            lower.endsWith(".woff2") -> "font/woff2"
            else -> "application/octet-stream"
        }
    }

    private fun encodingFor(relPath: String): String? {
        val lower = relPath.lowercase()
        return if (
            lower.endsWith(".html") ||
            lower.endsWith(".js") ||
            lower.endsWith(".css") ||
            lower.endsWith(".webmanifest") ||
            lower.endsWith(".json") ||
            lower.endsWith(".svg")
        ) {
            "UTF-8"
        } else {
            null
        }
    }

    private fun fetchUrlBytes(urlStr: String): ByteArray {
        val conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 6000
            readTimeout = 10000
            useCaches = false
            setRequestProperty("Cache-Control", "no-cache")
        }
        return try {
            val code = conn.responseCode
            if (code !in 200..299) {
                throw IllegalStateException("HTTP $code for $urlStr")
            }
            conn.inputStream.use { it.readBytes() }
        } finally {
            conn.disconnect()
        }
    }

    private suspend fun syncOtaBundle() {
        if (!otaSyncRunning.compareAndSet(false, true)) return
        try {
            val updatedVersion = withContext(Dispatchers.IO) {
                try {
                    val now = System.currentTimeMillis()
                    val swBytes = fetchUrlBytes("$OTA_BASE_URL/sw.js?_t=$now")
                    val swText = swBytes.toString(Charsets.UTF_8)
                    val verMatch = Regex("""\bVERSION\s*=\s*'(\d+)'""").find(swText)
                    val version = verMatch?.groupValues?.getOrNull(1).orEmpty()
                    if (version.isEmpty() || version == "0") return@withContext null

                    val currentVer = prefs().getString("ota_version", "").orEmpty()
                    val liveDir = otaLiveDir()
                    if (
                        version == currentVer &&
                        File(liveDir, "index.html").isFile &&
                        File(liveDir, "sw.js").isFile
                    ) {
                        return@withContext version
                    }

                    val indexBytes = fetchUrlBytes("$OTA_BASE_URL/index.html?_t=$now")
                    val indexHtml = indexBytes.toString(Charsets.UTF_8)
                    if (!indexHtml.contains("v=$version")) {
                        // Edge CDN has not finished propagating index.html for this version yet
                        return@withContext null
                    }

                    val coreBlock = Regex("""\bCORE\s*=\s*\[([^\]]+)]""").find(swText)
                        ?.groupValues?.getOrNull(1).orEmpty()
                    val coreEntries = Regex("""'([^']+)'|"([^"]+)"""")
                        .findAll(coreBlock)
                        .map { (it.groupValues[1].ifEmpty { it.groupValues[2] }).trim() }
                        .filter { it.isNotEmpty() }
                        .toList()
                    if (coreEntries.isEmpty()) return@withContext null

                    val relFiles = coreEntries
                        .map { it.removePrefix("./").substringBefore("?").substringBefore("#") }
                        .filter { it.isNotEmpty() && !it.contains("..") && it != "index.html" }
                        .distinct()

                    val stageDir = File(filesDir, "ota_stage")
                    stageDir.deleteRecursively()
                    stageDir.mkdirs()

                    File(stageDir, "sw.js").writeBytes(swBytes)
                    File(stageDir, "index.html").writeBytes(indexBytes)

                    val sem = Semaphore(10)
                    coroutineScope {
                        relFiles.map { rel ->
                            async {
                                sem.withPermit {
                                    val query = if (rel.endsWith(".js") || rel.endsWith(".css")) {
                                        "?v=$version"
                                    } else {
                                        "?_t=$now"
                                    }
                                    val bytes = fetchUrlBytes("$OTA_BASE_URL/$rel$query")
                                    val dest = File(stageDir, rel)
                                    dest.parentFile?.mkdirs()
                                    dest.writeBytes(bytes)
                                }
                            }
                        }.awaitAll()
                    }

                    synchronized(otaLock) {
                        val oldDir = File(filesDir, "ota_old")
                        oldDir.deleteRecursively()
                        if (liveDir.exists()) {
                            liveDir.renameTo(oldDir)
                        }
                        if (!stageDir.renameTo(liveDir)) {
                            stageDir.copyRecursively(liveDir, overwrite = true)
                            stageDir.deleteRecursively()
                        }
                        oldDir.deleteRecursively()
                        prefs().edit()
                            .putString("ota_version", version)
                            .putLong("ota_updated_at", System.currentTimeMillis())
                            .apply()
                    }
                    version
                } catch (_: Exception) {
                    null
                }
            }

            if (!updatedVersion.isNullOrEmpty()) {
                withContext(Dispatchers.Main) {
                    val qVer = JSONObject.quote(updatedVersion)
                    val js = """
                        (function(targetVer) {
                          if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
                            navigator.serviceWorker.getRegistration().then(function(r) {
                              if (r) r.update();
                            });
                          }
                          var s = document.querySelector('script[src*="src/app.js"]');
                          var src = s ? (s.getAttribute('src') || '') : '';
                          if (src && src.indexOf('v=' + targetVer) < 0) {
                            var busy = function () {
                              if (window.__editing) return true;
                              var a = document.activeElement;
                              if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return true;
                              if (document.querySelector('#modalRoot .sheet, #trainRoot .sheet, #dialogRoot .dlg')) return true;
                              try { if (window.Train && window.Train.busy && window.Train.busy()) return true; } catch (e) {}
                              return false;
                            };
                            setTimeout(function go() {
                              if (busy()) { setTimeout(go, 2000); return; }
                              location.reload();
                            }, 400);
                          }
                        })($qVer);
                    """.trimIndent()
                    webView.evaluateJavascript(js, null)
                }
            }
        } finally {
            otaSyncRunning.set(false)
        }
    }

    /* A phone that connected before this version granted steps, sleep and
       weight only. Ask once for what has been added since, then leave it to
       the Connect button in Settings: asking on every open would nag. */
    private suspend fun askForNewPermissionsOnce() {
        try {
            val client = HealthConnectClient.getOrCreate(this@MainActivity)
            val granted = client.permissionController.getGrantedPermissions()
            val missing = healthPermissions - granted
            val askedFor = prefs().getInt("perm_ask_count", 0)
            if (missing.isNotEmpty() && askedFor < healthPermissions.size) {
                prefs().edit().putInt("perm_ask_count", healthPermissions.size).apply()
                withContext(Dispatchers.Main) {
                    requestHealthPermissionsLauncher.launch(healthPermissions)
                }
            }
        } catch (_: Exception) {
            // nothing asked; the Settings button still can
        }
    }

    private fun exerciseName(t: Int): String = when (t) {
        ExerciseSessionRecord.EXERCISE_TYPE_GOLF -> "Golf"
        ExerciseSessionRecord.EXERCISE_TYPE_WALKING -> "Walk"
        ExerciseSessionRecord.EXERCISE_TYPE_RUNNING -> "Run"
        ExerciseSessionRecord.EXERCISE_TYPE_RUNNING_TREADMILL -> "Treadmill run"
        ExerciseSessionRecord.EXERCISE_TYPE_BIKING -> "Ride"
        ExerciseSessionRecord.EXERCISE_TYPE_BIKING_STATIONARY -> "Bike"
        ExerciseSessionRecord.EXERCISE_TYPE_HIKING -> "Hike"
        ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING -> "Strength"
        ExerciseSessionRecord.EXERCISE_TYPE_WEIGHTLIFTING -> "Weights"
        ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_POOL -> "Swim"
        ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_OPEN_WATER -> "Swim"
        ExerciseSessionRecord.EXERCISE_TYPE_YOGA -> "Yoga"
        ExerciseSessionRecord.EXERCISE_TYPE_ELLIPTICAL -> "Elliptical"
        ExerciseSessionRecord.EXERCISE_TYPE_ROWING_MACHINE -> "Rowing"
        ExerciseSessionRecord.EXERCISE_TYPE_STAIR_CLIMBING_MACHINE -> "Stairs"
        ExerciseSessionRecord.EXERCISE_TYPE_HIGH_INTENSITY_INTERVAL_TRAINING -> "HIIT"
        ExerciseSessionRecord.EXERCISE_TYPE_TENNIS -> "Tennis"
        ExerciseSessionRecord.EXERCISE_TYPE_BASKETBALL -> "Basketball"
        ExerciseSessionRecord.EXERCISE_TYPE_SKIING -> "Skiing"
        ExerciseSessionRecord.EXERCISE_TYPE_SNOWBOARDING -> "Snowboarding"
        else -> "Workout"
    }

    /* Read records in 30-day windows so a 120-day range never hits Health
       Connect's single-call page cap (~1,000-5,000 records) or 30-day window
       quirk on older providers. De-duplicates on metadata.id across chunk
       boundaries. */
    private suspend fun <T : Record> readRecordsChunked(
        client: HealthConnectClient,
        recordType: KClass<T>,
        from: java.time.Instant,
        to: java.time.Instant
    ): List<T> {
        val out = mutableListOf<T>()
        val seen = mutableSetOf<String>()
        var cur = from
        val step = Duration.ofDays(30)
        while (cur.isBefore(to)) {
            val nxt = minOf(cur.plus(step), to)
            var pageToken: String? = null
            do {
                val resp = client.readRecords(
                    ReadRecordsRequest(
                        recordType = recordType,
                        timeRangeFilter = TimeRangeFilter.between(cur, nxt),
                        pageToken = pageToken
                    )
                )
                for (r in resp.records) {
                    val id = r.metadata.id
                    if (id.isEmpty() || seen.add(id)) out.add(r)
                }
                pageToken = resp.pageToken
            } while (!pageToken.isNullOrEmpty())
            cur = nxt
        }
        return out
    }

    /* The extra reads, all over the same window (up to 120 days when
       READ_HEALTH_DATA_HISTORY is granted, otherwise 30 days), merged into
       the day objects the web side already takes. Each block stands alone:
       a type not granted, or one that throws, leaves the rest untouched. */
    private suspend fun readExtras(
        client: HealthConnectClient,
        granted: Set<String>,
        zone: ZoneId,
        startDay: LocalDate,
        today: LocalDate,
        daysJson: JSONObject
    ): org.json.JSONArray? {
        fun can(t: KClass<out Record>) = granted.contains(HealthPermission.getReadPermission(t))
        fun dayOf(k: String): JSONObject = daysJson.optJSONObject(k) ?: JSONObject().also { daysJson.put(k, it) }
        val from = startDay.atStartOfDay(zone).toInstant()
        val to = today.plusDays(1).atStartOfDay(zone).toInstant()

        // Day totals in one grouped call: only the metrics granted, since one
        // missing permission fails the whole request.
        val metrics = mutableSetOf<AggregateMetric<*>>()
        if (can(DistanceRecord::class)) metrics.add(DistanceRecord.DISTANCE_TOTAL)
        if (can(ActiveCaloriesBurnedRecord::class)) metrics.add(ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL)
        if (can(TotalCaloriesBurnedRecord::class)) metrics.add(TotalCaloriesBurnedRecord.ENERGY_TOTAL)
        if (can(RestingHeartRateRecord::class)) metrics.add(RestingHeartRateRecord.BPM_AVG)
        if (metrics.isNotEmpty()) {
            try {
                val rows = client.aggregateGroupByPeriod(
                    AggregateGroupByPeriodRequest(
                        metrics = metrics,
                        timeRangeFilter = TimeRangeFilter.between(
                            startDay.atStartOfDay(), today.plusDays(1).atStartOfDay()
                        ),
                        timeRangeSlicer = Period.ofDays(1)
                    )
                )
                for (r in rows) {
                    val k = r.startTime.toLocalDate().toString()
                    val res = r.result
                    res[DistanceRecord.DISTANCE_TOTAL]?.let { if (it.inMeters > 0) dayOf(k).put("distM", it.inMeters.roundToInt()) }
                    res[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.let { if (it.inKilocalories > 0) dayOf(k).put("actKcal", it.inKilocalories.roundToInt()) }
                    res[TotalCaloriesBurnedRecord.ENERGY_TOTAL]?.let { if (it.inKilocalories > 0) dayOf(k).put("totKcal", it.inKilocalories.roundToInt()) }
                    res[RestingHeartRateRecord.BPM_AVG]?.let { if (it > 0) dayOf(k).put("rhr", it) }
                }
            } catch (_: Exception) {
                // no day totals this time
            }
        }

        // Heart rate variability: the day's mean RMSSD.
        if (can(HeartRateVariabilityRmssdRecord::class)) {
            try {
                val byDay = mutableMapOf<String, MutableList<Double>>()
                readRecordsChunked(client, HeartRateVariabilityRmssdRecord::class, from, to).forEach {
                    byDay.getOrPut(it.time.atZone(zone).toLocalDate().toString()) { mutableListOf() }
                        .add(it.heartRateVariabilityMillis)
                }
                for ((k, v) in byDay) dayOf(k).put("hrv", (v.average() * 10).roundToInt() / 10.0)
            } catch (_: Exception) { }
        }

        // The body: the day's last reading of each.
        if (can(BodyFatRecord::class)) {
            try {
                readRecordsChunked(client, BodyFatRecord::class, from, to)
                    .groupBy { it.time.atZone(zone).toLocalDate().toString() }
                    .forEach { (k, v) -> v.maxByOrNull { it.time }?.let { dayOf(k).put("bodyFat", (it.percentage.value * 10).roundToInt() / 10.0) } }
            } catch (_: Exception) { }
        }
        if (can(LeanBodyMassRecord::class)) {
            try {
                readRecordsChunked(client, LeanBodyMassRecord::class, from, to)
                    .groupBy { it.time.atZone(zone).toLocalDate().toString() }
                    .forEach { (k, v) -> v.maxByOrNull { it.time }?.let { dayOf(k).put("leanLb", (it.mass.inPounds * 10).roundToInt() / 10.0) } }
            } catch (_: Exception) { }
        }
        if (can(Vo2MaxRecord::class)) {
            try {
                readRecordsChunked(client, Vo2MaxRecord::class, from, to)
                    .groupBy { it.time.atZone(zone).toLocalDate().toString() }
                    .forEach { (k, v) -> v.maxByOrNull { it.time }?.let { dayOf(k).put("vo2", (it.vo2MillilitersPerMinuteKilogram * 10).roundToInt() / 10.0) } }
            } catch (_: Exception) { }
        }
        // The night's breathing: means, filed on the morning they end in.
        if (can(OxygenSaturationRecord::class)) {
            try {
                readRecordsChunked(client, OxygenSaturationRecord::class, from, to)
                    .groupBy { it.time.atZone(zone).toLocalDate().toString() }
                    .forEach { (k, v) -> dayOf(k).put("spo2", (v.map { it.percentage.value }.average() * 10).roundToInt() / 10.0) }
            } catch (_: Exception) { }
        }
        if (can(RespiratoryRateRecord::class)) {
            try {
                readRecordsChunked(client, RespiratoryRateRecord::class, from, to)
                    .groupBy { it.time.atZone(zone).toLocalDate().toString() }
                    .forEach { (k, v) -> dayOf(k).put("resp", (v.map { it.rate }.average() * 10).roundToInt() / 10.0) }
            } catch (_: Exception) { }
        }

        // Workouts from the watch or any other app — not the ones this app
        // wrote for Strengthen, which the web side already has — each with its
        // heart rate and calories over its own minutes.
        if (!can(ExerciseSessionRecord::class)) return null
        return try {
            val ex = org.json.JSONArray()
            val sessions = readRecordsChunked(client, ExerciseSessionRecord::class, from, to)
                .filter { it.metadata.dataOrigin.packageName != packageName }
            for (s in sessions) {
                val o = JSONObject()
                o.put("d", s.startTime.atZone(zone).toLocalDate().toString())
                o.put("type", exerciseName(s.exerciseType))
                s.title?.takeIf { it.isNotBlank() }?.let { o.put("title", it.take(80)) }
                o.put("st", s.startTime.toEpochMilli())
                o.put("en", s.endTime.toEpochMilli())
                o.put("min", Duration.between(s.startTime, s.endTime).toMinutes())
                o.put("src", s.metadata.dataOrigin.packageName)
                val sm = mutableSetOf<AggregateMetric<*>>()
                if (can(HeartRateRecord::class)) { sm.add(HeartRateRecord.BPM_AVG); sm.add(HeartRateRecord.BPM_MAX) }
                if (can(ActiveCaloriesBurnedRecord::class)) sm.add(ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL)
                if (can(DistanceRecord::class)) sm.add(DistanceRecord.DISTANCE_TOTAL)
                if (sm.isNotEmpty()) {
                    try {
                        val a = client.aggregate(AggregateRequest(sm, TimeRangeFilter.between(s.startTime, s.endTime)))
                        a[HeartRateRecord.BPM_AVG]?.let { o.put("hrAvg", it) }
                        a[HeartRateRecord.BPM_MAX]?.let { o.put("hrMax", it) }
                        a[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.let { if (it.inKilocalories > 0) o.put("kcal", it.inKilocalories.roundToInt()) }
                        a[DistanceRecord.DISTANCE_TOTAL]?.let { if (it.inMeters > 0) o.put("distM", it.inMeters.roundToInt()) }
                    } catch (_: Exception) { }
                }
                ex.put(o)
            }
            ex
        } catch (_: Exception) {
            null
        }
    }

    private suspend fun currentHealthStatus(): String = withContext(Dispatchers.IO) {
        val sdkStatus = HealthConnectClient.getSdkStatus(
            this@MainActivity,
            "com.google.android.apps.healthdata"
        )
        when (sdkStatus) {
            HealthConnectClient.SDK_UNAVAILABLE -> "unavailable"
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "update_required"
            else -> {
                try {
                    val client = HealthConnectClient.getOrCreate(this@MainActivity)
                    val granted = client.permissionController.getGrantedPermissions()
                    val readGranted = granted.contains(HealthPermission.getReadPermission(StepsRecord::class)) ||
                        granted.contains(HealthPermission.getReadPermission(SleepSessionRecord::class)) ||
                        granted.contains(HealthPermission.getReadPermission(WeightRecord::class))
                    if (readGranted) "granted" else "needs_permission"
                } catch (_: Exception) {
                    "unavailable"
                }
            }
        }
    }

    private suspend fun syncHealthDataToWeb() {
        val payload = withContext(Dispatchers.IO) {
            val status = currentHealthStatus()
            val out = JSONObject()
            out.put("status", status)
            if (status != "granted") {
                return@withContext out
            }
            val client = HealthConnectClient.getOrCreate(this@MainActivity)
            val granted = client.permissionController.getGrantedPermissions()
            val zone = ZoneId.systemDefault()
            val today = LocalDate.now(zone)
            val hasHistory = granted.contains("android.permission.health.READ_HEALTH_DATA_HISTORY")
            val startDay = today.minusDays(if (hasHistory) 120L else 30L)
            val daysJson = JSONObject()

            // 1. Steps (de-duplicated across phone + watch in one grouped call)
            if (granted.contains(HealthPermission.getReadPermission(StepsRecord::class))) {
                try {
                    val stepRows = client.aggregateGroupByPeriod(
                        AggregateGroupByPeriodRequest(
                            metrics = setOf(StepsRecord.COUNT_TOTAL),
                            timeRangeFilter = TimeRangeFilter.between(
                                startDay.atStartOfDay(),
                                today.plusDays(1).atStartOfDay()
                            ),
                            timeRangeSlicer = Period.ofDays(1)
                        )
                    )
                    for (r in stepRows) {
                        val k = r.startTime.toLocalDate().toString()
                        val count = r.result[StepsRecord.COUNT_TOTAL] ?: 0L
                        if (count > 0L) {
                            val dayObj = daysJson.optJSONObject(k) ?: JSONObject().also { daysJson.put(k, it) }
                            dayObj.put("steps", count)
                        }
                    }
                } catch (_: Exception) {
                    // ignore step read failure
                }
            }

            // 2. Weight (latest reading on each day, converted to pounds, in chunked range reads)
            if (granted.contains(HealthPermission.getReadPermission(WeightRecord::class))) {
                try {
                    val weights = readRecordsChunked(
                        client,
                        WeightRecord::class,
                        startDay.atStartOfDay(zone).toInstant(),
                        today.plusDays(1).atStartOfDay(zone).toInstant()
                    )
                    weights.groupBy { it.time.atZone(zone).toLocalDate().toString() }
                        .forEach { (k, list) ->
                            val latest = list.maxByOrNull { it.time }
                            if (latest != null) {
                                val lb = (latest.weight.inPounds * 10.0).roundToInt() / 10.0
                                if (lb in 60.0..700.0) {
                                    val dayObj = daysJson.optJSONObject(k) ?: JSONObject().also { daysJson.put(k, it) }
                                    dayObj.put("weightLb", lb)
                                }
                            }
                        }
                } catch (_: Exception) {
                    // ignore weight read failure
                }
            }

            // 3. Sleep sessions (attributed to the morning LocalDate the sleep ended on)
            if (granted.contains(HealthPermission.getReadPermission(SleepSessionRecord::class))) {
                try {
                    val rangeStart = startDay.minusDays(1).atStartOfDay(zone).toInstant()
                    val rangeEnd = today.plusDays(1).atStartOfDay(zone).toInstant()
                    val sleeps = readRecordsChunked(
                        client,
                        SleepSessionRecord::class,
                        rangeStart,
                        rangeEnd
                    )
                    val minsByMorning = mutableMapOf<String, Long>()
                    // the night's stages, in minutes, where the watch recorded them
                    val stagesByMorning = mutableMapOf<String, MutableMap<String, Long>>()
                    for (s in sleeps) {
                        val morningKey = s.endTime.atZone(zone).toLocalDate().toString()
                        val mins = Duration.between(s.startTime, s.endTime).toMinutes()
                        if (mins > 0) {
                            minsByMorning[morningKey] = (minsByMorning[morningKey] ?: 0L) + mins
                        }
                        for (st in s.stages) {
                            val name = when (st.stage) {
                                SleepSessionRecord.STAGE_TYPE_DEEP -> "deep"
                                SleepSessionRecord.STAGE_TYPE_REM -> "rem"
                                SleepSessionRecord.STAGE_TYPE_LIGHT, SleepSessionRecord.STAGE_TYPE_SLEEPING -> "light"
                                SleepSessionRecord.STAGE_TYPE_AWAKE, SleepSessionRecord.STAGE_TYPE_AWAKE_IN_BED, SleepSessionRecord.STAGE_TYPE_OUT_OF_BED -> "awake"
                                else -> null
                            } ?: continue
                            val m = Duration.between(st.startTime, st.endTime).toMinutes()
                            val bucket = stagesByMorning.getOrPut(morningKey) { mutableMapOf() }
                            bucket[name] = (bucket[name] ?: 0L) + m
                        }
                    }
                    for ((k, st) in stagesByMorning) {
                        val o = JSONObject()
                        for ((n, m) in st) if (m > 0) o.put(n, m)
                        if (o.length() > 0) {
                            val dayObj = daysJson.optJSONObject(k) ?: JSONObject().also { daysJson.put(k, it) }
                            dayObj.put("sleepStages", o)
                        }
                    }
                    for ((k, mins) in minsByMorning) {
                        val quarterHours = ((mins / 60.0) * 4.0).roundToInt() / 4.0
                        if (quarterHours in 0.25..24.0) {
                            val dayObj = daysJson.optJSONObject(k) ?: JSONObject().also { daysJson.put(k, it) }
                            dayObj.put("sleepHours", quarterHours)
                        }
                    }
                } catch (_: Exception) {
                    // ignore sleep read failure
                }
            }

            val ex = readExtras(client, granted, zone, startDay, today, daysJson)

            val nowMs = System.currentTimeMillis()
            prefs().edit().putLong("last_sync", nowMs).apply()
            if (ex != null) out.put("ex", ex)
            out.put("syncedAt", nowMs)
            out.put("days", daysJson)
            out
        }

        withContext(Dispatchers.Main) {
            val js = "if (window.Health && window.Health.onData) window.Health.onData(${JSONObject.quote(payload.toString())});"
            webView.evaluateJavascript(js, null)
        }
    }

    inner class NourishBridge {

        @JavascriptInterface
        fun getHealthStatus(): String {
            val status = runBlocking { currentHealthStatus() }
            val out = JSONObject()
            out.put("available", status != "unavailable")
            out.put("status", status)
            out.put("lastSync", prefs().getLong("last_sync", 0L))
            out.put("otaVersion", prefs().getString("ota_version", ""))
            return out.toString()
        }

        @JavascriptInterface
        fun checkOtaUpdate() {
            lifecycleScope.launch {
                syncOtaBundle()
            }
        }

        @JavascriptInterface
        fun requestHealthPermissions() {
            lifecycleScope.launch(Dispatchers.Main) {
                try {
                    requestHealthPermissionsLauncher.launch(healthPermissions)
                } catch (_: Exception) {
                    openHealthConnect()
                }
            }
        }

        @JavascriptInterface
        fun syncHealthNow() {
            lifecycleScope.launch {
                syncHealthDataToWeb()
            }
        }

        @JavascriptInterface
        fun openHealthConnect() {
            lifecycleScope.launch(Dispatchers.Main) {
                val uriString = "market://details?id=com.google.android.apps.healthdata&url=healthconnect%3A%2F%2Fonboarding"
                try {
                    startActivity(
                        Intent(Intent.ACTION_VIEW).apply {
                            setPackage("com.android.vending")
                            data = Uri.parse(uriString)
                            putExtra("overlay", true)
                            putExtra("callerId", packageName)
                        }
                    )
                } catch (_: Exception) {
                    startActivity(
                        Intent(
                            Intent.ACTION_VIEW,
                            Uri.parse("https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata")
                        )
                    )
                }
            }
        }

        @JavascriptInterface
        fun writeWeight(jsonStr: String) {
            lifecycleScope.launch(Dispatchers.IO) {
                try {
                    val obj = JSONObject(jsonStr)
                    val dayKey = obj.optString("dayKey", "")
                    val lb = obj.optDouble("lb", 0.0)
                    if (!dayKey.matches(Regex("^\\d{4}-\\d{2}-\\d{2}$"))) return@launch

                    val client = HealthConnectClient.getOrCreate(this@MainActivity)
                    val granted = client.permissionController.getGrantedPermissions()
                    if (!granted.contains(HealthPermission.getWritePermission(WeightRecord::class))) return@launch

                    val zone = ZoneId.systemDefault()
                    val date = LocalDate.parse(dayKey)
                    val weighInstant = date.atTime(7, 0).atZone(zone).toInstant()
                    val offset = zone.rules.getOffset(weighInstant)

                    client.deleteRecords(
                        WeightRecord::class,
                        TimeRangeFilter.between(weighInstant.minusSeconds(60), weighInstant.plusSeconds(60))
                    )
                    if (lb in 60.0..700.0) {
                        client.insertRecords(
                            listOf(
                                WeightRecord(
                                    time = weighInstant,
                                    zoneOffset = offset,
                                    weight = Mass.pounds(lb)
                                )
                            )
                        )
                    }
                } catch (_: Exception) {
                    // quiet fallback
                }
            }
        }

        @JavascriptInterface
        fun writeNutrition(jsonStr: String) {
            lifecycleScope.launch(Dispatchers.IO) {
                try {
                    val obj = JSONObject(jsonStr)
                    val dayKey = obj.optString("dayKey", "")
                    val slot = obj.optString("slot", "s")
                    val mealTypeStr = obj.optString("mealType", slot)
                    val name = obj.optString("name", "Meal")
                    val kcal = obj.optDouble("kcal", 0.0)
                    val p = obj.optDouble("p", 0.0)
                    val f = obj.optDouble("f", 0.0)
                    val c = obj.optDouble("c", 0.0)
                    if (!dayKey.matches(Regex("^\\d{4}-\\d{2}-\\d{2}$"))) return@launch

                    val client = HealthConnectClient.getOrCreate(this@MainActivity)
                    val granted = client.permissionController.getGrantedPermissions()
                    if (!granted.contains(HealthPermission.getWritePermission(NutritionRecord::class))) return@launch

                    val zone = ZoneId.systemDefault()
                    val date = LocalDate.parse(dayKey)
                    val (hour, min) = when (slot) {
                        "b" -> 8 to 0
                        "l" -> 12 to 30
                        "d" -> 18 to 30
                        "s" -> 15 to 30
                        else -> 15 to ((slot.hashCode() and 0x7fffffff) % 25)
                    }
                    val startInstant = date.atTime(hour, min).atZone(zone).toInstant()
                    val endInstant = startInstant.plusSeconds(1800)
                    val offset = zone.rules.getOffset(startInstant)

                    val mealType = when (mealTypeStr) {
                        "b" -> MealType.MEAL_TYPE_BREAKFAST
                        "l" -> MealType.MEAL_TYPE_LUNCH
                        "d" -> MealType.MEAL_TYPE_DINNER
                        "s" -> MealType.MEAL_TYPE_SNACK
                        else -> MealType.MEAL_TYPE_UNKNOWN
                    }

                    client.deleteRecords(
                        NutritionRecord::class,
                        TimeRangeFilter.between(startInstant.minusSeconds(10), endInstant.plusSeconds(10))
                    )
                    if (kcal > 0.0) {
                        client.insertRecords(
                            listOf(
                                NutritionRecord(
                                    startTime = startInstant,
                                    startZoneOffset = offset,
                                    endTime = endInstant,
                                    endZoneOffset = offset,
                                    energy = Energy.kilocalories(kcal),
                                    protein = Mass.grams(p.coerceAtLeast(0.0)),
                                    totalFat = Mass.grams(f.coerceAtLeast(0.0)),
                                    totalCarbohydrate = Mass.grams(c.coerceAtLeast(0.0)),
                                    name = name.take(120),
                                    mealType = mealType
                                )
                            )
                        )
                    }
                } catch (_: Exception) {
                    // quiet fallback
                }
            }
        }

        private fun segmentTypeFor(e: String, m: String, q: String, p: String): Int = when {
            e == "kb-swing" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_KETTLEBELL_SWING
            e == "back-ext" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_BACK_EXTENSION
            e == "leg-press" || e == "seated-lp" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_LEG_PRESS
            e == "leg-ext" || e == "bd-leg-ext" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_LEG_EXTENSION
            e == "lying-curl" || e == "seated-curl" || e == "slide-curl" || e == "nordic" || e == "ball-curl" || e == "sl-leg-curl" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_LEG_CURL
            e == "lat-pd" || e == "lat-pd-n" || e == "cb-straight" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_LAT_PULL_DOWN
            e == "pullup" || e == "chinup" || e == "pullup-neg" || e == "as-pullup" || e == "bd-pullup" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_PULL_UP
            e == "db-row" || e == "db-cs-row" || e == "kb-row" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_DUMBBELL_ROW
            e == "hang-raise" || e == "capt-raise" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_LEG_RAISE
            e == "situp" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_SIT_UP
            e == "dec-crunch" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_BENCH_SIT_UP
            e == "crunch" || e == "cb-crunch" || e == "mc-crunch" || e == "v-up" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_CRUNCH
            e == "dead-bug" || e == "bird-dog" || e == "pallof" || e == "ab-wheel" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_PLANK
            e == "lm-180" || e == "cb-woodchop" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_UPPER_TWIST
            p == "flat" || p == "incline" || e == "cgbp" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_BENCH_PRESS
            p == "squat" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_SQUAT
            p == "single" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_LUNGE
            p == "hinge" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_DEADLIFT
            p == "thrust" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_HIP_THRUST
            m == "front" && p == "press" && q == "bb" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_BARBELL_SHOULDER_PRESS
            m == "front" && p == "press" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_SHOULDER_PRESS
            m == "front" && p == "raise" && q == "db" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_DUMBBELL_FRONT_RAISE
            m == "front" && p == "raise" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_FRONT_RAISE
            m == "side" && q == "db" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_DUMBBELL_LATERAL_RAISE
            m == "side" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_LATERAL_RAISE
            m == "biceps" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_ARM_CURL
            m == "triceps" && q == "db" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_DUMBBELL_TRICEPS_EXTENSION_TWO_ARM
            m == "triceps" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_DOUBLE_ARM_TRICEPS_EXTENSION
            else -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_WEIGHTLIFTING
        }

        @JavascriptInterface
        fun writeWorkout(jsonStr: String) {
            lifecycleScope.launch(Dispatchers.IO) {
                try {
                    val obj = JSONObject(jsonStr)
                    val startMs = obj.optLong("startMs", System.currentTimeMillis() - 3600000L)
                    val endMs = obj.optLong("endMs", System.currentTimeMillis()).coerceAtLeast(startMs + 60000L)
                    val title = obj.optString("title", "Strengthen Workout")
                    val notes = obj.optString("notes", "")

                    val client = HealthConnectClient.getOrCreate(this@MainActivity)
                    val granted = client.permissionController.getGrantedPermissions()
                    if (!granted.contains(HealthPermission.getWritePermission(ExerciseSessionRecord::class))) return@launch

                    val zone = ZoneId.systemDefault()
                    val startInstant = Instant.ofEpochMilli(startMs)
                    val endInstant = Instant.ofEpochMilli(endMs)
                    val startOffset = zone.rules.getOffset(startInstant)
                    val endOffset = zone.rules.getOffset(endInstant)

                    val segments = mutableListOf<ExerciseSegment>()
                    val exArr = obj.optJSONArray("exercises")
                    if (exArr != null && exArr.length() > 0) {
                        val n = exArr.length()
                        val totalSpanMs = (endMs - startMs).coerceAtLeast(n * 2000L)
                        val slotMs = totalSpanMs / n
                        for (i in 0 until n) {
                            val exObj = exArr.optJSONObject(i) ?: continue
                            val segStartMs = startMs + i * slotMs
                            val segEndMs = if (i == n - 1) endMs else (segStartMs + slotMs - 500L).coerceAtLeast(segStartMs + 1000L)
                            if (segEndMs <= segStartMs || segEndMs > endMs) continue
                            val segType = segmentTypeFor(
                                exObj.optString("e", ""),
                                exObj.optString("m", ""),
                                exObj.optString("q", ""),
                                exObj.optString("p", "")
                            )
                            val reps = exObj.optInt("reps", 0).coerceAtLeast(0)
                            segments.add(
                                ExerciseSegment(
                                    startTime = Instant.ofEpochMilli(segStartMs),
                                    endTime = Instant.ofEpochMilli(segEndMs),
                                    segmentType = segType,
                                    repetitions = reps
                                )
                            )
                        }
                    }

                    // The workout's own id ("nourish-wo-<id>") is the record's
                    // clientRecordId, so a workout whose start was corrected in
                    // Strengthen replaces its old record instead of leaving it
                    // behind at the old time: clearing only the new time range
                    // never reached the old one. The range clear stays for
                    // records written before they carried the id.
                    val clientId = obj.optString("id", "").takeIf { it.isNotBlank() }
                    if (clientId != null) {
                        client.deleteRecords(ExerciseSessionRecord::class, emptyList(), listOf(clientId))
                    }
                    client.deleteRecords(
                        ExerciseSessionRecord::class,
                        TimeRangeFilter.between(startInstant.minusSeconds(5), endInstant.plusSeconds(5))
                    )
                    client.insertRecords(
                        listOf(
                            ExerciseSessionRecord(
                                startTime = startInstant,
                                startZoneOffset = startOffset,
                                endTime = endInstant,
                                endZoneOffset = endOffset,
                                exerciseType = ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING,
                                title = title.take(100),
                                notes = notes.takeIf { it.isNotBlank() }?.take(1000),
                                segments = segments,
                                metadata = if (clientId != null)
                                    Metadata(clientRecordId = clientId, clientRecordVersion = System.currentTimeMillis())
                                else Metadata()
                            )
                        )
                    )
                } catch (_: Exception) {
                    // quiet fallback
                }
            }
        }

        @JavascriptInterface
        fun signInGoogle(serverClientId: String) {
            lifecycleScope.launch {
                try {
                    val credentialManager = CredentialManager.create(this@MainActivity)
                    val googleIdOption = GetGoogleIdOption.Builder()
                        .setFilterByAuthorizedAccounts(false)
                        .setServerClientId(serverClientId)
                        .setAutoSelectEnabled(false)
                        .build()
                    val request = GetCredentialRequest.Builder()
                        .addCredentialOption(googleIdOption)
                        .build()
                    val result = credentialManager.getCredential(
                        request = request,
                        context = this@MainActivity
                    )
                    val cred = result.credential
                    if (cred is CustomCredential && cred.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                        val idToken = GoogleIdTokenCredential.createFrom(cred.data).idToken
                        withContext(Dispatchers.Main) {
                            val js = "if (window.Store && window.Store.onNativeGoogleToken) window.Store.onNativeGoogleToken(${JSONObject.quote(idToken)}, null);"
                            webView.evaluateJavascript(js, null)
                        }
                    } else {
                        throw IllegalStateException("Unexpected credential type")
                    }
                } catch (e: Exception) {
                    withContext(Dispatchers.Main) {
                        val msg = e.message ?: "Google sign-in cancelled"
                        val js = "if (window.Store && window.Store.onNativeGoogleToken) window.Store.onNativeGoogleToken(null, ${JSONObject.quote(msg)});"
                        webView.evaluateJavascript(js, null)
                    }
                }
            }
        }
    }
}
