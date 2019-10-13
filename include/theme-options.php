<?php
/*
 *
 * ===========================================================
 * THEME OPTIONS PANEL - THEMEKIT OPTIONS
 * ===========================================================
 *
 */

/*
 * -----------------------------------------------------------
 * # INIT
 * -----------------------------------------------------------
 */

echo themekit_options_init_panel();

/*
 * -----------------------------------------------------------
 * # FUNCTIONS
 * -----------------------------------------------------------
 */

function themekit_options_get_setting_code($array) {
    global $THEMEKIT_OPTIONS_FONTS_CODE;
    if (isset($array)) {
        $id = $array['id'];
        $type = $array['type'];
        $content = '<div id="' . $id . '" data-type="' . $type . '" class="themekit-setting themekit-' . $type . '"><div class="content"><h2>' . esc_attr__($array["title"], 'themekit') . '</h2><p>' . __($array["content"], 'themekit') . '</p></div><div class="input">';
        if ($type == 'wp-editor' && isset($_POST['post'])) {
            $type = 'textarea';
        }
        switch ($type) {
            case 'color':
                $content .= '<input type="text">';
                break;
            case 'text':
                $content .= '<input type="text">';
                break;
            case 'textarea':
                $content .= '<textarea></textarea>';
                break;
            case 'select':
                $content .= '<select>';
                for ($i = 0; $i < count($array['value']); $i++) {
                    $content .= '<option value="' . strtolower(str_replace(' ', '-', $array['value'][$i])) . '">' . $array['value'][$i] . '</option>';
                }
                $content .= '</select>';
                break;
            case 'checkbox':
                $content .= '<input type="checkbox">';
                break;
            case 'radio':
                for ($i = 0; $i < count($array['value']); $i++) {
                    $content .= '<div><input type="radio" name="' . $id . '" value="' . strtolower(str_replace(' ', '-', $array['value'][$i])) . '"><label>' . $array["value"][$i] . '</label></div>';
                }
                break;
            case 'number':
                $content .= '<input type="number">' . (key_exists('unit', $array) ? '<label>' . $array['unit'] . '</label>' : '');
                break;
            case 'number-4':
                $unit = (key_exists('unit', $array) ? '<label>' . $array['unit'] . '</label>' : '');
                $content .= '<input type="number">' . $unit . '<input type="number">' . $unit . '<input type="number">' . $unit . '<input type="number">' . $unit;
                break;
            case 'upload':
                $content .= '<input type="url"><button type="button">' . esc_attr__('Choose file', 'themekit') . '</button>';
                break;
            case 'upload-image':
                $content .= '<div class="image"' . (isset($array['background-size']) ? ' style="background-size: ' . $array['background-size'] . '"' : '')  . '><i></i></div>';
                break;
            case 'code':
                $mode = (isset($array['mode']) ? $array['mode'] : '');
                    $content .= '<textarea data-mode="' . $mode . '"></textarea>';
                break;
            case 'font':
                if (isset($THEMEKIT_OPTIONS_FONTS_CODE)) {
                    $content .= $THEMEKIT_OPTIONS_FONTS_CODE;
                } else {
                    $THEMEKIT_OPTIONS_FONTS_CODE = '<div><select><option value=""></option>';
                    $string = themekit_options_file_get_contents(THEMEKIT_OPTIONS_PATH . "/include/resources/google-fonts.json");
                    $array = json_decode($string, true);
                    for ($i = 0; $i < count($array); $i++) {
                        $variants = '';
                        for ($y = 0; $y < count($array[$i]['variants']); $y++) {
                            $variants .= $array[$i]['variants'][$y] . ',';
                        }
                        $THEMEKIT_OPTIONS_FONTS_CODE .= '<option data-variants="' . $variants . '" value="' . $array[$i]['family'] . '">' . $array[$i]['family'] . '</option>';
                    }
                    $THEMEKIT_OPTIONS_FONTS_CODE .= '</select><div data-value="" class="font-variants"></div></div>';
                    $content .= $THEMEKIT_OPTIONS_FONTS_CODE;
                }
                break;
            case 'multi-input':
                for ($i = 0; $i < count($array['value']); $i++) {
                    $type = $array['value'][$i]['type'];
                    $content .= '<div id="' . $array['value'][$i]['id'] . '" data-type="' . $type . '" class="multi-input-' . $array['value'][$i]['type'] . '"><label>' . $array['value'][$i]['title'] . '</label>';
                    switch ($type) {
                        case 'text':
                            $content .= '<input type="text">';
                            break;
                        case 'textarea':
                            $content .= '<textarea></textarea>';
                            break;
                        case 'upload':
                            $content .= '<input type="url"><button type="button">' . esc_attr__('Choose file', 'themekit') . '</button>';
                            break;
                        case 'checkbox':
                            $content .= '<input type="checkbox">';
                            break;
                    }
                    $content .= '</div>';
                }
                break;
            case 'wp-editor':
                ob_start();
                wp_editor('', 'wp-editor-' . $id, array('editor_height' => 200));
                $content .= ob_get_contents();
                ob_end_clean();
                break;
            case 'range':
                $range = (key_exists('range', $array) ? $array['range'] : array(0, 100));
                $unit = (key_exists('unit', $array) ? '<label>' . $array['unit'] . '</label>' : '');
                $content .= '<label class="range-value">' . $range[0] . '</label><input type="range" min="' . $range[0] .'" max="' . $range[1] .'" value="' . $range[0] . '" />' . $unit;
                break;
            case 'select-image':
                $html = '<div class="thumbs" data-columns="' . (key_exists('columns', $array) ? $array['columns'] : '3') . '">';
                for ($i = 0; $i < count($array['value']); $i++) {
                    $name = $array['value'][$i][0];
                    $html .= '<div data-id="' . strtolower(str_replace(' ', '-', $name)) . '"><span><img src="' . THEMEKIT_OPTIONS_URL . '/custom/thumbs/' . $array['value'][$i][1] . '"></span><p>' . $name . '</p></div>';
                }
                $content .= $html . '</div>';
                break;
            case 'system-requirements':
                $html = '';
                $label = '';
                $status = '';
                $value = '';
                for ($i = 0; $i < count($array['value']); $i++) {
                    $type = $array['value'][$i];
                    switch ($type) {
                        case 'post-max-size':
                        case 'upload-max-size':
                        case 'memory-limit':
                            $ini = 'memory_limit';
                            $min = 256;
                            if ($type == 'memory-limit') {
                                $label =  esc_attr__('Memory limit', 'themekit');
                            }
                            if ($type == 'upload-max-size') {
                                $label =  esc_attr__('Max upload size', 'themekit');
                                $ini = 'upload_max_filesize';
                                $min = 64;
                            }
                            if ($type == 'post-max-size') {
                                $label =  esc_attr__('Max post size', 'themekit');
                                $ini = 'post_max_size';
                                $min = 64;
                            }
                            $value = str_replace('M', '', ini_get($ini));
                            if (is_numeric($value) && (int)$value >= $min) {
                                $status = 'valid';
                                $value .= 'M';
                            } else {
                                $status = 'invalid';
                                $value = 'Minimum: ' . $min . 'M. Current: ' . $value . 'M';
                            }
                            break;
                        case 'max-execution-time':
                            $value = ini_get('max_execution_time');
                            $label =  esc_attr__('Max execution time', 'themekit');
                            if (is_numeric($value) && ((int)$value > 59 || $value == '0')) {
                                $status = 'valid';
                                $value = ($value == '0' ? 'Infinite' : $value . 'S');
                            } else {
                                $status = 'invalid';
                                $value = 'Minimum: 60S. Current: ' . $value . 'S';
                            }
                            break;
                        case 'zip':
                            $label =  esc_attr__('Zip extension', 'themekit');
                            if (extension_loaded('zip')) {
                                $status = 'valid';
                                $value = 'Active';
                            } else {
                                $status = 'invalid';
                                $value = 'Not active';
                            }
                            break;
                        case 'uploads-folder-writable':
                            $label =  esc_attr__('Upload folder writable', 'themekit');
                            if (wp_is_writable(wp_get_upload_dir()['basedir'])){
                                $status = 'valid';
                                $value = 'Writable';
                            } else {
                                $status = 'invalid';
                                $value = 'Not writable';
                            }
                            break;
                        case 'php-version':
                            $label =  esc_attr__('PHP version', 'themekit');
                            if (defined('PHP_VERSION')) {
                                $version = explode('.', PHP_VERSION);
                                if ($version[0] >= 7 && $version[1] >= 2) {
                                    $status = 'valid';
                                    $value = PHP_VERSION;
                                } else {
                                    $status = 'invalid';
                                    $value = 'Min 7.2. Current: ' . PHP_VERSION;
                                }
                            } else {
                                $status = 'invalid';
                                $value = 'Min 7.2. Current: < 5.2';
                            }
                            break;
                    }
                    $html .= '<div class="' . $status . '"><label>' . $label . '</label><i></i><span>' . $value . '</span></div>';
                }
                $content .= $html;
                break;
            case 'repeater':
                $content .= '<div class="themekit-repeater"><div class="repeater-item">';
                for ($i = 0; $i < count($array['items']); $i++) {
                    $item = $array['items'][$i];
                    $content .= '<div><label>' . esc_attr__($item['name'], 'themekit') . '</label>';
                    switch ($item['type']) {
                        case 'text':
                            $content .= '<input data-id="' . $item['id'] . '" type="text">';
                            break;
                        case 'textarea':
                            $content .= '<textarea data-id="' . $item['id'] . '"></textarea>';
                            break;
                    }
                    $content .= '</div>';
                }
                $content .= '<i class="themekit-close"></i></div></div><a class="themekit-button themekit-repeater-add">' . esc_attr__('Add new item', 'themekit') . '</a>';
                break;

        }
        return $content . '</div></div>';
    }
    return '';
}

