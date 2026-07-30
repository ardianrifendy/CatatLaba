package com.catatlaba.app;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "FileExport")
public class FileExportPlugin extends Plugin {
    @PluginMethod
    public void saveJson(PluginCall call) {
        String fileName = call.getString("fileName");
        String json = call.getString("json");

        if (fileName == null || fileName.trim().isEmpty() || !fileName.endsWith(".json")) {
            call.reject("Nama file backup tidak valid.");
            return;
        }

        if (json == null) {
            call.reject("Data backup tidak tersedia.");
            return;
        }

        try {
            Uri uri = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                ? writeWithMediaStore(fileName, json)
                : writeLegacyDownload(fileName, json);

            JSObject result = new JSObject();
            result.put("uri", uri.toString());
            result.put("fileName", fileName);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Export backup gagal.", error);
        }
    }

    private Uri writeWithMediaStore(String fileName, String json) throws Exception {
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
        values.put(MediaStore.MediaColumns.MIME_TYPE, "application/json");
        values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/CatatLaba");
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);

        Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (uri == null) {
            throw new IllegalStateException("Download URI tidak tersedia.");
        }

        try (OutputStream stream = resolver.openOutputStream(uri)) {
            if (stream == null) {
                throw new IllegalStateException("File backup tidak dapat dibuka.");
            }
            stream.write(json.getBytes(StandardCharsets.UTF_8));
        } catch (Exception error) {
            resolver.delete(uri, null, null);
            throw error;
        }

        values.clear();
        values.put(MediaStore.MediaColumns.IS_PENDING, 0);
        resolver.update(uri, values, null, null);
        return uri;
    }

    private Uri writeLegacyDownload(String fileName, String json) throws Exception {
        File directory = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "CatatLaba");
        if (!directory.exists() && !directory.mkdirs()) {
            throw new IllegalStateException("Folder Download/CatatLaba tidak dapat dibuat.");
        }

        File file = new File(directory, fileName);
        try (OutputStream stream = new FileOutputStream(file)) {
            stream.write(json.getBytes(StandardCharsets.UTF_8));
        }
        return Uri.fromFile(file);
    }
}
