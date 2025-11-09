package com.world_bingo

import android.content.Context
import android.content.Intent
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import java.io.File

class ApkInstallerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ApkInstaller"
    }

    @ReactMethod
    fun getInstalledPackageInfo(promise: Promise) {
        try {
            val context = reactApplicationContext
            val packageManager = context.packageManager
            val packageName = context.packageName
            
            android.util.Log.d("ApkInstaller", "Getting info for package: $packageName")
            
            val packageInfo: PackageInfo = packageManager.getPackageInfo(packageName, 0)
            
            val info: WritableMap = Arguments.createMap()
            info.putString("packageName", packageInfo.packageName)
            info.putString("versionName", packageInfo.versionName ?: "unknown")
            info.putDouble("versionCode", if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                packageInfo.longVersionCode.toDouble()
            } else {
                @Suppress("DEPRECATION")
                packageInfo.versionCode.toDouble()
            })
            
            android.util.Log.d("ApkInstaller", "Package info - Name: ${packageInfo.packageName}, Version: ${packageInfo.versionName}")
            promise.resolve(info)
            
        } catch (e: Exception) {
            android.util.Log.e("ApkInstaller", "Failed to get package info: ${e.message}", e)
            promise.reject("PACKAGE_INFO_ERROR", "Failed to get package info: ${e.message}", e)
        }
    }

    @ReactMethod
    fun uninstallCurrentApp(promise: Promise) {
        try {
            val context = reactApplicationContext
            val packageName = context.packageName
            
            android.util.Log.d("ApkInstaller", "Attempting to uninstall current app: $packageName")
            
            val intent = Intent(Intent.ACTION_DELETE)
            intent.data = Uri.parse("package:$packageName")
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            
            context.startActivity(intent)
            promise.resolve("Uninstall initiated")
            
        } catch (e: Exception) {
            android.util.Log.e("ApkInstaller", "Failed to initiate uninstall: ${e.message}", e)
            promise.reject("UNINSTALL_ERROR", "Failed to initiate uninstall: ${e.message}", e)
        }
    }

    @ReactMethod
    fun installApk(filePath: String, promise: Promise) {
        try {
            val context = reactApplicationContext
            val file = File(filePath)

            android.util.Log.d("ApkInstaller", "Installing APK from: $filePath")
            android.util.Log.d("ApkInstaller", "File exists: ${file.exists()}")
            android.util.Log.d("ApkInstaller", "File readable: ${file.canRead()}")
            android.util.Log.d("ApkInstaller", "File size: ${file.length()} bytes")

            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "APK file does not exist at: $filePath")
                return
            }

            if (!file.canRead()) {
                promise.reject("FILE_NOT_READABLE", "APK file is not readable at: $filePath")
                return
            }

            // Check if we can install packages first
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val canInstall = context.packageManager.canRequestPackageInstalls()
                android.util.Log.d("ApkInstaller", "Can install packages: $canInstall")
                
                if (!canInstall) {
                    promise.reject("PERMISSION_REQUIRED", "Permission to install unknown apps is required")
                    return
                }
            }

            val intent = Intent(Intent.ACTION_VIEW)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            
            val apkUri: Uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                // For Android 7.0 and above, use FileProvider
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                
                android.util.Log.d("ApkInstaller", "Using FileProvider for Android N+")
                android.util.Log.d("ApkInstaller", "Authority: ${context.packageName}.fileprovider")
                
                try {
                    FileProvider.getUriForFile(
                        context,
                        "${context.packageName}.fileprovider",
                        file
                    )
                } catch (e: IllegalArgumentException) {
                    android.util.Log.e("ApkInstaller", "Failed to get URI from FileProvider: ${e.message}")
                    android.util.Log.e("ApkInstaller", "File path: $filePath")
                    
                    // Check file provider configuration
                    android.util.Log.d("ApkInstaller", "Checking file provider configuration...")
                    promise.reject("FILEPROVIDER_ERROR", "FileProvider configuration error. Check file_paths.xml for path: ${file.absolutePath}")
                    return
                }
            } else {
                // For older versions, use file:// URI
                android.util.Log.d("ApkInstaller", "Using direct file URI for older Android")
                Uri.fromFile(file)
            }

            android.util.Log.d("ApkInstaller", "APK URI: $apkUri")

            intent.setDataAndType(apkUri, "application/vnd.android.package-archive")
            
            // Verify that an activity can handle this intent
            val resolveInfo = context.packageManager.resolveActivity(intent, 0)
            if (resolveInfo == null) {
                promise.reject("NO_INSTALLER", "No app found to handle APK installation")
                return
            }
            
            android.util.Log.d("ApkInstaller", "Starting installation intent with resolver: ${resolveInfo.activityInfo.name}")
            context.startActivity(intent)
            
            promise.resolve("Installation started successfully")

        } catch (e: SecurityException) {
            android.util.Log.e("ApkInstaller", "Security error during installation: ${e.message}", e)
            promise.reject("SECURITY_ERROR", "Security error: ${e.message}. Check app permissions.", e)
        } catch (e: Exception) {
            android.util.Log.e("ApkInstaller", "Installation failed: ${e.message}", e)
            promise.reject("INSTALL_ERROR", "Failed to start APK installation: ${e.message}", e)
        }
    }

    @ReactMethod
    fun canInstallPackages(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val canInstall = reactApplicationContext.packageManager.canRequestPackageInstalls()
                promise.resolve(canInstall)
            } else {
                // For older versions, assume true
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("CHECK_ERROR", "Failed to check install permission: ${e.message}", e)
        }
    }

    @ReactMethod
    fun requestInstallPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val packageManager = reactApplicationContext.packageManager
                if (!packageManager.canRequestPackageInstalls()) {
                    val intent = Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES)
                    intent.data = Uri.parse("package:${reactApplicationContext.packageName}")
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    reactApplicationContext.startActivity(intent)
                    promise.resolve("Permission request started")
                } else {
                    promise.resolve("Permission already granted")
                }
            } else {
                promise.resolve("Permission not required for this Android version")
            }
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", "Failed to request install permission: ${e.message}", e)
        }
    }
}


