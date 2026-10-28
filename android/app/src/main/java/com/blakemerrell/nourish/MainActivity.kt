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
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import kotlin.math.roundToInt

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var pendingWebPermissionRequest: PermissionRequest? = null

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
        val bgColor = if (isNight) 0xFF1A1612.toInt() else 0xFFFBF7EE.toInt()

        val rootLayout = FrameLayout(this).apply {
            setBackgroundColor(bgColor)
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

        WindowInsetsControllerCompat(window, rootLayout).apply {
            isAppearanceLightStatusBars = !isNight
            isAppearanceLightNavigationBars = !isNight
        }

        ViewCompat.setOnApplyWindowInsetsListener(rootLayout) { v, windowInsets ->
            val insets = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() or
                    WindowInsetsCompat.Type.displayCutout() or
                    WindowInsetsCompat.Type.ime()
            )
            v.setPadding(insets.left, insets.top, insets.right, insets.bottom)
            WindowInsetsCompat.CONSUMED
        }

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
                return assetLoader.shouldInterceptRequest(request.url)
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
    }

    private fun prefs() = getSharedPreferences("nourish_health", Context.MODE_PRIVATE)

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
            return out.toString()
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
