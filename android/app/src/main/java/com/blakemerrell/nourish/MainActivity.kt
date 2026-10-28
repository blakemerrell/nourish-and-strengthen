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
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.MealType
import androidx.health.connect.client.records.NutritionRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.WeightRecord
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
import java.time.ZoneId
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

    private val healthPermissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(WeightRecord::class),
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
            val startDay = today.minusDays(14)
            val daysJson = JSONObject()

            var d = startDay
            while (!d.isAfter(today)) {
                val dayObj = JSONObject()
                val dayStart = d.atStartOfDay(zone).toInstant()
                val dayEnd = d.plusDays(1).atStartOfDay(zone).toInstant()

                // 1. Steps (de-duplicated across phone + watch via AggregateRequest)
                if (granted.contains(HealthPermission.getReadPermission(StepsRecord::class))) {
                    try {
                        val agg = client.aggregate(
                            AggregateRequest(
                                metrics = setOf(StepsRecord.COUNT_TOTAL),
                                timeRangeFilter = TimeRangeFilter.between(dayStart, dayEnd)
                            )
                        )
                        val count = agg[StepsRecord.COUNT_TOTAL] ?: 0L
                        if (count > 0L) {
                            dayObj.put("steps", count)
                        }
                    } catch (_: Exception) {
                        // ignore step read failure for day
                    }
                }

                // 2. Weight (latest reading on day d, converted to pounds)
                if (granted.contains(HealthPermission.getReadPermission(WeightRecord::class))) {
                    try {
                        val weights = client.readRecords(
                            ReadRecordsRequest(
                                recordType = WeightRecord::class,
                                timeRangeFilter = TimeRangeFilter.between(dayStart, dayEnd)
                            )
                        ).records
                        val latest = weights.maxByOrNull { it.time }
                        if (latest != null) {
                            val lb = (latest.weight.inPounds * 10.0).roundToInt() / 10.0
                            if (lb in 60.0..700.0) {
                                dayObj.put("weightLb", lb)
                            }
                        }
                    } catch (_: Exception) {
                        // ignore weight read failure for day
                    }
                }

                if (dayObj.length() > 0) {
                    daysJson.put(d.toString(), dayObj)
                }
                d = d.plusDays(1)
            }

            // 3. Sleep sessions (attributed to the morning LocalDate the sleep ended on)
            if (granted.contains(HealthPermission.getReadPermission(SleepSessionRecord::class))) {
                try {
                    val rangeStart = startDay.minusDays(1).atStartOfDay(zone).toInstant()
                    val rangeEnd = today.plusDays(1).atStartOfDay(zone).toInstant()
                    val sleeps = client.readRecords(
                        ReadRecordsRequest(
                            recordType = SleepSessionRecord::class,
                            timeRangeFilter = TimeRangeFilter.between(rangeStart, rangeEnd)
                        )
                    ).records
                    val minsByMorning = mutableMapOf<String, Long>()
                    for (s in sleeps) {
                        val morningKey = s.endTime.atZone(zone).toLocalDate().toString()
                        val mins = Duration.between(s.startTime, s.endTime).toMinutes()
                        if (mins > 0) {
                            minsByMorning[morningKey] = (minsByMorning[morningKey] ?: 0L) + mins
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

            val nowMs = System.currentTimeMillis()
            prefs().edit().putLong("last_sync", nowMs).apply()
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
                                notes = notes.takeIf { it.isNotBlank() }?.take(500)
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
