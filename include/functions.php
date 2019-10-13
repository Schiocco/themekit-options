<?php
/*
 *
 * ===========================================================
 * THEME OPTIONS FUNCTIONS - THEMEKIT OPTIONS
 * ===========================================================
 *
 */

/*
 * -----------------------------------------------------------
 * # FILE GET CONTENTS
 * -----------------------------------------------------------
 *
 * WordPress equivalent of the file_get_contents function
 *
 */

function themekit_options_file_get_contents($path) {
    global $wp_filesystem;
    if (empty($wp_filesystem)) {
        require_once (ABSPATH . '/wp-admin/includes/file.php');
        WP_Filesystem();
    }
    return $wp_filesystem->get_contents($path);
}

/*
 * -----------------------------------------------------------
 * # IS POST ALLOWED
 * -----------------------------------------------------------
 *
 * Check if the the user is editing a post, page or post type.
 *
 */

function themekit_options_is_post_allowed() {
    return ((!defined('THEMEKIT_OPTIONS_SINGLE_POST') || THEMEKIT_OPTIONS_SINGLE_POST) && ((key_exists('post', $_GET) && key_exists('action', $_GET) && $_GET['action'] == 'edit') || strpos($_SERVER['PHP_SELF'], 'post-new.php') > 0));
}

/*
 * -----------------------------------------------------------
 * # SAVE
 * -----------------------------------------------------------
 *
 * Save the theme options settings to the database.
 * This function is called via AJAX.
 *
 */

function themekit_options_save() {
    global $THEMEKIT_OPTIONS_SETTINGS;
    if (isset($_POST['settings'])) {
        if (isset($_POST['single_post']) && $_POST['single_post'] != 'false' && isset($_POST['post_id'])) {
            update_option('themekit-options-settings-post-' . $_POST['post_id'], $_POST['settings']);
        } else {
            $THEMEKIT_OPTIONS_SETTINGS = $_POST['settings'];
            update_option('themekit-options-settings', $THEMEKIT_OPTIONS_SETTINGS);
        }
        die(true);
    }
    die(false);
}

/*
 * -----------------------------------------------------------
 * # GET
 * -----------------------------------------------------------
 *
 * Retrive a theme options settings array.
 *
 */

function themekit_options_get() {
    global $THEMEKIT_OPTIONS_SETTINGS;
    if (!isset($THEMEKIT_OPTIONS_SETTINGS)) {
        $THEMEKIT_OPTIONS_SETTINGS = get_option('themekit-options-settings');
    }
    if (isset($_POST['single_post']) && $_POST['single_post'] != 'false' && isset($_POST['post_id'])) {
        die(json_encode(array('global' => $THEMEKIT_OPTIONS_SETTINGS, 'post' => get_option('themekit-options-settings-post-' . $_POST['post_id']))));
    } else {
        die(json_encode($THEMEKIT_OPTIONS_SETTINGS));
    }
}

/*
 * -----------------------------------------------------------
 * # GET SETTING
 * -----------------------------------------------------------
 *
 * Retrive a theme options setting.
 *
 */

function themekit_options_get_setting($id, $type = false) {
    global $THEMEKIT_OPTIONS_SETTINGS;
    global $THEMEKIT_OPTIONS_SETTINGS_POST;
    $is_post_setted = isset($THEMEKIT_OPTIONS_SETTINGS_POST);
    if (key_exists('settings', $THEMEKIT_OPTIONS_SETTINGS) || $is_post_setted) {
        if ($is_post_setted && key_exists($id, $THEMEKIT_OPTIONS_SETTINGS_POST['settings'])) {
            return ($type ? $THEMEKIT_OPTIONS_SETTINGS_POST['settings'][$id] :  themekit_options_restore_json($THEMEKIT_OPTIONS_SETTINGS_POST['settings'][$id][0]));
        }
        if (key_exists($id, $THEMEKIT_OPTIONS_SETTINGS['settings'])) {
            return ($type ? $THEMEKIT_OPTIONS_SETTINGS['settings'][$id] :  themekit_options_restore_json($THEMEKIT_OPTIONS_SETTINGS['settings'][$id][0]));
        }
    }
    return ($type ? ['','']: '');
}