function themekit_options_update_settings_array($array, $custom) {
    if (defined('THEMEKIT_OPTIONS_DEFAULT') && THEMEKIT_OPTIONS_DEFAULT) {
        foreach ($custom as $key => $value) {
            if (key_exists($key, $array['settings'])) {
                if (isset($array['settings'][$key][0])) {
                    for ($i = 0; $i < count($value); $i++) {
                        array_push($array['settings'][$key], $value[$i]);
                    }
                } else {
                    if (!isset($value[0])) {
                        foreach ($value as $key2 => $value2) {
                            if (key_exists($key2, $array['settings'][$key])) {
                                for ($i = 0; $i < count($value2); $i++) {
                                    array_push($array['settings'][$key][$key2], $value2[$i]);
                                }
                            } else {
                                $array['settings'][$key][$key2] = $value2;
                            }
                        }
                    }
                }
            } else {
                $array['settings'][$key] = $value;
            }
        }
        return $array;
    } else {
        return $custom;
    }
}

function themekit_options_init_panel() {
    $panel_content = '';
    $array = array('settings' => array(), 'advanced' => array());
    $is_post = isset($_GET['post']) || strpos($_SERVER['PHP_SELF'], 'post-new.php') > 0;
    $hidden_items = array();

    // Default settings
    if (defined('THEMEKIT_OPTIONS_DEFAULT') && THEMEKIT_OPTIONS_DEFAULT) {
        $string = themekit_options_file_get_contents(THEMEKIT_OPTIONS_PATH . '/include/resources/default-settings.json');
        $array = json_decode($string, true);
    }

    // Custom settings
    if (file_exists(THEMEKIT_OPTIONS_PATH . '/custom/settings.json')) {
        $string = themekit_options_file_get_contents(THEMEKIT_OPTIONS_PATH . '/custom/settings.json');
        $array = themekit_options_update_settings_array($array, json_decode($string, true));
    }
    $array = apply_filters('themekit_options_init_panel', $array);

    if ($is_post && (!isset($array['advanced']) || (isset($array['advanced']) && !isset($array['advanced']['hidden-items'])))) {
        $is_post = false;
    } else {
        if (isset($array['advanced']['hidden-items'])) {
            $hidden_items = $array['advanced']['hidden-items'];
        }
    }

    // Panel initialization
    $settings_array = array();
    if (is_array($array) && count($array['settings']) > 0) {
        $settings_array = $array['settings'];
    }
    $html_nav = '';
    $html_content = '';
    foreach ($settings_array as $key => $value) {
        if (is_array($value)) {
            $html_content .= '<section>';
            if (isset($value[0]) && themekit_options_is_allowed($is_post, $key, $hidden_items)) {
                $html_nav .= '<li><a>' . $key . '</a></li>';
                for ($i = 0; $i < count($value); $i++) {
                    if (themekit_options_is_allowed($is_post, $value[$i]['id'], $hidden_items)) {
                        $html_content .= themekit_options_get_setting_code($value[$i]);
                    }
                }
            } else {
                if (themekit_options_is_allowed($is_post, $key, $hidden_items)) {
                    $html_nav .= '<li class="themekit-dropdown"><a>' . __($key, 'themekit') . '</a><ul>';
                    foreach ($value as $key2 => $value2) {
                        if (is_array($value2)) {
                            if (themekit_options_is_allowed($is_post, $key2, $hidden_items)) {
                                $html_nav .= '<li><a>' . $key2 . '</a></li>';
                                $html_content .= '<div class="themekit-inner-section">';
                                for ($i = 0; $i < count($value2); $i++) {
                                    if (themekit_options_is_allowed($is_post, $value2[$i]['id'], $hidden_items)) {
                                        $html_content .= themekit_options_get_setting_code($value2[$i]);
                                    }
                                }
                                $html_content .= '</div>';
                            }
                        }
                    }
                    $html_nav .= '</ul></li>';
                }
            }
            $html_content .= '</section>';
        }
    }
    $panel_content .= '<div class="themekit-lite"><a href="https://themekit.dev/options/" target="_blank"><img src="' . THEMEKIT_OPTIONS_URL . '/media/themekit-lite-banner.png" /></a></div><div class="themekit-header"><p><i></i></p><div><img src="' . (defined('THEMEKIT_OPTIONS_LOGO') ? THEMEKIT_OPTIONS_LOGO : THEMEKIT_OPTIONS_URL . '/media/logo.svg') . '" /><div><a href="' . (defined('THEMEKIT_OPTIONS_DOCS') ? THEMEKIT_OPTIONS_DOCS : 'https://themekit.dev/docs/options/') . '" target="_blank">Documentation</a><a>' . esc_attr__('Version', 'themekit') . ' ' . THEMEKIT_OPTIONS_VERSION . '</a><a class="themekit-button themekit-button-blue themekit-options-save">' . esc_attr__('Save changes', 'themekit') . '</a></div></div></div>';
    $panel_content .= '<div class="themekit-panel"><ul>' . $html_nav . '</ul><main class="themekit-loading">' . $html_content . '</main><input type="hidden" id="themekit-server-settings" data-uploads-url="' . wp_get_upload_dir()['baseurl'] . '"></div><div class="themekit-lite"><a href="https://schiocco.com/products/" target="_blank"><img src="' . THEMEKIT_OPTIONS_URL . '/media/themekit-lite-banner-2.png" /></a></div>';
    return $panel_content;
}

function themekit_options_is_allowed($is_post, $key, $hidden_items) {
    return !$is_post || ($is_post && !in_array($key, $hidden_items));
}

?>
