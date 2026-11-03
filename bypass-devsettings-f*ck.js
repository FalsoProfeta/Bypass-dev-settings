/*
 * Bypass de detección de Opciones de Desarrollador y Depuración USB
 * Uso: frida -U -f <paquete.de.la.app> -l bypass_devmode.js --no-pause
 */

Java.perform(function () {
    console.log("[*] Iniciando bypass de Opciones de Desarrollador...");

    // 1. Hookear Settings.Global.getInt para development_settings_enabled y adb_enabled
    var SettingsGlobal = Java.use("android.provider.Settings$Global");
    SettingsGlobal.getInt.overload(
        "android.content.ContentResolver", 
        "java.lang.String", 
        "int"
    ).implementation = function (resolver, name, def) {
        // Si la app pregunta por estas claves, mentimos y decimos que están desactivadas (0)
        if (name === "development_settings_enabled" || name === "adb_enabled") {
            console.log("[+] Bypass: Settings.Global.getInt -> " + name + " (retornando 0)");
            return 0;
        }
        // Para cualquier otra clave, devolvemos el valor real
        return this.getInt(resolver, name, def);
    };

    // 2. Hookear Settings.Secure.getInt por si la app usa esta otra fuente
    var SettingsSecure = Java.use("android.provider.Settings$Secure");
    SettingsSecure.getInt.overload(
        "android.content.ContentResolver", 
        "java.lang.String", 
        "int"
    ).implementation = function (resolver, name, def) {
        if (name === "development_settings_enabled" || name === "adb_enabled") {
            console.log("[+] Bypass: Settings.Secure.getInt -> " + name + " (retornando 0)");
            return 0;
        }
        return this.getInt(resolver, name, def);
    };

    // 3. (Opcional) Hookear Debug.isDebuggerConnected para cubrir la detección de depurador
    try {
        var Debug = Java.use("android.os.Debug");
        Debug.isDebuggerConnected.implementation = function () {
            console.log("[+] Bypass: Debug.isDebuggerConnected -> false");
            return false;
        };
    } catch (e) {
        console.log("[-] No se pudo hookear Debug.isDebuggerConnected (posiblemente no está presente)");
    }

    console.log("[*] Hooks de bypass de Opciones de Desarrollador instalados correctamente.");
});