/*
 * -----------------------------------------------------------
 * # BACKUP AND RESTORE ON PLUGIN DELETION / ACTIVATION
 * -----------------------------------------------------------
 *
 * Backup all the files into the /custom/ plugins folder.
 * Restore all the backup files on plugin activation.
 * The backup is inside /wp-contents/themekit/backup/.
 * This function allow the update of the plugin without lost the files into the /custom/ folder.
 *
 */

function themekit_options_on_delete() {
    register_uninstall_hook(__FILE__ , 'THEMEKIT_OPTIONS_on_delete_function');
}

function themekit_options_on_delete_function() {
    try  {
        if (is_dir(THEMEKIT_OPTIONS_PATH . '/custom')) {
            themekit_options_copy(THEMEKIT_OPTIONS_PATH . '/custom/', wp_get_upload_dir()['basedir'] . '/themekit/backup/');
        }
    } catch (Exception $exception) { }
};

function themekit_options_on_activation() {
    try {
        if (is_dir(wp_get_upload_dir()['basedir'] . '/themekit/backup')) {
            themekit_options_copy(wp_get_upload_dir()['basedir'] . '/themekit/backup/', THEMEKIT_OPTIONS_PATH . '/custom/');
        }
    } catch (Exception $exception) { }
}

/*
 * -----------------------------------------------------------
 * # VARIOUS FUNCTIONS
 * -----------------------------------------------------------
 *
 * 1. themekit_options_create_dirs: create the /themekit/ and /themekit/export/ folders into the WordPress uploads folder.
 * 2. themekit_options_replace_media_url: replace the media urls of the imported contents with the new url of the website that's importing the contents.
 * 3. themekit_options_copy: recursively copy all files and folders to the destination directory.
 * 4. themekit_options_delete: recursively delete all files and folders of the target directory.
 * 5. themekit_options_restore_json: restore the original value from a json encoded value.
 * 6. themekit_options_curl: performe a call to an external url.
 * 7. themekit_options_get_array_settings: load a json file and return the array.
 *
 */

function themekit_options_create_dirs($uploads_dir) {
    if (!file_exists($uploads_dir . '/themekit')) {
        mkdir($uploads_dir . '/themekit', 0777, true);
    }
    if (!file_exists($uploads_dir . '/themekit/export')) {
        mkdir($uploads_dir . '/themekit/export', 0777, true);
    }
}

function themekit_options_replace_media_url($content, $new_url, $original_url) {
    $content = str_replace($original_url, $new_url, $content);
    return $content;
}

function themekit_options_copy($src, $dst) {
    $dir = opendir($src);
    @mkdir($dst);
    while(false !== ( $file = readdir($dir)) ) {
        if (( $file != '.' ) && ( $file != '..' )) {
            if ( is_dir($src . '/' . $file) ) {
                themekit_options_copy($src . '/' . $file, $dst . '/' . $file);
            }
            else {
                copy($src . '/' . $file,$dst . '/' . $file);
            }
        }
    }
    closedir($dir);
}

function themekit_options_delete($path) {
    if (is_dir($path)) {
        if (substr($path, strlen($path) - 1, 1) != '/') {
            $path .= '/';
        }
        $files = glob($path . '*', GLOB_MARK);
        foreach ($files as $file) {
            if (is_dir($file)) {
                themekit_options_delete($file);
            } else {
                unlink($file);
            }
        }
        rmdir($path);
    }
}

function themekit_options_restore_json($value) {
    $value = str_replace("\\\\", "\\", $value);
    $value = str_replace("\\n", "\n", $value);
    $value = str_replace("\\r", "\r", $value);
    $value = str_replace("\\t", "\t", $value);
    $value = str_replace("\\f", "\f", $value);
    $value = str_replace('\\"', '"', $value);
    $value = str_replace("\\'", "'", $value);
    return $value;
}

function themekit_options_curl($url, $timeout = 3) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_USERAGENT, "Firefox 32.0");
    $data = curl_exec($ch);
    curl_close($ch);
    return $data;
}

function themekit_options_get_array_settings($path) {
    $array = [];
    if (file_exists($path)) {
        $string = themekit_options_file_get_contents($path);
        $array = json_decode($string, true);
    }
    return $array;
}

?>