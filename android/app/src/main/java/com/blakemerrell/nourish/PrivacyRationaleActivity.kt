package com.blakemerrell.nourish

import android.content.res.Configuration
import android.os.Bundle
import android.webkit.WebView
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader

class PrivacyRationaleActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val isNight = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
        val statusBarResId = resources.getIdentifier("status_bar_height", "dimen", "android")
        val statusBarDimenPx = if (statusBarResId > 0) resources.getDimensionPixelSize(statusBarResId) else 0
        val density = resources.displayMetrics.density
        val minTopInsetPx = maxOf(statusBarDimenPx, (48f * density).toInt())
        val minBottomInsetPx = (24f * density).toInt()

        val rootLayout = FrameLayout(this).apply {
            setBackgroundColor(if (isNight) 0xFF1A1612.toInt() else 0xFFFBF7EE.toInt())
            setPadding(0, minTopInsetPx, 0, minBottomInsetPx)
        }
        val webView = WebView(this)
        rootLayout.addView(
            webView,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )
        setContentView(rootLayout)
        ViewCompat.setOnApplyWindowInsetsListener(rootLayout) { v, windowInsets ->
            val rootInsets = ViewCompat.getRootWindowInsets(window.decorView)
            val mask = WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            val rBars = rootInsets?.getInsets(mask)
            val dBars = windowInsets.getInsets(mask)
            v.setPadding(
                maxOf(rBars?.left ?: 0, dBars.left),
                maxOf(minTopInsetPx, rBars?.top ?: 0, dBars.top),
                maxOf(rBars?.right ?: 0, dBars.right),
                maxOf(minBottomInsetPx, rBars?.bottom ?: 0, dBars.bottom)
            )
            WindowInsetsCompat.CONSUMED
        }
        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
        webView.webViewClient = object : android.webkit.WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: android.webkit.WebResourceRequest
            ) = assetLoader.shouldInterceptRequest(request.url)
        }
        webView.loadUrl("https://appassets.androidplatform.net/assets/public/privacy/index.html")
    }
}
