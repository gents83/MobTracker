package com.mobtrack.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "MobTrackerNative";

    // Tabs
    private LinearLayout tabLocatorContent;
    private LinearLayout tabPairingContent;
    private LinearLayout tabHistoryContent;

    private Button btnTabLocator;
    private Button btnTabPairing;
    private Button btnTabHistory;

    // Locator elements
    private EditText etPhoneInput;
    private Button btnInitiateLocator;
    private TextView tvLocatorResultTitle;
    private TextView tvLocatorResultDetails;
    private Button btnLocatorReveal;
    private WebView webViewLocatorMap;
    private LinearLayout llLocatorResultCard;

    // Pairing elements
    private Button btnGeneratePairing;
    private TextView tvPairingLink;
    private EditText etCustomMessage;
    private Button btnShareWhatsapp;
    private Button btnShareTelegram;
    private Button btnShareSMS;
    private Button btnShareOther;
    private WebView webViewPairingMap;
    private Button btnToggleAutoRefresh;
    private LinearLayout llPairingControlPanel;
    private TextView tvPairingStatus;

    // History elements
    private LinearLayout llHistoryList;
    private Button btnExportCSV;
    private Button btnClearHistory;
    private WebView webViewHistoryMap;

    // State Variables
    private boolean isPrivacyMode = true;
    private boolean isRevealed = false;
    private String lastLocatedCountry = "";
    private double lastLocatedLat = 0.0;
    private double lastLocatedLng = 0.0;
    private String lastLocatedCarrier = "";

    private String currentPairId = null;
    private String currentPairLink = null;
    private boolean isPairPolling = false;
    private Handler pollingHandler = new Handler(Looper.getMainLooper());
    private int pollingIntervalMs = 5000;
    private double currentPairLat = 0.0;
    private double currentPairLng = 0.0;

    // Fallbacks coordinate map
    private static final Map<String, CountryCoords> COUNTRY_MAP = new HashMap<>();

    static {
        COUNTRY_MAP.put("39", new CountryCoords("Italy", "IT", 41.8719, 12.5674, "TIM / Vodafone"));
        COUNTRY_MAP.put("1", new CountryCoords("United States", "US", 37.0902, -95.7129, "T-Mobile / Verizon"));
        COUNTRY_MAP.put("44", new CountryCoords("United Kingdom", "GB", 55.3781, -3.4360, "EE / Vodafone"));
        COUNTRY_MAP.put("33", new CountryCoords("France", "FR", 46.2276, 2.2137, "Orange / SFR"));
        COUNTRY_MAP.put("49", new CountryCoords("Germany", "DE", 51.1657, 10.4515, "Deutsche Telekom"));
        COUNTRY_MAP.put("34", new CountryCoords("Spain", "ES", 40.4637, -3.7492, "Movistar / Vodafone"));
        COUNTRY_MAP.put("81", new CountryCoords("Japan", "JP", 36.2048, 138.2529, "NTT Docomo"));
        COUNTRY_MAP.put("91", new CountryCoords("India", "IN", 20.5937, 78.9629, "Jio / Airtel"));
        COUNTRY_MAP.put("55", new CountryCoords("Brazil", "BR", -14.2350, -51.9253, "Vivo / Claro"));
        COUNTRY_MAP.put("7", new CountryCoords("Russia", "RU", 61.5240, 105.3188, "MTS / Megafon"));
        COUNTRY_MAP.put("61", new CountryCoords("Australia", "AU", -25.2744, 133.7751, "Telstra / Optus"));
        COUNTRY_MAP.put("86", new CountryCoords("China", "CN", 35.8617, 104.1954, "China Mobile"));
    }

    private static class CountryCoords {
        String name;
        String code;
        double lat;
        double lng;
        String carrier;

        CountryCoords(String name, String code, double lat, double lng, String carrier) {
            this.name = name;
            this.code = code;
            this.lat = lat;
            this.lng = lng;
            this.carrier = carrier;
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Bind layouts
        tabLocatorContent = findViewById(R.id.tabLocatorContent);
        tabPairingContent = findViewById(R.id.tabPairingContent);
        tabHistoryContent = findViewById(R.id.tabHistoryContent);

        btnTabLocator = findViewById(R.id.btnTabLocator);
        btnTabPairing = findViewById(R.id.btnTabPairing);
        btnTabHistory = findViewById(R.id.btnTabHistory);

        // Bind locator elements
        etPhoneInput = findViewById(R.id.etPhoneInput);
        btnInitiateLocator = findViewById(R.id.btnInitiateLocator);
        tvLocatorResultTitle = findViewById(R.id.tvLocatorResultTitle);
        tvLocatorResultDetails = findViewById(R.id.tvLocatorResultDetails);
        btnLocatorReveal = findViewById(R.id.btnLocatorReveal);
        webViewLocatorMap = findViewById(R.id.webViewLocatorMap);
        llLocatorResultCard = findViewById(R.id.llLocatorResultCard);

        // Bind pairing elements
        btnGeneratePairing = findViewById(R.id.btnGeneratePairing);
        tvPairingLink = findViewById(R.id.tvPairingLink);
        etCustomMessage = findViewById(R.id.etCustomMessage);
        btnShareWhatsapp = findViewById(R.id.btnShareWhatsapp);
        btnShareTelegram = findViewById(R.id.btnShareTelegram);
        btnShareSMS = findViewById(R.id.btnShareSMS);
        btnShareOther = findViewById(R.id.btnShareOther);
        webViewPairingMap = findViewById(R.id.webViewPairingMap);
        btnToggleAutoRefresh = findViewById(R.id.btnToggleAutoRefresh);
        llPairingControlPanel = findViewById(R.id.llPairingControlPanel);
        tvPairingStatus = findViewById(R.id.tvPairingStatus);

        // Bind history elements
        llHistoryList = findViewById(R.id.llHistoryList);
        btnExportCSV = findViewById(R.id.btnExportCSV);
        btnClearHistory = findViewById(R.id.btnClearHistory);
        webViewHistoryMap = findViewById(R.id.webViewHistoryMap);

        // Set Tab Click Listeners
        btnTabLocator.setOnClickListener(v -> switchTab(0));
        btnTabPairing.setOnClickListener(v -> switchTab(1));
        btnTabHistory.setOnClickListener(v -> switchTab(2));

        // Setup Map WebViews
        setupMapWebView(webViewLocatorMap);
        setupMapWebView(webViewPairingMap);
        setupMapWebView(webViewHistoryMap);

        // Setup Locator Form
        btnInitiateLocator.setOnClickListener(v -> performPrefixLookup());
        btnLocatorReveal.setOnClickListener(v -> revealLocatorCoords());

        // Setup Pairing Form
        btnGeneratePairing.setOnClickListener(v -> generatePairingLink());
        btnToggleAutoRefresh.setOnClickListener(v -> toggleAutoRefresh());

        btnShareWhatsapp.setOnClickListener(v -> shareViaApp("whatsapp"));
        btnShareTelegram.setOnClickListener(v -> shareViaApp("telegram"));
        btnShareSMS.setOnClickListener(v -> shareViaApp("sms"));
        btnShareOther.setOnClickListener(v -> shareViaApp("other"));

        // Setup History buttons
        btnExportCSV.setOnClickListener(v -> exportCSVHistory());
        btnClearHistory.setOnClickListener(v -> clearHistoryLogs());

        // Initialize display to Locator
        switchTab(0);
        loadHistoryList();
    }

    private void setupMapWebView(WebView webView) {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "Map WebView page finished loading.");
            }
        });

        // Load fully responsive Leaflet Map HTML content locally
        String mapHtml = "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'>\n" +
                "    <link rel='stylesheet' href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' />\n" +
                "    <script src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'></script>\n" +
                "    <style>\n" +
                "        html, body, #map { height: 100%; margin: 0; padding: 0; background-color: #020617; }\n" +
                "        .leaflet-bar { border: 1px solid #1e293b !important; }\n" +
                "        .leaflet-bar a { background-color: #0f172a !important; color: #10b981 !important; border-bottom: 1px solid #1e293b !important; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div id='map'></div>\n" +
                "    <script>\n" +
                "        var map = L.map('map', { zoomControl: false }).setView([20, 0], 2);\n" +
                "        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {\n" +
                "            attribution: '&copy; OpenStreetMap'\n" +
                "        }).addTo(map);\n" +
                "        var marker;\n" +
                "        var circle;\n" +
                "        var polyline;\n" +
                "        \n" +
                "        function updateMarker(lat, lng, name, redact) {\n" +
                "            var latVal = parseFloat(lat);\n" +
                "            var lngVal = parseFloat(lng);\n" +
                "            map.setView([latVal, lngVal], 8);\n" +
                "            if (marker) { map.removeLayer(marker); }\n" +
                "            if (circle) { map.removeLayer(circle); }\n" +
                "            \n" +
                "            var label = name || 'Device';\n" +
                "            if (redact) {\n" +
                "                label += ' (REDACTED COORDS)';\n" +
                "            } else {\n" +
                "                label += ' (' + latVal.toFixed(4) + ', ' + lngVal.toFixed(4) + ')';\n" +
                "            }\n" +
                "            \n" +
                "            marker = L.marker([latVal, lngVal]).addTo(map).bindPopup(label).openPopup();\n" +
                "            circle = L.circle([latVal, lngVal], { radius: 10000, color: '#10b981', fillColor: '#10b981', fillOpacity: 0.15 }).addTo(map);\n" +
                "        }\n" +
                "\n" +
                "        function updatePath(coordsJson) {\n" +
                "            var coords = JSON.parse(coordsJson);\n" +
                "            if (polyline) { map.removeLayer(polyline); }\n" +
                "            if (coords && coords.length > 0) {\n" +
                "                var points = [];\n" +
                "                for (var i = 0; i < coords.length; i++) {\n" +
                "                    points.push([coords[i].lat, coords[i].lng]);\n" +
                "                }\n" +
                "                polyline = L.polyline(points, {color: '#10b981', weight: 4}).addTo(map);\n" +
                "                map.fitBounds(polyline.getBounds());\n" +
                "            }\n" +
                "        }\n" +
                "    </script>\n" +
                "</body>\n" +
                "</html>";
        webView.loadDataWithBaseURL("https://localhost", mapHtml, "text/html", "UTF-8", null);
    }

    private void switchTab(int tabIndex) {
        tabLocatorContent.setVisibility(tabIndex == 0 ? View.VISIBLE : View.GONE);
        tabPairingContent.setVisibility(tabIndex == 1 ? View.VISIBLE : View.GONE);
        tabHistoryContent.setVisibility(tabIndex == 2 ? View.VISIBLE : View.GONE);

        // Highlight Buttons
        int darkBg = 0xFF0F172A; // slate-900
        int borderGreen = 0xFF10B981; // emerald-500
        int grayText = 0xFF64748B; // slate-500

        btnTabLocator.setBackgroundColor(tabIndex == 0 ? borderGreen : darkBg);
        btnTabLocator.setTextColor(tabIndex == 0 ? 0xFF020617 : grayText);

        btnTabPairing.setBackgroundColor(tabIndex == 1 ? borderGreen : darkBg);
        btnTabPairing.setTextColor(tabIndex == 1 ? 0xFF020617 : grayText);

        btnTabHistory.setBackgroundColor(tabIndex == 2 ? borderGreen : darkBg);
        btnTabHistory.setTextColor(tabIndex == 2 ? 0xFF020617 : grayText);

        if (tabIndex == 2) {
            loadHistoryList();
        }
    }

    // --- Locator Mode Functions ---
    private void performPrefixLookup() {
        String phoneInput = etPhoneInput.getText().toString().trim();
        if (phoneInput.isEmpty()) {
            Toast.makeText(this, "Enter phone number", Toast.LENGTH_SHORT).show();
            return;
        }

        // Clean formatting and match prefix
        String cleanPhone = phoneInput.replaceAll("[^0-9+]", "");
        if (!cleanPhone.startsWith("+")) {
            cleanPhone = "+" + cleanPhone;
        }

        // Parse country code prefix
        CountryCoords match = null;
        for (String code : COUNTRY_MAP.keySet()) {
            if (cleanPhone.startsWith("+" + code)) {
                match = COUNTRY_MAP.get(code);
                break;
            }
        }

        if (match == null) {
            // Default fallback if no calling code match
            match = new CountryCoords("Global Prefix Location", "GLOBAL", 0.0, 0.0, "Multi-carrier System");
        }

        lastLocatedCountry = match.name;
        lastLocatedLat = match.lat;
        lastLocatedLng = match.lng;
        lastLocatedCarrier = match.carrier;
        isRevealed = false;

        llLocatorResultCard.setVisibility(View.VISIBLE);
        updateLocatorUI();
    }

    private void updateLocatorUI() {
        tvLocatorResultTitle.setText("LOCATION RESOLVED: " + lastLocatedCountry.toUpperCase());
        String info = "Prefix: " + etPhoneInput.getText().toString() + "\n" +
                "Carrier: " + lastLocatedCarrier + "\n";
        if (isPrivacyMode && !isRevealed) {
            info += "LAT: [REDACTED]\nLNG: [REDACTED]";
            btnLocatorReveal.setVisibility(View.VISIBLE);
        } else {
            info += "LAT: " + String.format(Locale.US, "%.4f", lastLocatedLat) + "\n" +
                    "LNG: " + String.format(Locale.US, "%.4f", lastLocatedLng);
            btnLocatorReveal.setVisibility(View.GONE);
        }
        tvLocatorResultDetails.setText(info);

        // Update WebView map
        webViewLocatorMap.evaluateJavascript("updateMarker(" + lastLocatedLat + ", " + lastLocatedLng + ", '" + lastLocatedCountry + "', " + (isPrivacyMode && !isRevealed) + ");", null);
    }

    private void revealLocatorCoords() {
        isRevealed = true;
        updateLocatorUI();
    }

    // --- Pairing Mode Functions ---
    private void generatePairingLink() {
        currentPairId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        currentPairLink = "https://gents83.github.io/MobTracker/?pair=" + currentPairId;

        llPairingControlPanel.setVisibility(View.VISIBLE);
        tvPairingLink.setText(currentPairLink);

        tvPairingStatus.setText("AWAITING INCOMING UPLINK...");
        isPairPolling = true;
        btnToggleAutoRefresh.setText("STOP ACTIVE POLLING");
        btnToggleAutoRefresh.setBackgroundColor(0xFFEF4444); // Red

        // Start polling ntfy.sh
        startPolling();
    }

    private void toggleAutoRefresh() {
        if (isPairPolling) {
            isPairPolling = false;
            btnToggleAutoRefresh.setText("START ACTIVE POLLING");
            btnToggleAutoRefresh.setBackgroundColor(0xFF10B981); // Green
            pollingHandler.removeCallbacksAndMessages(null);
            tvPairingStatus.setText("POLLING SUSPENDED");
        } else {
            if (currentPairId == null) {
                Toast.makeText(this, "Generate a pair link first", Toast.LENGTH_SHORT).show();
                return;
            }
            isPairPolling = true;
            btnToggleAutoRefresh.setText("STOP ACTIVE POLLING");
            btnToggleAutoRefresh.setBackgroundColor(0xFFEF4444); // Red
            tvPairingStatus.setText("POLLING ACTIVE...");
            startPolling();
        }
    }

    private void startPolling() {
        pollingHandler.removeCallbacksAndMessages(null);
        pollingHandler.post(new Runnable() {
            @Override
            public void run() {
                if (!isPairPolling) return;
                fetchNtfyStatus();
                pollingHandler.postDelayed(this, pollingIntervalMs);
            }
        });
    }

    private void fetchNtfyStatus() {
        if (currentPairId == null) return;
        new Thread(() -> {
            try {
                URL url = new URL("https://ntfy.sh/mobtrack-pair-" + currentPairId + "/json?poll=1");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(3000);
                conn.setReadTimeout(3000);

                if (conn.getResponseCode() == 200) {
                    BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    String line;
                    double newLat = 0.0;
                    double newLng = 0.0;
                    boolean foundUpdate = false;

                    while ((line = in.readLine()) != null) {
                        try {
                            JSONObject json = new JSONObject(line);
                            if (json.has("event") && json.getString("event").equals("message")) {
                                String msgStr = json.getString("message");
                                JSONObject msgJson = new JSONObject(msgStr);
                                if (msgJson.has("lat") && msgJson.has("lng")) {
                                    newLat = msgJson.getDouble("lat");
                                    newLng = msgJson.getDouble("lng");
                                    foundUpdate = true;
                                }
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "Error parsing line: " + e.getMessage());
                        }
                    }
                    in.close();

                    if (foundUpdate) {
                        final double finalLat = newLat;
                        final double finalLng = newLng;
                        runOnUiThread(() -> handleLocationReceived(finalLat, finalLng));
                    }
                }
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Polling failed: " + e.getMessage());
            }
        }).start();
    }

    private void handleLocationReceived(double lat, double lng) {
        if (lat == currentPairLat && lng == currentPairLng) return;

        currentPairLat = lat;
        currentPairLng = lng;

        tvPairingStatus.setText("UPLINK ACTIVE\nLAT: " + String.format(Locale.US, "%.4f", lat) + " | LNG: " + String.format(Locale.US, "%.4f", lng));
        webViewPairingMap.evaluateJavascript("updateMarker(" + lat + ", " + lng + ", 'Paired Device', false);", null);

        // Store to native history logs
        addHistoryLog(currentPairId, lat, lng);
    }

    private void shareViaApp(String appType) {
        if (currentPairLink == null) {
            Toast.makeText(this, "Generate a pairing link first", Toast.LENGTH_SHORT).show();
            return;
        }

        String customMsg = etCustomMessage.getText().toString();
        String fullMessage = customMsg + " " + currentPairLink;

        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_TEXT, fullMessage);

        if (appType.equals("whatsapp")) {
            intent.setPackage("com.whatsapp");
            try {
                startActivity(intent);
            } catch (Exception e) {
                Toast.makeText(this, "WhatsApp not installed", Toast.LENGTH_SHORT).show();
            }
        } else if (appType.equals("telegram")) {
            intent.setPackage("org.telegram.messenger");
            try {
                startActivity(intent);
            } catch (Exception e) {
                Toast.makeText(this, "Telegram not installed", Toast.LENGTH_SHORT).show();
            }
        } else if (appType.equals("sms")) {
            Intent smsIntent = new Intent(Intent.ACTION_VIEW);
            smsIntent.setData(Uri.parse("sms:"));
            smsIntent.putExtra("sms_body", fullMessage);
            startActivity(smsIntent);
        } else {
            startActivity(Intent.createChooser(intent, "Share Invitation Link"));
        }
    }

    // --- History Mode Functions ---
    private void loadHistoryList() {
        llHistoryList.removeAllViews();
        SharedPreferences prefs = getSharedPreferences("MobTrackerPrefs", Context.MODE_PRIVATE);
        String historyJsonStr = prefs.getString("locationHistory", "[]");

        try {
            JSONArray arr = new JSONArray(historyJsonStr);
            if (arr.length() == 0) {
                TextView empty = new TextView(this);
                empty.setText("No history logs recorded yet.");
                empty.setTextColor(0xFF64748B);
                empty.setPadding(16, 16, 16, 16);
                llHistoryList.addView(empty);
                return;
            }

            // Reverse iterate to show recent first
            for (int i = arr.length() - 1; i >= 0; i--) {
                JSONObject obj = arr.getJSONObject(i);
                final String sId = obj.getString("session_id");
                final double lt = obj.getDouble("lat");
                final double lg = obj.getDouble("lng");
                long ts = obj.getLong("timestamp");

                String timeStr = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(new Date(ts));

                LinearLayout card = new LinearLayout(this);
                card.setOrientation(LinearLayout.VERTICAL);
                card.setBackgroundColor(0xFF0F172A); // slate-900
                card.setPadding(16, 16, 16, 16);
                LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
                params.setMargins(0, 0, 0, 16);
                card.setLayoutParams(params);

                TextView tvTitle = new TextView(this);
                tvTitle.setText("SESSION: " + sId.substring(0, Math.min(sId.length(), 8)).toUpperCase());
                tvTitle.setTextColor(0xFF10B981); // emerald-500
                tvTitle.setTextSize(14);
                card.addView(tvTitle);

                TextView tvDetails = new TextView(this);
                tvDetails.setText("Lat: " + String.format(Locale.US, "%.4f", lt) + " | Lng: " + String.format(Locale.US, "%.4f", lg) + "\nTime: " + timeStr);
                tvDetails.setTextColor(0xFF94A3B8); // slate-400
                tvDetails.setTextSize(12);
                card.addView(tvDetails);

                Button btnViewMap = new Button(this);
                btnViewMap.setText("VIEW ON MAP");
                btnViewMap.setBackgroundColor(0xFF1E293B); // slate-800
                btnViewMap.setTextColor(0xFFF8FAFC);
                btnViewMap.setOnClickListener(v -> {
                    webViewHistoryMap.setVisibility(View.VISIBLE);
                    webViewHistoryMap.evaluateJavascript("updateMarker(" + lt + ", " + lg + ", 'Historical Point', false);", null);
                });
                card.addView(btnViewMap);

                llHistoryList.addView(card);
            }

        } catch (Exception e) {
            Log.e(TAG, "Failed loading history: " + e.getMessage());
        }
    }

    private void addHistoryLog(String sessionId, double lat, double lng) {
        SharedPreferences prefs = getSharedPreferences("MobTrackerPrefs", Context.MODE_PRIVATE);
        String historyJsonStr = prefs.getString("locationHistory", "[]");

        try {
            JSONArray arr = new JSONArray(historyJsonStr);
            JSONObject log = new JSONObject();
            log.put("session_id", sessionId);
            log.put("lat", lat);
            log.put("lng", lng);
            log.put("timestamp", System.currentTimeMillis());
            arr.put(log);

            prefs.edit().putString("locationHistory", arr.toString()).apply();
        } catch (Exception e) {
            Log.e(TAG, "Failed adding history log: " + e.getMessage());
        }
    }

    private void clearHistoryLogs() {
        getSharedPreferences("MobTrackerPrefs", Context.MODE_PRIVATE).edit().remove("locationHistory").apply();
        loadHistoryList();
        Toast.makeText(this, "History cleared", Toast.LENGTH_SHORT).show();
    }

    private void exportCSVHistory() {
        SharedPreferences prefs = getSharedPreferences("MobTrackerPrefs", Context.MODE_PRIVATE);
        String historyJsonStr = prefs.getString("locationHistory", "[]");

        try {
            JSONArray arr = new JSONArray(historyJsonStr);
            if (arr.length() == 0) {
                Toast.makeText(this, "No history logs to export", Toast.LENGTH_SHORT).show();
                return;
            }

            StringBuilder csv = new StringBuilder("Session ID,Latitude,Longitude,Timestamp\n");
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                csv.append(obj.getString("session_id")).append(",")
                        .append(obj.getDouble("lat")).append(",")
                        .append(obj.getDouble("lng")).append(",")
                        .append(obj.getLong("timestamp")).append("\n");
            }

            // In our native app, we can write a simple file or share the text
            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType("text/csv");
            intent.putExtra(Intent.EXTRA_SUBJECT, "MobTracker Location History");
            intent.putExtra(Intent.EXTRA_TEXT, csv.toString());
            startActivity(Intent.createChooser(intent, "Export History CSV"));

        } catch (Exception e) {
            Log.e(TAG, "Failed exporting CSV: " + e.getMessage());
        }
    }

    @Override
    protected void onDestroy() {
        pollingHandler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }
}
