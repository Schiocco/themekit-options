<?php

/*
 * Plugin Name: Themekit Options Lite
 * Plugin URI: https://themekit.dev/options/
 * Description: WordPress Theme Options Panel
 * Version: 1.0
 * Author: Schiocco
 * Author URI: https://schiocco.com/
 */

/*
 * ------------------------------
 * # INIT
 * ------------------------------
 */

$THEMEKIT_OPTIONS_FONTS_CODE;
$THEMEKIT_OPTIONS_SETTINGS;
$THEMEKIT_OPTIONS_SETTINGS_POST;
define('THEMEKIT_OPTIONS_URL', plugins_url() . '/themekit-options-lite');
define('THEMEKIT_OPTIONS_PATH', dirname(__FILE__));
define('THEMEKIT_OPTIONS_VERSION', get_file_data( __FILE__ , array('Version'), 'plugin')[0]);

if (file_exists(THEMEKIT_OPTIONS_PATH . '/custom/custom.php')) {
    require_once(THEMEKIT_OPTIONS_PATH . '/custom/custom.php');
}

function themekit_options_init() {
    global $THEMEKIT_OPTIONS_SETTINGS;
    global $THEMEKIT_OPTIONS_SETTINGS_POST;
    global $sitepress;
    if (!isset($THEMEKIT_OPTIONS_SETTINGS)) {
        $THEMEKIT_OPTIONS_SETTINGS = get_option('themekit-options-settings');
    }
    if (!is_admin() && is_single() && !isset($THEMEKIT_OPTIONS_SETTINGS_POST)) {
        global $wp_query;
        $id = $wp_query->post->ID;
        $THEMEKIT_OPTIONS_SETTINGS_POST = get_option('themekit-options-settings-post-' . $id);
    }
    if ($THEMEKIT_OPTIONS_SETTINGS == false) {
        $THEMEKIT_OPTIONS_SETTINGS = array('settings' => array(), 'private' => array('language' => ''));
    }
    if ($THEMEKIT_OPTIONS_SETTINGS_POST == false) {
        $THEMEKIT_OPTIONS_SETTINGS_POST = null;
    }
}

function themekit_options_enqueue() {
    if (themekit_options_is_post_allowed() || key_exists('page', $_GET) && $_GET['page'] == 'themekit-options') {
        wp_enqueue_style('themekit-options-css', THEMEKIT_OPTIONS_URL . '/css/main.css', array(), '1.0', 'all');
        wp_enqueue_script('themekit-options-js', THEMEKIT_OPTIONS_URL . '/js/main.js', array('jquery', 'wp-color-picker', 'wp-theme-plugin-editor'), '1.0');
        wp_enqueue_script('rangeslider', THEMEKIT_OPTIONS_URL . '/js/rangeslider.min.js', array('jquery'), '1.0');

        if (file_exists(THEMEKIT_OPTIONS_PATH . '/custom/admin.css')) {
            wp_enqueue_style('themekit-options-custom-admin', THEMEKIT_OPTIONS_URL . '/custom/admin.css', array('themekit-options-css'), '1.0', 'all');
        }

        // WordPress Code Editor
        wp_enqueue_script('wp-theme-plugin-editor');
        wp_enqueue_style('wp-codemirror');
        wp_enqueue_code_editor(array());

        // WordPress Color Picker
        wp_enqueue_style('wp-color-picker');
        wp_enqueue_script('wp-color-picker');

        // WordPress Uploader
        wp_enqueue_media();
    }
}

function themekit_options_enqueue_front() {
    global $THEMEKIT_OPTIONS_SETTINGS;
    if (file_exists(THEMEKIT_OPTIONS_PATH . '/custom/custom.auto.css')) {
        wp_enqueue_style('themekit-options-custom', THEMEKIT_OPTIONS_URL . '/custom/custom.auto.css', array(), '1.0', 'all');
    } else {
        if (file_exists(THEMEKIT_OPTIONS_PATH . '/custom/custom.css')) {
            wp_enqueue_style('themekit-options-custom', THEMEKIT_OPTIONS_URL . '/custom/custom.css', array(), '1.0', 'all');
        }
    }
    if (file_exists(THEMEKIT_OPTIONS_PATH . '/custom/custom.js')) {
        wp_enqueue_script('themekit-options-custom-js',  THEMEKIT_OPTIONS_URL . '/custom/custom.js', array('jquery'), '1.0', true);
    }
    if (isset($THEMEKIT_OPTIONS_SETTINGS['private']) && isset($THEMEKIT_OPTIONS_SETTINGS['private']['fonts'])) {
        wp_enqueue_style('themekit-options-fonts', add_query_arg('family', $THEMEKIT_OPTIONS_SETTINGS['private']['fonts'][0], 'https://fonts.googleapis.com/css'), array(), '1.0', 'all');
    }
}

function themekit_options_meta_content() {
    echo '<button class="themekit-button themekit-options-open" type="button">' . esc_attr__('Page options', 'themekit') . '</button>';
}

function themekit_options_meta() {
    if (themekit_options_is_post_allowed()) {
        $post_types = get_post_types(array('public' => true, '_builtin' => false), 'names', 'and');
        add_meta_box('themekit-options-button', 'Page options', 'themekit_options_meta_content', array_merge(array('post', 'page'), $post_types), 'side', 'low');
    }
}

function themekit_options_meta_footer() {
    if (themekit_options_is_post_allowed()) {
        echo '<div id="themekit-options-single"><div class="themekit-meta">';
        require(THEMEKIT_OPTIONS_PATH . '/include/theme-options.php');
        echo '</div><div class="themekit-overlay"></div></div>';
    }
}

function themekit_options_wp_init() {
    add_theme_page(esc_attr__('Theme options', 'themekit'), esc_attr__('Theme options', 'themekit'), 'manage_options', 'themekit-options', function() { include(THEMEKIT_OPTIONS_PATH . '/include/theme-options.php'); }, null, 99);
}

/*
 * ------------------------------
 * # FUNCTIONS
 * ------------------------------
 */

require_once(THEMEKIT_OPTIONS_PATH . '/include/functions.php');

/*
 * ------------------------------
 * # ACTIONS
 * ------------------------------
 */

add_action('template_redirect', 'themekit_options_init');
add_action('admin_enqueue_scripts', 'themekit_options_enqueue');
add_action('wp_enqueue_scripts', 'themekit_options_enqueue_front');
add_action('admin_menu', 'themekit_options_wp_init');
add_action('admin_footer', 'themekit_options_meta_footer');
add_action('wp_ajax_themekit_options_save', 'themekit_options_save');
add_action('wp_ajax_themekit_options_get', 'themekit_options_get');
add_action('wp_ajax_themekit_options_delete_demo', 'themekit_options_delete_demo');
add_action('add_meta_boxes', 'themekit_options_meta');
register_activation_hook(__FILE__, 'themekit_options_on_delete');
register_activation_hook(__FILE__, 'themekit_options_on_activation');

?>