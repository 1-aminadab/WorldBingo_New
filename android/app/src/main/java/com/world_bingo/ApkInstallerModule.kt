package com.world_bingo

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

class ApkInstallerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ApkInstaller"
    }

    @ReactMethod
    fun installApk(filePath: String, promise: Promise) {
        try {
            val context = reactApplicationContext
            val file = File(filePath)

            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "APK file does not exist at: $filePath")
                return
            }

            val intent = Intent(Intent.ACTION_VIEW)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            
            val apkUri: Uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                // For Android 7.0 and above, use FileProvider
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.fileprovider",
                    file
                )
            } else {
                // For older versions, use file:// URI
                Uri.fromFile(file)
            }

            intent.setDataAndType(apkUri, "application/vnd.android.package-archive")
            
            context.startActivity(intent)
            promise.resolve("Installation started")

        } catch (e: Exception) {
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

