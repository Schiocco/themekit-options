
/*
* 
* ===========================================================
* THEMEKIT OPTIONS - MAIN SCRIPT
* ===========================================================
*
*/

(function ($) {
    'use strict'; 

    let panel;
    let activePanel;
    let panelHeader;
    let sections;
    let wpMediaUploader;
    let wpMediaUploaderSettings = [];
    let arraySettings = { 'settings': {}, 'private': {} };
    let inputsArray = {};
    let serverSettings;
    let allowSave = true;
    let panelPost;
    let buttonPost;
    let isSinglePost = false;
    let postID = getURLParameter('post');

    $(document).ready(function () {

        /* 
        * ---------------------------------------------------
        * # INIT
        * ---------------------------------------------------
        */

        panel = $('.themekit-panel');
        panelHeader = $('.themekit-header');
        activePanel = (isEmpty(getURLParameter('panel')) ? 0 : parseInt(getURLParameter('panel')));
        sections = $(panel).find('main > section');
        serverSettings = $(panel).find(' > #themekit-server-settings');
        panelPost = $('#themekit-options-single');
        if (panelPost.length) {
            isSinglePost = true;
        } else {
            populatePanel();
        }
        wpMediaUploader = wp.media({ title: 'Select or upload a media file', button: { text: 'Use this media' }, multiple: false });
        $(panel).find('> ul > li').eq(activePanel).addClass('active').find('ul li:first-child').addClass('active');
        $(panel).find('> main > section').eq(activePanel).addClass('active').find('.themekit-inner-section').removeClass('active').eq(activePanel).addClass('active');
        $('body').addClass('themekit-options');

        /* 
        * ------------------------------
        * # THEME OPTIONS
        * ------------------------------
        */

        $(panel).on('click', '> ul > li > a', function () {
            let li = $(this).parent();
            let isActive = $(li).hasClass('active');
            activePanel = $(li).index();
            $(panel).find('li').removeClass('active');
            if (!isActive) {
                $(li).addClass('active');
                $(li).find('ul li:first-child').addClass('active');
            }
            $(sections).removeClass('active').eq(activePanel).addClass('active');
            $(sections).eq(activePanel).find('.themekit-inner-section').removeClass('active').eq(0).addClass('active');
            $(sections).eq(activePanel).find('.themekit-code').each(function () {
                inputsArray[$(this).attr('id')].codemirror.refresh();
            });
        });

        $(panel).on('click', '> ul > li > ul > li > a', function () {
            let li = $(this).parent();
            $(li).parent().find('li').removeClass('active');
            $(li).addClass('active');
            $(sections).eq(activePanel).find('.themekit-inner-section').removeClass('active').eq($(li).index()).addClass('active');
        });

        $(window).scroll(function () {
            let scroll = $(window).scrollTop();
            if (scroll > 100) {
                $(panelHeader).addClass('themekit-fixed-top');
            } else {
                $(panelHeader).removeClass('themekit-fixed-top');
            }
        });

        $(panelHeader).on("click", ".themekit-options-save", function () {
            let arraySettingsPost = { 'settings': {} };
            let update = false;
            allowSave = false;


            //Read settings
            $(this).addClass("themekit-loading");
            arraySettings['private']['fonts'] = ['', ''];
            updateInputRepeaters();
            $(panel).find(".themekit-setting").each(function () {
                let setting = getSetting(this);
                if (setting[0] != '') {
                    let value = [setting[1], setting[2]];
                    if (isSinglePost) {
                        let original = arraySettings['settings'][setting[0]];
                        if (original.join() != value.join() || (setting[2] == 'repeater' && JSON.stringify(original) != JSON.stringify(value))) {
                            arraySettingsPost['settings'][setting[0]] = value;
                            update = true;
                        }
                    } else {
                        arraySettings['settings'][setting[0]] = value;
                    }
                }
            });

            //Save
            if (!isSinglePost || update) {
                if (isSinglePost && isEmpty(postID)) {
                    postID = getURLParameter('post');
                    if (isEmpty(postID)) {
                        showNotice('Please publish the post first.', 'error');
                        $('.themekit-options-save', panelHeader).removeClass("themekit-loading");
                        return;
                    }
                }
                jQuery.ajax({
                    method: 'POST',
                    url: ajaxurl,
                    data: {
                        action: 'themekit_options_save',
                        settings: (isSinglePost ? arraySettingsPost : arraySettings),
                        single_post: (isSinglePost ? 'true' : 'false'),
                        post_id: postID
                    }
                }).done(function (response) {
                    if (response) {
                        showNotice('Settings updated', 'success');
                    } else {
                        showNotice('Error. Something went wrong :(', 'error');
                    }
                    $('.themekit-options-save', panelHeader).removeClass("themekit-loading");
                    allowSave = true;
                });
            } else {
                showNotice('Settings updated', 'success');
                $('.themekit-options-save', panelHeader).removeClass("themekit-loading");
                allowSave = true;
            }
        });

        $(panelHeader).on("click", " > p > i", function () {
            $(this).parent().removeClass('active');
        });

        if (isSinglePost) {
            buttonPost = $('#themekit-options-button');
            $(buttonPost).on("click", ".themekit-options-open", function () {
                $(panelPost).find('.themekit-meta').addClass('active');
                if ($(panel).find('main').hasClass('themekit-loading')) {
                    populatePanel();
                    $(panelHeader).find('> div > div').append('<i class="themekit-close themekit-button"></i>');
                }
            });
        }

        $(panelHeader).on("click", ".themekit-close", function () {
            $(panelPost).find('.themekit-meta').removeClass('active');
        });

        /* 
        * ------------------------------
        * # INPUTS
        * ------------------------------
        */

        $(panel).on('change', '.themekit-font select', function () {
            $(this).parent().find('.font-variants').html(getFontVariants($(this).find('option:selected').attr('data-variants')));
        });

        $(panel).on('change', '.themekit-font .font-variants input', function () {
            let container = $(this).parent().parent();
            let value = '';
            $(container).find('input').each(function () {
                if ($(this).is(':checked')) {
                    value += $(this).val() + ',';
                }
            });
            if (value != '') {
                value = value.substring(0, value.length - 1);
                $(container).attr('data-value', value);
            }
        });

        $(panel).on('click', '.themekit-upload button,.multi-input-upload button,.themekit-input-upload button', function () {
            wpMediaUpload(this, 'url');
        });

        $(panel).on('click', '.themekit-upload-image .input > .image', function () {
            wpMediaUpload(this, 'image');
        });

        wpMediaUploader.on('select', function () {
            let target = wpMediaUploaderSettings[0];
            let type = wpMediaUploaderSettings[1];
            let url = wpMediaUploader.state().get('selection').first().toJSON().url;
            if (type == 'image') {
                $(target).attr('data-url', url).css('background-image', 'url(' + url + ')');
            }
            if (type == 'url') {
                $(target).parent().find('input[type="url"]').val(url);
            }
        });

        $(panel).on('click', '.themekit-upload-image > .input > .image > i', function (e) {
            $(this).parent().removeAttr('data-url').css('background-image', '');
            e.preventDefault();
            return false;
        });

        $(panel).on('click', '.themekit-select-image .thumbs > div', function () {
            $(this).parent().find('> div').removeClass('active');
            $(this).addClass('active');
        });

        // Repeater
        $(panel).on('click', '.themekit-repeater-add', function () {
            let item = $.parseHTML('<div>' + $(this).parent().find('.repeater-item:last-child').html() + '</div>');
            $(item).find('[data-id]').each(function () {
                resetInputValue(this);
            });
            $(this).parent().find('.themekit-repeater').append('<div class="repeater-item">' + $(item).html() + '</div>');
        });

        $(panel).on('click', '.repeater-item > .themekit-close', function () {
            if ($(this).parent().parent().find('.repeater-item').length > 1) {
                $(this).parent().remove();
            }
        });

        $(panel).on('click', '.themekit-input-repeater > div > .themekit-close', function () {
            let item = $(this).parent();
            if ($(item).index() > 0) {
                $(item).remove();
            } else {
                item = $.parseHTML('<div>' + $(item).html() + '</div>');
                resetInputValue($(item).find('input'));
                $(this).parent().parent().append('<div>' + $(item).html() + '</div>');
            }
        });

        // Icons
        $(panel).on('click', '.themekit-icons', function () {
            if (!$(this).hasClass('active')) {
                if ($(this).find('.icons').length == 0) {
                    let family = $(this).data('family');
                    let icons = [];
                    let content = '<ul>';
                    if (family == 'dashicons') {
                        icons = ['dashicons-admin-appearance', 'dashicons-admin-collapse', 'dashicons-admin-comments', 'dashicons-admin-generic', 'dashicons-admin-home', 'dashicons-admin-links', 'dashicons-admin-media', 'dashicons-admin-network', 'dashicons-admin-page', 'dashicons-admin-plugins', 'dashicons-admin-post', 'dashicons-admin-settings', 'dashicons-admin-site', 'dashicons-admin-tools', 'dashicons-admin-users', 'dashicons-album', 'dashicons-align-center', 'dashicons-align-left', 'dashicons-align-none', 'dashicons-align-right', 'dashicons-analytics', 'dashicons-archive', 'dashicons-arrow-down', 'dashicons-arrow-down-alt', 'dashicons-arrow-down-alt2', 'dashicons-arrow-left', 'dashicons-arrow-left-alt', 'dashicons-arrow-left-alt2', 'dashicons-arrow-right', 'dashicons-arrow-right-alt', 'dashicons-arrow-right-alt2', 'dashicons-arrow-up', 'dashicons-arrow-up-alt', 'dashicons-arrow-up-alt2', 'dashicons-art', 'dashicons-awards', 'dashicons-backup', 'dashicons-book', 'dashicons-book-alt', 'dashicons-building', 'dashicons-businessman', 'dashicons-calendar', 'dashicons-calendar-alt', 'dashicons-camera', 'dashicons-carrot', 'dashicons-cart', 'dashicons-category', 'dashicons-chart-area', 'dashicons-chart-bar', 'dashicons-chart-line', 'dashicons-chart-pie', 'dashicons-clipboard', 'dashicons-clock', 'dashicons-cloud', 'dashicons-controls-back', 'dashicons-controls-forward', 'dashicons-controls-pause', 'dashicons-controls-play', 'dashicons-controls-repeat', 'dashicons-controls-skipback', 'dashicons-controls-skipforward', 'dashicons-controls-volumeoff', 'dashicons-controls-volumeon', 'dashicons-dashboard', 'dashicons-desktop', 'dashicons-dismiss', 'dashicons-download', 'dashicons-edit', 'dashicons-editor-aligncenter', 'dashicons-editor-alignleft', 'dashicons-editor-alignright', 'dashicons-editor-bold', 'dashicons-editor-break', 'dashicons-editor-code', 'dashicons-editor-contract', 'dashicons-editor-customchar', 'dashicons-editor-distractionfree', 'dashicons-editor-expand', 'dashicons-editor-help', 'dashicons-editor-indent', 'dashicons-editor-insertmore', 'dashicons-editor-italic', 'dashicons-editor-justify', 'dashicons-editor-kitchensink', 'dashicons-editor-ol', 'dashicons-editor-outdent', 'dashicons-editor-paragraph', 'dashicons-editor-paste-text', 'dashicons-editor-paste-word', 'dashicons-editor-quote', 'dashicons-editor-removeformatting', 'dashicons-editor-rtl', 'dashicons-editor-spellcheck', 'dashicons-editor-strikethrough', 'dashicons-editor-textcolor', 'dashicons-editor-ul', 'dashicons-editor-underline', 'dashicons-editor-unlink', 'dashicons-editor-video', 'dashicons-email', 'dashicons-email-alt', 'dashicons-exerpt-view', 'dashicons-external', 'dashicons-facebook', 'dashicons-facebook-alt', 'dashicons-feedback', 'dashicons-flag', 'dashicons-format-aside', 'dashicons-format-audio', 'dashicons-format-chat', 'dashicons-format-gallery', 'dashicons-format-image', 'dashicons-format-links', 'dashicons-format-quote', 'dashicons-format-standard', 'dashicons-format-status', 'dashicons-format-video', 'dashicons-forms', 'dashicons-googleplus', 'dashicons-grid-view', 'dashicons-groups', 'dashicons-hammer', 'dashicons-heart', 'dashicons-id', 'dashicons-id-alt', 'dashicons-image-crop', 'dashicons-image-flip-horizontal', 'dashicons-image-flip-vertical', 'dashicons-image-rotate-left', 'dashicons-image-rotate-right', 'dashicons-images-alt', 'dashicons-images-alt2', 'dashicons-index-card', 'dashicons-info', 'dashicons-leftright', 'dashicons-lightbulb', 'dashicons-list-view', 'dashicons-location', 'dashicons-location-alt', 'dashicons-lock', 'dashicons-marker', 'dashicons-media-archive', 'dashicons-media-audio', 'dashicons-media-code', 'dashicons-media-default', 'dashicons-media-document', 'dashicons-media-interactive', 'dashicons-media-spreadsheet', 'dashicons-media-text', 'dashicons-media-video', 'dashicons-megaphone', 'dashicons-menu', 'dashicons-microphone', 'dashicons-migrate', 'dashicons-minus', 'dashicons-money', 'dashicons-nametag', 'dashicons-networking', 'dashicons-no', 'dashicons-no-alt', 'dashicons-palmtree', 'dashicons-performance', 'dashicons-phone', 'dashicons-playlist-audio', 'dashicons-playlist-video', 'dashicons-plus', 'dashicons-plus-alt', 'dashicons-portfolio', 'dashicons-post-status', 'dashicons-post-trash', 'dashicons-pressthis', 'dashicons-products', 'dashicons-randomize', 'dashicons-redo', 'dashicons-rss', 'dashicons-schedule', 'dashicons-screenoptions', 'dashicons-search', 'dashicons-share', 'dashicons-share-alt', 'dashicons-share-alt2', 'dashicons-share1', 'dashicons-shield', 'dashicons-shield-alt', 'dashicons-slides', 'dashicons-smartphone', 'dashicons-smiley', 'dashicons-sort', 'dashicons-sos', 'dashicons-star-empty', 'dashicons-star-filled', 'dashicons-star-half', 'dashicons-store', 'dashicons-tablet', 'dashicons-tag', 'dashicons-tagcloud', 'dashicons-testimonial', 'dashicons-text', 'dashicons-tickets', 'dashicons-tickets-alt', 'dashicons-translation', 'dashicons-trash', 'dashicons-twitter', 'dashicons-undo', 'dashicons-universal-access', 'dashicons-universal-access-alt', 'dashicons-update', 'dashicons-upload', 'dashicons-vault', 'dashicons-video-alt', 'dashicons-video-alt2', 'dashicons-video-alt3', 'dashicons-visibility', 'dashicons-welcome-add-page', 'dashicons-welcome-comments', 'dashicons-welcome-edit-page', 'dashicons-welcome-learn-more', 'dashicons-welcome-view-site', 'dashicons-welcome-widgets-menus', 'dashicons-welcome-write-blog', 'dashicons-wordpress', 'dashicons-wordpress-alt', 'dashicons-yes'];
                    }
                    for (var i = 0; i < icons.length; i++) {
                        content += '<li data-value="' + icons[i] + '" class="' + icons[i] + '"></li>';
                    }
                    $(this).html(content + '</ul>');
                    $(this).addClass('active');
                }
            } else {
                $(this).removeClass('active');
            }
        });

        $(panel).on('click', '.themekit-icons > ul > li', function (e) {
            let input = $(this).parent().parent();
            $(input).attr('data-value', $(this).data('value')).attr('class', 'themekit-icons ' + $(this).data('value'));
            $(input).removeClass('active');
            e.preventDefault();
            return false;
        });

    });

    /* 
    * ------------------------------
    * # FUNCTIONS
    * ------------------------------
    */

    function ajax_import_errors(errors, type, response) {
        if (response != 'success' && response != 'skipped') {
            errors.push(type);
        }
        return errors;
    }

    function ajax_import_progress(content, progress, option, index, text) {
        if ($(option).is(':checked')) {
            progress += '<li><span>' + index + '</span><label>' + text + '</label></li>';
            $(content).find(' > .progress').html(progress);
        }
        return progress;
    }

    function ajax_import_array(checkbox) {
        let type = ($(checkbox).is(':checked') ? $(checkbox).val() : 'skip');
        return { method: 'POST', url: ajaxurl, data: { action: 'themekit_options_import', type: type } };
    }

    function getURLParameter(name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ''])[1].replace(/\+/g, '%20') || '');
    }

    function isEmpty(obj) {
        if (typeof (obj) !== 'undefined' && obj !== null && obj != false && (obj.length > 0 || typeof (obj) == 'number' || typeof (obj.length) == 'undefined') && obj !== 'undefined') return false; else return true;
    }

    function wpMediaUpload(target, type) {
        wpMediaUploaderSettings = [target, type];
        wpMediaUploader.open();
    }

    function getSetting(element) {
        let id = $(element).attr('id');
        let type = $(element).data('type');
        switch (type) {
            case 'upload':
            case 'range':
            case 'number':
            case 'text':
                return [id, $(element).find('input').val(), type];
                break;
            case 'textarea':
                return [id, $(element).find('textarea').val(), type];
                break;
            case 'select':
                return [id, $(element).find('select').val(), type];
                break;
            case 'checkbox':
                return [id, $(element).find('input').is(':checked'), type];
                break;
            case 'radio':
                let value = $(element).find('input:checked').val();
                if (isEmpty(value)) value = '';
                return [id, value, type];
                break;
            case 'number-4':
                let inputs = $(element).find('input');
                return [id, [$(inputs).eq(0).val(), $(inputs).eq(1).val(), $(inputs).eq(2).val(), $(inputs).eq(3).val()], type];
                break;
            case 'upload-image':
                let url = $(element).find('.image').attr('data-url');
                if (isEmpty(url)) url = '';
                return [id, url, type];
                break;
            case 'code':
                return [id, inputsArray[id].codemirror.getValue(), type];
                break;
            case 'color':
                let color = $(element).find('.wp-color-result').css('background-color');
                if (color == 'rgb(241, 241, 241)' || isEmpty(color)) color = '';
                return [id, color, type];
                break;
            case 'font':
                let font = $(element).find('select').val();
                if (font != '') {
                    font = font.replace(/ /g, '+');
                    let variants = $(element).find('.font-variants').attr('data-value');
                    if (!isEmpty(variants)) {
                        font += ':' + variants;
                    }
                    if (arraySettings['private']['fonts'][0] == '') {
                        arraySettings['private']['fonts'] = [font, 'fonts'];
                    } else {
                        arraySettings['private']['fonts'][0] += '|' + font;
                    }
                }
                return [id, font, type];
                break;
            case 'multi-input':
                let multiInputs = {};
                $(element).find('.input > div').each(function () {
                    let setting = getSetting(this);
                    multiInputs[setting[0]] = [setting[1], setting[2]];
                });
                return [id, multiInputs, type];
                break;
            case 'wp-editor':
                return [id, tinymce.get('wp-editor-' + id).getContent(), type];
                break;
            case 'select-image':
                return [id, $(element).find('.thumbs > .active').data('id'), type];
                break;
            case 'repeater':
                return [id, themekitRepeater('get', $(element).find('.repeater-item'), ''), type];
                break;
        }
        return ['', '', ''];
    }

    function setSetting(id, setting) {
        let type = $(setting)[1];
        let value = $(setting)[0];
        let id_extra = $(setting)[2];
        let content = '';
        id = '#' + id;
        switch (type) {
            case 'upload':
            case 'number':
                $(id + ' input', panel).val(restoreJson(value));
                break;
            case 'text':
                $(id + ' input', panel).val(restoreJson(value));
                break;
            case 'textarea':
                $(id + ' textarea', panel).val(restoreJson(value));
                break;
            case 'select':
                $(id + ' select', panel).val(restoreJson(value));
                break;
            case 'checkbox':
                $(id + ' input', panel).prop('checked', (value == 'false' ? false : value));
                break;
            case 'radio':
                $(id + ' input[value="' + restoreJson(value) + '"]', panel).prop('checked', true);
                break;
            case 'number-4':
                let inputs = $(id + ' input', panel);
                $(inputs).eq(0).val(value[0]);
                $(inputs).eq(1).val(value[1]);
                $(inputs).eq(2).val(value[2]);
                $(inputs).eq(3).val(value[3]);
                break;
            case 'upload-image':
                if (value != '') {
                    $(id + ' .image', panel).attr('data-url', restoreJson(value)).css('background-image', 'url(' + restoreJson(value) + ')');
                }
                break;
            case 'code':
                let id_code = id.replace('#', '');
                if (inputsArray[id_code] != null) inputsArray[id_code].codemirror.setValue(restoreJson(value));
                break;
            case 'color':
                $(id + ' .wp-color-result', panel).css('background-color', restoreJson(value));
                break;
            case 'font':
                if (value != '') {
                    let font;
                    let arr;
                    if (value.indexOf(':') > 0) {
                        arr = value.split(':');
                        font = arr[0].replace(/\+/g, ' ');
                    } else {
                        font = value;
                    }
                    $(id + ' select', panel).val(restoreJson(font.replace(/\+/g, ' ')));
                    $(id + ' .font-variants', panel).html(getFontVariants($(id + ' select', panel).find('option:selected').attr('data-variants')));
                    if (value.indexOf(':') > 0) {
                        let variants = arr[1].split(',');
                        for (var i = 0; i < variants.length; i++) {
                            $(id + ' input[value="' + variants[i] + '"]', panel).prop('checked', true);
                        }
                        $(id + ' .font-variants', panel).attr('data-value', arr[1]);
                    }
                }
                break;
            case 'multi-input':
                for (var key in value) {
                    setSetting(key, value[key]);
                }
                break;
            case 'wp-editor':
                if (typeof tinymce !== 'undefined') {
                    if ($('#' + 'wp-editor-' + id.replace('#', '')).length) {
                        tinymce.get('wp-editor-' + id.replace('#', '')).setContent(value.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\'));
                    }
                }
                break;
            case 'range':
                let range_value = restoreJson(value);
                $(id + ' input', panel).val(range_value);
                $(id + ' .range-value', panel).html(range_value);
                break;
            case 'select-image':
                $(id + ' .thumbs > [data-id]').removeClass('active');
                $(id + ' .thumbs > [data-id="' + restoreJson(value) + '"]', panel).addClass('active');
                break;
            case 'repeater':
                content = themekitRepeater('set', value, $(id + ' .repeater-item:last-child'));
                if (content != '') {
                    $(id + ' .themekit-repeater').html(content);
                }
                break;
        }
    }

    function themekitRepeater(action, items, content, primary) {
        $(content).find('.themekit-close').remove();
        content = $(content).html();
        if (action == 'set') {
            let html = '';
            if (items.length > 0) {
                for (var i = 0; i < items.length; i++) {
                    let item = $.parseHTML('<div>' + content + '</div>');
                    for (var key in items[i]) {
                        setInputValue($(item).find('[data-id="' + key + '"]'), items[i][key]);
                    }
                    html += '<div class="repeater-item">' + $(item).html() + '<i class="themekit-close"></i></div>';
                }
            }
            return html;
        }
        if (action == 'get') {
            let itemsArray = [];
            $(items).each(function () {
                let item = {};
                $(this).find('[data-id]').each(function () {
                    item[$(this).attr('data-id')] = getInputValue(this);
                });
                if (typeof primary !== 'undefined') {
                    if (item[primary] != '') {
                        item['id'] = stringToSlug(item[primary]);
                        itemsArray.push(item);
                    }
                } else {
                    itemsArray.push(item);
                }
            });
            return itemsArray;
        }
    }

    function setInputValue(input, value) {
        value = $.trim(value);
        if ($(input).is("select")) {
            $(input).find('option[value="' + value + '"]').attr('selected', '');
        } else {
            if ($(input).is("checkbox") && value) {
                $(input).attr('checked', '');
            } else {
                if ($(input).is("textarea")) {
                    $(input).html(value);
                } else {
                    if ($(input).is("div") || $(input).is("i") || $(input).is("li")) {
                        $(input).attr('data-value', value);
                    } else {
                        $(input).attr('value', value);
                    }
                }
            }
        }
    }

    function getInputValue(input) {
        if ($(input).is("checkbox")) {
            return $(input).is(':checked');
        } else {
            if ($(input).is("div") || $(input).is("i") || $(input).is("li")) {
                return $(input).attr('data-value');
            } else {
                return $(input).val();
            }
        }
        return '';
    }

    function resetInputValue(input) {
        if ($(input).is("select")) {
            $(input).val('').find('[selected]').removeAttr('selected');
        } else {
            if ($(input).is("checkbox") && value) {
                $(input).removeAttr('checked').prop('checked', false);
            } else {
                if ($(input).is("textarea")) {
                    $(input).html('');
                } else {
                    if ($(input).is("div") || $(input).is("i") || $(input).is("li")) {
                        $(input).attr('data-value', '');
                        if ($(input).hasClass('themekit-icons')) {
                            $(input).attr('data-value', '').attr('class', 'themekit-icons');
                        }
                        if ($(input).hasClass('themekit-input-repeater')) {
                            $(input).attr('data-value', '').find(' > div:not(:first-child)').remove();
                            $(input).find('input').removeAttr('value').val('');
                        }
                    } else {
                        $(input).removeAttr('value').val('');
                    }
                }
            }
        }
    }

    function updateInputRepeaters() {
        $(panel).find(".themekit-input-repeater").each(function () {
            let values = '';
            let items = $(this).find(" > div");
            for (var i = 0; i < items.length; i++) {
                let value = $(items[i]).find('input').val();
                if (!isEmpty(value)) {
                    values += value + ',';
                }
            }
            if (values != '') {
                values = values.substr(0, values.length - 1);
            }
            $(this).attr('data-value', values);
        });
    }

    function restoreJson(value) {
        if (isEmpty(value)) return '';
        return value.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t").replace(/\\f/g, "\f").replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }

    function showNotice(text, type) {
        if (isEmpty(type)) type = 'success';
        $(panelHeader).find(' > p').html(text + '<i></i>').attr('class', 'active themekit-' + type);
        setTimeout(function () {
            $(panelHeader).find(' > p').removeClass('active');
        }, 7000);
    }

    function hideNotices() {
        $(panelHeader).find(' > p').removeClass('active');
    }

    function populatePanel() {
        jQuery.ajax({
            method: 'POST',
            url: ajaxurl,
            data: {
                action: 'themekit_options_get',
                single_post: (isSinglePost ? 'true' : 'false'),
                post_id: postID
            }
        }).done(function (response) {
            preInitPlugins();
            if (!isEmpty(response) && response != 'false') {
                response = JSON.parse(response);
                if (response != false) {
                    if (isSinglePost) {
                        arraySettings = response['global'];
                    } else {
                        arraySettings = response;
                    }
                    for (var key in arraySettings['settings']) {
                        setSetting(key, arraySettings['settings'][key]);
                    }
                    if (!isEmpty(response['post'])) {
                        for (var key in response['post']['settings']) {
                            setSetting(key, response['post']['settings'][key]);
                        }
                    }
                } else {
                    showNotice('Json parse error while getting the settings.', 'error');
                    console.log('Error themekit_options_get or new intallation.');
                }
            }
            initPlugins();
            $(panel).find('> main').removeClass('themekit-loading');
        });
    }

    function preInitPlugins() {
        $(panel).find('.themekit-code textarea').each(function () {
            inputsArray[$(this).parent().parent().attr('id')] = initWpCodeEditor(this, $(this).data('mode'));
        });
        $(panel).find('.themekit-color input').each(function () {
            inputsArray[$(this).parent().parent().attr('id')] = $(this).wpColorPicker();
        });
    }

    function initPlugins() {
        $(panel).find('.themekit-range input').each(function () {
            let range_value = $(this).parent().find('.range-value');
            $(this).rangeslider({
                polyfill: false,
                onSlide: function (position, value) {
                    $(range_value).html(value);
                }
            });
        });
        $(panel).find('.themekit-input-repeater').each(function () {
            let values = $(this).data('value');
            let content = '';
            if (isEmpty(values)) {
                values = [];
                content = '<div><input type="text"><i class="themekit-close"></i></div>'
            } else {
                values = values.split(',');
            }
            for (var i = 0; i < values.length; i++) {
                content += '<div><input type="text" value="' + values[i] + '"><i class="themekit-close"></i></div>'
            }
            $(this).html(content);
        });
        $(panel).find('.themekit-icons').each(function () {
            let icon = $(this).data('value');
            if (typeof icon !== 'undefined') {
                $(this).addClass(icon);
            }
        });
    }

    function getFontVariants(variants) {
        let html = '';
        if (!isEmpty(variants)) {
            variants = variants.split(',');
            for (var i = 0; i < variants.length; i++) {
                switch (variants[i]) {
                    case '100':
                        html += '<div><input type="checkbox" value="100"><label>Thin 100</label></div>';
                        break;
                    case '200':
                        html += '<div><input type="checkbox" value="200"><label>Light 200</label></div>';
                        break;
                    case '300':
                        html += '<div><input type="checkbox" value="300"><label>Light 300</label></div>';
                        break;
                    case 'regular':
                    case '400':
                        html += '<div><input type="checkbox" value="400"><label>Regular 400</label></div>';
                        break;
                    case '500':
                        html += '<div><input type="checkbox" value="500"><label>Medium 500</label></div>';
                        break;
                    case '600':
                        html += '<div><input type="checkbox" value="600"><label>Bold 600</label></div>';
                        break;
                    case '700':
                        html += '<div><input type="checkbox" value="700"><label>Bold 700</label></div>';
                        break;
                    case '800':
                        html += '<div><input type="checkbox" value="800"><label>Bold 800</label></div>';
                        break;
                    case '900':
                        html += '<div><input type="checkbox" value="900"><label>Black 900</label></div>';
                        break;
                }
            }
        }
        return html;
    }

    function initWpCodeEditor(target, mode) {
        var settings = wp.codeEditor.defaultSettings ? _.clone(wp.codeEditor.defaultSettings) : {};
        if (isEmpty(mode)) mode = 'css';
        settings.codemirror = _.extend({}, settings.codemirror, { mode: mode });
        return wp.codeEditor.initialize(target, settings);
    }

    function getURLParameter(name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20') || "");
    }

    function stringToSlug(string) {
        string = string.trim();
        string = string.toLowerCase();
        const from = "ואבדהגטיכךלםןמעףצפשתüûסח·/_,:;";
        const to = "aaaaaaeeeeiiiioooouuuunc------";
        for (let i = 0, l = from.length; i < l; i++) {
            string = string.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }
        return string.replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+/, '').replace(/-+$/, '').replace(/ /g, ' ');
    }

}(jQuery)); 
