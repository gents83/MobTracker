# Standard ProGuard/R8 configuration for Capacitor, WebView, Cordova, and MobTracker.

# Keep Capacitor Core classes and Plugins
-keep public class * extends com.getcapacitor.Plugin
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * {
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
}
-keep class com.getcapacitor.** { *; }

# Keep Cordova framework and plugins
-keep class org.apache.cordova.** { *; }
-keep public class * extends org.apache.cordova.CordovaPlugin

# Keep all custom classes in MobTracker package
-keep class com.mobtrack.app.** { *; }

# Keep WebView JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve line number information and source files for readable stack traces in Play Store Console
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
