/* settings */

function openSettings(cameraId) {
    if (cameraId != null) {
        $('#cameraSelect').val(cameraId).change();
    }

    $('div.settings').addClass('open').removeClass('closed');
    getPageContainer().addClass('stretched');
    $('div.settings-top-bar').addClass('open').removeClass('closed');

    updateConfigUI();
    doExitFullScreenCamera();
    updateLayout();
    setTimeout(updateLayout, 200);
}

function closeSettings() {
    hideApply();
    pushConfigs = {};
    pushConfigReboot = false;

    $('div.settings').removeClass('open').addClass('closed');
    getPageContainer().removeClass('stretched');
    $('div.settings-top-bar').removeClass('open').addClass('closed');

    updateLayout();
}

function isSettingsOpen() {
    return $('div.settings').hasClass('open');
}

function updateConfigUI() {
    var objs = $('tr.settings-item, div.settings-section-title, table.settings, ' +
            'div.check-box.camera-config, div.check-box.main-config');

    function markHideLogic() {
        this._hideLogic = true;
    }

    function markHideMinimized() {
        this._hideMinimized = true;
    }

    function unmarkHide() {
        this._hideLogic = false;
        this._hideMinimized = false;
    }

    objs.each(unmarkHide);

    /* hide sliders that, for some reason, don't have a value */
    $('input.range').each(function () {
        if  (this.value == '') {
            $(this).parents('tr:eq(0)').each(markHideLogic);
        }
    });

    /* minimizable sections */
    $('span.minimize').each(function () {
        var $this = $(this);
        if (!$this.hasClass('open')) {
            $this.parent().next('table.settings').find('tr').each(markHideMinimized);
        }
    });

    if (!isAdmin()) {
        $('#generalSectionDiv').each(markHideLogic);
        $('#generalSectionDiv').next().each(markHideLogic);

        $('div.settings-section-title.additional-section').each(markHideLogic);
        $('div.settings-section-title.additional-section').next().each(markHideLogic);
    }

    var query = splitUrl().params;
    var minEntries = 2;
    if (query.camera_ids) {
        minEntries = 1;
    }
    if ($('#cameraSelect').find('option').length < minEntries) { /* no camera configured */
        $('#videoDeviceEnabledSwitch').parent().each(markHideLogic);
        $('#videoDeviceEnabledSwitch').parent().nextAll('div.settings-section-title, table.settings').each(markHideLogic);
    }

    if ($('#videoDeviceEnabledSwitch')[0].error) { /* config error */
        $('#videoDeviceEnabledSwitch').parent().nextAll('div.settings-section-title, table.settings').each(markHideLogic);
    }

    /* set resolution to custom if no existing value matches */
    if ($('#resolutionSelect')[0].selectedIndex == -1) {
        $('#resolutionSelect').val('custom');
    }

    /* video device switch */
    if (!$('#videoDeviceEnabledSwitch').get(0).checked) {
        $('#videoDeviceEnabledSwitch').parent().nextAll('div.settings-section-title, table.settings').each(markHideLogic);
    }

    /* text overlay switch */
    if (!$('#textOverlayEnabledSwitch').get(0).checked) {
        $('#textOverlayEnabledSwitch').parent().next('table.settings').find('tr.settings-item').each(markHideLogic);
    }

    /* still images switch */
    if (!$('#stillImagesEnabledSwitch').get(0).checked) {
        $('#stillImagesEnabledSwitch').parent().next('table.settings').find('tr.settings-item').each(markHideLogic);
    }

    /* movies switch */
    if (!$('#moviesEnabledSwitch').get(0).checked) {
        $('#moviesEnabledSwitch').parent().next('table.settings').find('tr.settings-item').each(markHideLogic);
    }

    /* motion detection switch */
    if (!$('#motionDetectionEnabledSwitch').get(0).checked) {
        $('#motionDetectionEnabledSwitch').parent().next('table.settings').find('tr.settings-item').each(markHideLogic);

        /* hide the entire working schedule section,
            * as its switch button prevents hiding it automatically */
        $('#workingScheduleEnabledSwitch').parent().each(markHideLogic);
    }

    /* working schedule */
    if (!$('#workingScheduleEnabledSwitch').get(0).checked) {
        $('#workingScheduleEnabledSwitch').parent().next('table.settings').find('tr.settings-item').each(markHideLogic);
    }

    /* html dependencies */
    $('tr[depends]').each(function () {
        var $tr = $(this);
        var depends = $tr.attr('depends').split(' ');
        var conditionOk = true;
        depends.every(function (depend) {
            var neg = depend.indexOf('!') >= 0;
            var parts = depend.split('=');
            var boolCheck = parts.length == 1;
            depend = parts[0].replace(new RegExp('[^a-zA-Z0-9_$]', 'g'), '');

            var control = $('#' + depend + 'Entry, #' + depend + 'Select, #' + depend + 'Slider');
            var val = false;
            if (control.length) {
                val = control.val();
            }
            else { /* maybe it's a checkbox */
                control = $('#' + depend + 'Switch');
                if (control.length) {
                    val = control.get(0).checked;
                }
            }

            if (boolCheck) {
                if (neg) {
                    val = !val;
                }

                if (!val) {
                    conditionOk = false;
                    return false;
                }
            }
            else { /* comparison */
                var reqVal = parts[parts.length - 1];
                var reqRegex = new RegExp('^' + reqVal + '$');
                var equal = reqRegex.test(val);
                if (equal == neg) {
                    conditionOk = false;
                    return false;
                }
            }

            return true;
        });

        if (!conditionOk) {
            $tr.each(markHideLogic);
        }
    });

    /* hide sections that have no visible configs and no switch */
    // $('div.settings-section-title').each(function () {
    //     var $this = $(this);
    //     var $table = $this.next();
    //     var controls = $table.find('input, select');

    //     var switchButton = $this.children('div.check-box');
    //     if (switchButton.length && !switchButton[0]._hideNull) {
    //         return; /* has visible switch */
    //     }

    //     for (var i = 0; i < controls.length; i++) {
    //         var control = $(controls[i]);
    //         var tr = control.parents('tr:eq(0)')[0];
    //         if (!tr._hideLogic && !tr._hideNull) {
    //             return; /* has visible controls */
    //         }
    //     }

    //     $table.find('div.settings-item-separator').each(function () {
    //         $(this).parent().parent().each(markHideLogic);
    //     });

    //     $this.each(markHideLogic);
    //     $table.each(markHideLogic);
    // });

    /* hide useless separators */
    $('div.settings-container table.settings').each(function () {
        var $table = $(this);

        /* filter visible rows */
        var visibleTrs = $table.find('tr').filter(function () {
            return !this._hideLogic && !this._hideNull;
        }).map(function () {
            var $tr = $(this);
            $tr.isSeparator = $tr.find('div.settings-item-separator').length > 0;

            return $tr;
        }).get();

        for (var i = 1; i < visibleTrs.length; i++) {
            var $prevTr = visibleTrs[i - 1];
            var $tr = visibleTrs[i];
            if ($prevTr.isSeparator && $tr.isSeparator) {
                $tr.each(markHideLogic);
            }
        }

        /* filter visible rows again */
        visibleTrs = $table.find('tr').filter(function () {
            return !this._hideLogic && !this._hideNull;
        }).map(function () {
            var $tr = $(this);
            $tr.isSeparator = $tr.find('div.settings-item-separator').length > 0;

            return $tr;
        }).get();

        if (visibleTrs.length) {
            /* test first row */
            if (visibleTrs[0].isSeparator) {
                visibleTrs[0].each(markHideLogic);
            }

            /* test last row */
            if (visibleTrs[visibleTrs.length - 1].isSeparator) {
                visibleTrs[visibleTrs.length - 1].each(markHideLogic);
            }
        }
    });

    var weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    weekDays.forEach(function (weekDay) {
        var check = $('#' + weekDay + 'EnabledSwitch');
        if (check.get(0).checked) {
            check.parent().find('.time').show();
        }
        else {
            check.parent().find('.time').hide();
        }
    });

    objs.each(function () {
        if (this._hideLogic || this._hideMinimized || this._hideNull /* from dict2ui */) {
            $(this).hide(200);
        }
        else {
            $(this).show(200);
        }
    });

    /* re-validate all the validators */
    $('div.settings').find('.validator').each(function () {
        this.validate();
    });

    /* update all checkboxes and sliders */
    $('div.settings').find('input[type=checkbox], input.range').each(function () {
        this.update();
    });

    /* select the first option for the selects with no current selection */
    $('div.settings').find('select').not('#cameraSelect').each(function () {
        if (this.selectedIndex === -1) {
            this.selectedIndex = 0;
        }
    });
}

function configUiValid() {
    /* re-validate all the validators */
    $('div.settings').find('.validator').each(function () {
        this.validate();
    });

    var valid = true;
    $('div.settings input, select').each(function () {
        if (this.invalid) {
            valid = false;
            return false;
        }
    });

    return valid;
}

function prefsUi2Dict() {
    var dict = {
        'layout_columns': parseInt($('#layoutColumnsSlider').val()),
        'fit_frames_vertically': $('#fitFramesVerticallySwitch')[0].checked,
        'layout_rows': parseInt($('#layoutRowsSlider').val()),
        'framerate_factor': $('#framerateDimmerSlider').val() / 100,
        'resolution_factor': $('#resolutionDimmerSlider').val() / 100
    };

    return dict;
}

function dict2PrefsUi(dict) {
    $('#layoutColumnsSlider').val(dict['layout_columns']);
    $('#fitFramesVerticallySwitch')[0].checked = dict['fit_frames_vertically'];
    $('#layoutRowsSlider').val(dict['layout_rows']);
    $('#framerateDimmerSlider').val(dict['framerate_factor'] * 100);
    $('#resolutionDimmerSlider').val(dict['resolution_factor'] * 100);

    updateConfigUI();
}

function applyPrefs(dict) {
    setLayoutColumns(dict['layout_columns']);
    fitFramesVertically = dict['fit_frames_vertically'];
    layoutRows = dict['layout_rows'];
    framerateFactor = dict['framerate_factor'];
    resolutionFactor = dict['resolution_factor'];

    if (fitFramesVertically) {
        getPageContainer().addClass('fit-frames-vertically');
    }
    else {
        getPageContainer().removeClass('fit-frames-vertically');
    }
}

function savePrefs() {
    var prefs = prefsUi2Dict();
    ajax('POST', basePath + 'prefs/', prefs);
}

function mainUi2Dict() {
    var dict = {
        'admin_username': $('#adminUsernameEntry').val(),
        'normal_username': $('#normalUsernameEntry').val()
    };

    if (adminPasswordChanged.change && adminPasswordChanged.keydown && $('#adminPasswordEntry').val() !== '*****') {
        dict['admin_password'] = $('#adminPasswordEntry').val();
    }
    if (normalPasswordChanged.change && normalPasswordChanged.keydown && $('#normalPasswordEntry').val() !== '*****') {
        dict['normal_password'] = $('#normalPasswordEntry').val();
    }

    /* additional sections */
    $('input[type=checkbox].additional-section.main-config').each(function () {
        dict['_' + this.id.substring(0, this.id.length - 6)] = this.checked;
    });

    /* additional configs */
    $('tr.additional-config').each(function () {
        var $this = $(this);
        var control = $this.find('input, select');

        if (!control.hasClass('main-config')) {
            return;
        }

        var id = control.attr('id');
        var name, value;
        if (id.endsWith('Entry')) {
            name = id.substring(0, id.length - 5);
            value = control.val();
            if (control.hasClass('number')) {
                value = Number(value);
            }
        }
        else if (id.endsWith('Select')) {
            name = id.substring(0, id.length - 6);
            value = control.val();
        }
        else if (id.endsWith('Slider')) {
            name = id.substring(0, id.length - 6);
            value = Number(control.val());
        }
        else if (id.endsWith('Switch')) {
            name = id.substring(0, id.length - 6);
            value = control[0].checked;
        }

        dict['_' + name] = value;
    });

    return dict;
}

function dict2MainUi(dict) {
    function markHideIfNull(field, elemId) {
        var elem = $('#' + elemId);
        var sectionDiv = elem.parents('div.settings-section-title:eq(0)');
        var hideNull = (field === true) || (typeof field == 'string' && dict[field] == null);

        if (sectionDiv.length) { /* element is a section */
            sectionDiv.find('div.check-box').each(function () {this._hideNull = hideNull;});
            if (hideNull) {
                sectionDiv.find('input[type=checkbox]').each(function () {this.checked = true;});
            }
        }
        else { /* element is a config option */
            elem.parents('tr:eq(0)').each(function () {this._hideNull = hideNull;});
        }
    }

    $('#adminUsernameEntry').val(dict['admin_username']); markHideIfNull('admin_username', 'adminUsernameEntry');
    $('#adminPasswordEntry').val(dict['admin_password']); markHideIfNull('admin_password', 'adminPasswordEntry');
    $('#normalUsernameEntry').val(dict['normal_username']); markHideIfNull('normal_username', 'normalUsernameEntry');
    $('#normalPasswordEntry').val(dict['normal_password']); markHideIfNull('normal_password', 'normalPasswordEntry');

    /* additional sections */
    $('input[type=checkbox].additional-section.main-config').each(function () {
        var name = this.id.substring(0, this.id.length - 6);
        this.checked = dict[name];
        markHideIfNull(name, this.id);
    });

    /* additional configs */
    $('tr.additional-config').each(function () {
        var $this = $(this);
        var control = $this.find('input, select, textarea, div.html');

        if (!control.hasClass('main-config')) {
            return;
        }

        var id = control.attr('id');
        var name;
        if (id.endsWith('Entry')) {
            name = id.substring(0, id.length - 5);
            control.val(dict['_' + name]);
        }
        else if (id.endsWith('Select')) {
            name = id.substring(0, id.length - 6);
            control.val(dict['_' + name]);
        }
        else if (id.endsWith('Slider')) {
            name = id.substring(0, id.length - 6);
            control.val(dict['_' + name]);
        }
        else if (id.endsWith('Switch')) {
            name = id.substring(0, id.length - 6);
            control[0].checked = dict['_' + name];
        }
        else if (id.endsWith('Html')) {
            name = id.substring(0, id.length - 4);
            control.html(dict['_' + name]);
        }

        markHideIfNull('_' + name, id);
    });

    updateConfigUI();
}

function cameraUi2Dict() {
    if ($('#videoDeviceEnabledSwitch')[0].error) { /* config error */
        return {
            'enabled': $('#videoDeviceEnabledSwitch')[0].checked
        };
    }

    var dict = {
        'enabled': $('#videoDeviceEnabledSwitch')[0].checked,
        'name': $('#deviceNameEntry').val(),
        'proto': $('#deviceTypeEntry')[0].proto,

        /* video device */
        'auto_brightness': $('#autoBrightnessSwitch')[0].checked,
        'rotation': $('#rotationSelect').val(),
        'framerate': $('#framerateSlider').val(),
        'extra_options': $('#extraOptionsEntry').val().split(new RegExp('(\n)|(\r\n)|(\n\r)')).map(function (o) {
            if (!o) {
                return null;
            }

            o = o.trim();
            if (!o.length) {
                return null;
            }

            var parts = o.replace(new RegExp('\\s+', 'g'), ' ').split(' ');
            if (parts.length < 2) {
                return [parts[0], ''];
            }
            else if (parts.length == 2) {
                return parts;
            }
            else {
                return [parts[0], parts.slice(1).join(' ')];
            }
        }).filter(function (e) {return e;}),

        /* file storage */
        'storage_device': $('#storageDeviceSelect').val(),
        'network_server': $('#networkServerEntry').val(),
        'network_share_name': $('#networkShareNameEntry').val(),
        'network_smb_ver': $('#networkSMBVerSelect').val(),
        'network_username': $('#networkUsernameEntry').val(),
        'network_password': $('#networkPasswordEntry').val(),
        'root_directory': $('#rootDirectoryEntry').val(),
        'upload_enabled': $('#uploadEnabledSwitch')[0].checked,
        'upload_picture': $('#uploadPictureSwitch')[0].checked,
        'upload_movie': $('#uploadMovieSwitch')[0].checked,
        'upload_service': $('#uploadServiceSelect').val(),
        'upload_server': $('#uploadServerEntry').val(),
        'upload_port': $('#uploadPortEntry').val(),
        'upload_method': $('#uploadMethodSelect').val(),
        'upload_location': $('#uploadLocationEntry').val(),
        'upload_subfolders': $('#uploadSubfoldersSwitch')[0].checked,
        'upload_username': $('#uploadUsernameEntry').val(),
        'upload_password': $('#uploadPasswordEntry').val(),
        'upload_authorization_key': $('#uploadAuthorizationKeyEntry').val(),
        'clean_cloud_enabled': $('#cleanCloudEnabledSwitch')[0].checked,
        'web_hook_storage_enabled': $('#webHookStorageEnabledSwitch')[0].checked,
        'web_hook_storage_url': $('#webHookStorageUrlEntry').val(),
        'web_hook_storage_http_method': $('#webHookStorageHttpMethodSelect').val(),
        'command_storage_enabled': $('#commandStorageEnabledSwitch')[0].checked,
        'command_storage_exec': $('#commandStorageEntry').val(),

        /* text overlay */
        'text_overlay': $('#textOverlayEnabledSwitch')[0].checked,
        'left_text': $('#leftTextTypeSelect').val(),
        'custom_left_text': $('#leftTextEntry').val(),
        'right_text': $('#rightTextTypeSelect').val(),
        'custom_right_text': $('#rightTextEntry').val(),
        'text_scale': $('#textScaleSlider').val(),

        /* video streaming */
        'video_streaming': $('#videoStreamingEnabledSwitch')[0].checked,
        'streaming_framerate': $('#streamingFramerateSlider').val(),
        'streaming_quality': $('#streamingQualitySlider').val(),
        'streaming_resolution': $('#streamingResolutionSlider').val(),
        'streaming_server_resize': $('#streamingServerResizeSwitch')[0].checked,
        'streaming_port': $('#streamingPortEntry').val(),
        'streaming_auth_mode': $('#streamingAuthModeSelect').val() || 'disabled', /* compatibility with old motion */
        'streaming_motion': $('#streamingMotion')[0].checked,

        /* still images */
        'still_images': $('#stillImagesEnabledSwitch')[0].checked,
        'image_file_name': $('#imageFileNameEntry').val(),
        'image_quality': $('#imageQualitySlider').val(),
        'capture_mode': $('#captureModeSelect').val(),
        'snapshot_interval': $('#snapshotIntervalEntry').val(),
        'preserve_pictures': $('#preservePicturesSelect').val() >= 0 ? $('#preservePicturesSelect').val() : $('#picturesLifetimeEntry').val(),
        'manual_snapshots': $('#manualSnapshotsSwitch')[0].checked,

        /* movies */
        'movies': $('#moviesEnabledSwitch')[0].checked,
        'movie_file_name': $('#movieFileNameEntry').val(),
        'movie_quality': $('#movieQualitySlider').val(),
        'movie_format': $('#movieFormatSelect').val(),
        'movie_passthrough': $('#moviePassthroughSwitch')[0].checked,
        'recording_mode': $('#recordingModeSelect').val(),
        'max_movie_length': $('#maxMovieLengthEntry').val(),
        'preserve_movies': $('#preserveMoviesSelect').val() >= 0 ? $('#preserveMoviesSelect').val() : $('#moviesLifetimeEntry').val(),

        /* motion detection */
        'motion_detection': $('#motionDetectionEnabledSwitch')[0].checked,
        'frame_change_threshold': $('#frameChangeThresholdSlider').val(),
        'max_frame_change_threshold': $('#maxFrameChangeThresholdEntry').val(),
        'auto_threshold_tuning': $('#autoThresholdTuningSwitch')[0].checked,
        'auto_noise_detect': $('#autoNoiseDetectSwitch')[0].checked,
        'noise_level': $('#noiseLevelSlider').val(),
        'light_switch_detect': $('#lightSwitchDetectSlider').val(),
        'despeckle_filter': $('#despeckleFilterSwitch')[0].checked,
        'event_gap': $('#eventGapEntry').val(),
        'pre_capture': $('#preCaptureEntry').val(),
        'post_capture': $('#postCaptureEntry').val(),
        'minimum_motion_frames': $('#minimumMotionFramesEntry').val(),
        'mask': $('#maskSwitch')[0].checked,
        'mask_type': $('#maskTypeSelect').val(),
        'smart_mask_sluggishness': $('#smartMaskSluggishnessSlider').val(),
        'mask_lines': $('#maskLinesEntry').val() ? $('#maskLinesEntry').val().split(',').map(function (l) {return parseInt(l);}) : [],
        'show_frame_changes': $('#showFrameChangesSwitch')[0].checked,
        'create_debug_media': $('#createDebugMediaSwitch')[0].checked,

        /* motion notifications */
        'email_notifications_enabled': $('#emailNotificationsEnabledSwitch')[0].checked,
        'email_notifications_from': $('#emailFromEntry').val(),
        'email_notifications_addresses': $('#emailAddressesEntry').val(),
        'email_notifications_smtp_server': $('#smtpServerEntry').val(),
        'email_notifications_smtp_port': $('#smtpPortEntry').val(),
        'email_notifications_smtp_account': $('#smtpAccountEntry').val(),
        'email_notifications_smtp_password': $('#smtpPasswordEntry').val(),
        'email_notifications_smtp_tls': $('#smtpTlsSwitch')[0].checked,
        'email_notifications_picture_time_span': $('#emailPictureTimeSpanEntry').val(),
        'web_hook_notifications_enabled': $('#webHookNotificationsEnabledSwitch')[0].checked,
        'web_hook_notifications_url': $('#webHookNotificationsUrlEntry').val(),
        'web_hook_notifications_http_method': $('#webHookNotificationsHttpMethodSelect').val(),
        'command_notifications_enabled': $('#commandNotificationsEnabledSwitch')[0].checked,
        'command_notifications_exec': $('#commandNotificationsEntry').val(),
        'command_end_notifications_enabled': $('#commandEndNotificationsEnabledSwitch')[0].checked,
        'command_end_notifications_exec': $('#commandEndNotificationsEntry').val(),

        /* working schedule */
        'working_schedule': $('#workingScheduleEnabledSwitch')[0].checked,
        'monday_from': $('#mondayEnabledSwitch')[0].checked ? $('#mondayFromEntry').val() : '',
        'monday_to':$('#mondayEnabledSwitch')[0].checked ? $('#mondayToEntry').val() : '',
        'tuesday_from': $('#tuesdayEnabledSwitch')[0].checked ? $('#tuesdayFromEntry').val() : '',
        'tuesday_to': $('#tuesdayEnabledSwitch')[0].checked ? $('#tuesdayToEntry').val() : '',
        'wednesday_from': $('#wednesdayEnabledSwitch')[0].checked ? $('#wednesdayFromEntry').val() : '',
        'wednesday_to': $('#wednesdayEnabledSwitch')[0].checked ? $('#wednesdayToEntry').val() : '',
        'thursday_from': $('#thursdayEnabledSwitch')[0].checked ? $('#thursdayFromEntry').val() : '',
        'thursday_to': $('#thursdayEnabledSwitch')[0].checked ? $('#thursdayToEntry').val() : '',
        'friday_from': $('#fridayEnabledSwitch')[0].checked ? $('#fridayFromEntry').val() : '',
        'friday_to': $('#fridayEnabledSwitch')[0].checked ? $('#fridayToEntry').val() :'',
        'saturday_from': $('#saturdayEnabledSwitch')[0].checked ? $('#saturdayFromEntry').val() : '',
        'saturday_to': $('#saturdayEnabledSwitch')[0].checked ? $('#saturdayToEntry').val() : '',
        'sunday_from': $('#sundayEnabledSwitch')[0].checked ? $('#sundayFromEntry').val() : '',
        'sunday_to': $('#sundayEnabledSwitch')[0].checked ? $('#sundayToEntry').val() : '',
        'working_schedule_type': $('#workingScheduleTypeSelect').val()
    };

    /* video controls */
    var videoControls = {};
    $('tr.video-control').each(function () {
        var $this = $(this);
        var $input = $this.find('input');
        var value;
        if ($input[0].type == 'checkbox') {
            value = $input[0].checked ? 1 : 0;
        }
        else {
            value = Number($input.val());
        }

        videoControls[$this.attr('name')] = {
            'value': value
        };
    });

    dict['video_controls'] = videoControls;

    /* if all working schedule days are disabled,
        * also disable the global working schedule */
    var hasWS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].some(function (day) {
        return $('#' + day + 'EnabledSwitch')[0].checked;
    });

    if (!hasWS) {
        dict['working_schedule'] = false;
    }

    if ($('#resolutionSelect').val() == 'custom') {
        dict.resolution = $('#customWidthEntry').val() + 'x' + $('#customHeightEntry').val();
    }
    else {
        dict.resolution = $('#resolutionSelect').val();
    }

    /* additional sections */
    $('input[type=checkbox].additional-section.camera-config').each(function () {
        dict['_' + this.id.substring(0, this.id.length - 6)] = this.checked;
    });

    /* additional configs */
    $('tr.additional-config').each(function () {
        var $this = $(this);
        var control = $this.find('input, select');

        if (!control.hasClass('camera-config')) {
            return;
        }

        var id = control.attr('id');
        var name, value;
        if (id.endsWith('Entry')) {
            name = id.substring(0, id.length - 5);
            value = control.val();
            if (control.hasClass('number')) {
                value = Number(value);
            }
        }
        else if (id.endsWith('Select')) {
            name = id.substring(0, id.length - 6);
            value = control.val();
        }
        else if (id.endsWith('Slider')) {
            name = id.substring(0, id.length - 6);
            value = Number(control.val());
        }
        else if (id.endsWith('Switch')) {
            name = id.substring(0, id.length - 6);
            value = control[0].checked;
        }

        dict['_' + name] = value;
    });

    return dict;
}

function dict2CameraUi(dict) {
    if (dict == null) {
        /* errors while getting the configuration */

        $('#videoDeviceEnabledSwitch')[0].error = true;
        $('#videoDeviceEnabledSwitch')[0].checked = true; /* so that the user can explicitly disable the camera */
        updateConfigUI();

        return;
    }
    else {
        $('#videoDeviceEnabledSwitch')[0].error = false;
    }

    function markHideIfNull(field, elemId) {
        var elem = $('#' + elemId);
        var sectionDiv = elem.parents('div.settings-section-title:eq(0)');
        var hideNull = (field === true) || (typeof field == 'string' && dict[field] == null);

        if (sectionDiv.length) { /* element is a section */
            sectionDiv.find('div.check-box').each(function () {this._hideNull = hideNull;});
            if (hideNull) {
                sectionDiv.find('input[type=checkbox]').each(function () {this.checked = true;});
            }
        }
        else { /* element is a config option */
            elem.parents('tr:eq(0)').each(function () {this._hideNull = hideNull;});
        }
    }

    /* video device */
    var prettyType = '';
    switch (dict['proto']) {
        case 'v4l2':
            prettyType = 'V4L2 Camera';
            break;

        case 'netcam':
            prettyType = 'Network Camera';
            break;

        case 'mmal':
            prettyType = 'MMAL Camera';
            break;

        case 'motioneye':
            prettyType = 'Remote motionEye Camera';
            break;

        case 'mjpeg':
            prettyType = 'Simple MJPEG Camera';
            break;
    }

    $('#videoDeviceEnabledSwitch')[0].checked = dict['enabled']; markHideIfNull('enabled', 'videoDeviceEnabledSwitch');
    $('#deviceNameEntry').val(dict['name']); markHideIfNull('name', 'deviceNameEntry');
    $('#deviceIdEntry').val(dict['id']); markHideIfNull('id', 'deviceIdEntry');
    $('#deviceUrlEntry').val(dict['device_url']); markHideIfNull('device_url', 'deviceUrlEntry');
    $('#deviceTypeEntry').val(prettyType); markHideIfNull(!prettyType, 'deviceTypeEntry');
    $('#deviceTypeEntry')[0].proto = dict['proto'];
    $('#autoBrightnessSwitch')[0].checked = dict['auto_brightness']; markHideIfNull('auto_brightness', 'autoBrightnessSwitch');

    $('#resolutionSelect').html('');
    if (dict['available_resolutions']) {
        dict['available_resolutions'].forEach(function (resolution) {
            $('#resolutionSelect').append('<option value="' + resolution + '">' + resolution + '</option>');
        });
        $('#resolutionSelect').append('<option value="custom">Custom</option>');
    }
    $('#resolutionSelect').val(dict['resolution']); markHideIfNull('available_resolutions', 'resolutionSelect');
    if (dict['resolution']) {
        $('#customWidthEntry').val(dict['resolution'].split('x')[0]);
        $('#customHeightEntry').val(dict['resolution'].split('x')[1]);
    }

    $('#rotationSelect').val(dict['rotation']); markHideIfNull('rotation', 'rotationSelect');
    $('#framerateSlider').val(dict['framerate']); markHideIfNull('framerate', 'framerateSlider');
    $('#extraOptionsEntry').val(dict['extra_options'] ? (dict['extra_options'].map(function (o) {
        return o.join(' ');
    }).join('\r\n')) : ''); markHideIfNull('extra_options', 'extraOptionsEntry');

    /* file storage */
    $('#storageDeviceSelect').empty();
    dict['available_disks'] = dict['available_disks'] || [];
    var storageDeviceOptions = {'network-share': true};
    dict['available_disks'].forEach(function (disk) {
        disk.partitions.forEach(function (partition) {
            var target = partition.target.replaceAll('/', '-');
            var option = 'local-disk' + target;
            var label = partition.vendor;
            if (partition.model) {
                label += ' ' + partition.model;
            }
            if (disk.partitions.length > 1) {
                label += '/part' + partition.part_no;
            }
            label += ' (' + partition.target + ')';

            storageDeviceOptions[option] = true;

            $('#storageDeviceSelect').append('<option value="' + option + '">' + label + '</option>');
        });
    });
    $('#storageDeviceSelect').append('<option value="custom-path">Custom Path</option>');
    if (dict['smb_shares']) {
        $('#storageDeviceSelect').append('<option value="network-share">Network Share</option>');
    }

    if (storageDeviceOptions[dict['storage_device']]) {
        $('#storageDeviceSelect').val(dict['storage_device']);
    }
    else {
        $('#storageDeviceSelect').val('custom-path');
    }
    markHideIfNull('storage_device', 'storageDeviceSelect');
    $('#networkServerEntry').val(dict['network_server']); markHideIfNull('network_server', 'networkServerEntry');
    $('#networkShareNameEntry').val(dict['network_share_name']); markHideIfNull('network_share_name', 'networkShareNameEntry');
    $('#networkSMBVerSelect').val(dict['network_smb_ver']); markHideIfNull('network_smb_ver', 'networkSMBVerSelect');
    $('#networkUsernameEntry').val(dict['network_username']); markHideIfNull('network_username', 'networkUsernameEntry');
    $('#networkPasswordEntry').val(dict['network_password']); markHideIfNull('network_password', 'networkPasswordEntry');
    $('#rootDirectoryEntry').val(dict['root_directory']); markHideIfNull('root_directory', 'rootDirectoryEntry');
    var percent = 0;
    if (dict['disk_total'] != 0) {
        percent = parseInt(dict['disk_used'] * 100 / dict['disk_total']);
    }

    $('#diskUsageProgressBar').each(function () {
        this.setProgress(percent);
        this.setText((dict['disk_used'] / 1073741824).toFixed(1)  + '/' + (dict['disk_total'] / 1073741824).toFixed(1) + ' GB (' + percent + '%)');
    }); markHideIfNull('disk_used', 'diskUsageProgressBar');

    $('#uploadEnabledSwitch')[0].checked = dict['upload_enabled']; markHideIfNull('upload_enabled', 'uploadEnabledSwitch');
    $('#uploadPictureSwitch')[0].checked = dict['upload_picture']; markHideIfNull('upload_picture', 'uploadPictureSwitch');
    $('#uploadMovieSwitch')[0].checked = dict['upload_movie']; markHideIfNull('upload_movie', 'uploadMovieSwitch');
    $('#uploadServiceSelect').val(dict['upload_service']); markHideIfNull('upload_service', 'uploadServiceSelect');
    $('#uploadServerEntry').val(dict['upload_server']); markHideIfNull('upload_server', 'uploadServerEntry');
    $('#uploadPortEntry').val(dict['upload_port']); markHideIfNull('upload_port', 'uploadPortEntry');
    $('#uploadMethodSelect').val(dict['upload_method']); markHideIfNull('upload_method', 'uploadMethodSelect');
    $('#uploadLocationEntry').val(dict['upload_location']); markHideIfNull('upload_location', 'uploadLocationEntry');
    $('#uploadSubfoldersSwitch')[0].checked = dict['upload_subfolders']; markHideIfNull('upload_subfolders', 'uploadSubfoldersSwitch');
    $('#uploadUsernameEntry').val(dict['upload_username']); markHideIfNull('upload_username', 'uploadUsernameEntry');
    $('#uploadPasswordEntry').val(dict['upload_password']); markHideIfNull('upload_password', 'uploadPasswordEntry');
    $('#uploadAuthorizationKeyEntry').val(dict['upload_authorization_key']); markHideIfNull('upload_authorization_key', 'uploadAuthorizationKeyEntry');
    $('#cleanCloudEnabledSwitch')[0].checked = dict['clean_cloud_enabled']; markHideIfNull('clean_cloud_enabled', 'cleanCloudEnabledSwitch');

    $('#webHookStorageEnabledSwitch')[0].checked = dict['web_hook_storage_enabled']; markHideIfNull('web_hook_storage_enabled', 'webHookStorageEnabledSwitch');
    $('#webHookStorageUrlEntry').val(dict['web_hook_storage_url']);
    $('#webHookStorageHttpMethodSelect').val(dict['web_hook_storage_http_method']);

    $('#commandStorageEnabledSwitch')[0].checked = dict['command_storage_enabled']; markHideIfNull('command_storage_enabled', 'commandStorageEnabledSwitch');
    $('#commandStorageEntry').val(dict['command_storage_exec']);

    /* text overlay */
    $('#textOverlayEnabledSwitch')[0].checked = dict['text_overlay']; markHideIfNull('text_overlay', 'textOverlayEnabledSwitch');
    $('#leftTextTypeSelect').val(dict['left_text']); markHideIfNull('left_text', 'leftTextTypeSelect');
    $('#leftTextEntry').val(dict['custom_left_text']); markHideIfNull('custom_left_text', 'leftTextEntry');
    $('#rightTextTypeSelect').val(dict['right_text']); markHideIfNull('right_text', 'rightTextTypeSelect');
    $('#rightTextEntry').val(dict['custom_right_text']); markHideIfNull('custom_right_text', 'rightTextEntry');
    $('#textScaleSlider').val(dict['text_scale']); markHideIfNull('text_scale', 'textScaleSlider');

    /* video streaming */
    $('#videoStreamingEnabledSwitch')[0].checked = dict['video_streaming']; markHideIfNull('video_streaming', 'videoStreamingEnabledSwitch');
    $('#streamingFramerateSlider').val(dict['streaming_framerate']); markHideIfNull('streaming_framerate', 'streamingFramerateSlider');
    $('#streamingQualitySlider').val(dict['streaming_quality']); markHideIfNull('streaming_quality', 'streamingQualitySlider');
    $('#streamingResolutionSlider').val(dict['streaming_resolution']); markHideIfNull('streaming_resolution', 'streamingResolutionSlider');
    $('#streamingServerResizeSwitch')[0].checked = dict['streaming_server_resize']; markHideIfNull('streaming_server_resize', 'streamingServerResizeSwitch');
    $('#streamingPortEntry').val(dict['streaming_port']); markHideIfNull('streaming_port', 'streamingPortEntry');
    $('#streamingAuthModeSelect').val(dict['streaming_auth_mode']); markHideIfNull('streaming_auth_mode', 'streamingAuthModeSelect');
    $('#streamingMotion')[0].checked = dict['streaming_motion']; markHideIfNull('streaming_motion', 'streamingMotion');

    var cameraUrl = location.protocol + '//' + location.host + basePath + 'picture/' + dict.id + '/';

    var snapshotUrl = null;
    var mjpgUrl = null;
    var embedUrl = null;

    if (dict['proto'] == 'mjpeg') {
        mjpgUrl = dict['url'];
        mjpgUrl = mjpgUrl.replace('127.0.0.1', window.location.host.split(':')[0]);
        embedUrl = cameraUrl + 'frame/';
    }
    else {
        snapshotUrl = cameraUrl + 'current/';
        mjpgUrl = location.protocol + '//' + location.host.split(':')[0] + ':' + dict.streaming_port;
        embedUrl = cameraUrl + 'frame/';
    }

    if (dict.proto == 'motioneye') {
        /* cannot tell the mjpg streaming url for a remote motionEye camera */
        mjpgUrl = '';
    }

    if ($('#normalPasswordEntry').val()) { /* anonymous access is disabled */
        if (snapshotUrl) {
            snapshotUrl = addAuthParams('GET', snapshotUrl);
        }
    }

    $('#streamingSnapshotUrlHtml').data('url', snapshotUrl); markHideIfNull(!snapshotUrl, 'streamingSnapshotUrlHtml');
    $('#streamingMjpgUrlHtml').data('url', mjpgUrl); markHideIfNull(!mjpgUrl, 'streamingMjpgUrlHtml');
    $('#streamingEmbedUrlHtml').data('url', embedUrl); markHideIfNull(!embedUrl, 'streamingEmbedUrlHtml');

    /* still images */
    $('#stillImagesEnabledSwitch')[0].checked = dict['still_images']; markHideIfNull('still_images', 'stillImagesEnabledSwitch');
    $('#imageFileNameEntry').val(dict['image_file_name']); markHideIfNull('image_file_name', 'imageFileNameEntry');
    $('#imageQualitySlider').val(dict['image_quality']); markHideIfNull('image_quality', 'imageQualitySlider');
    $('#captureModeSelect').val(dict['capture_mode']); markHideIfNull('capture_mode', 'captureModeSelect');
    $('#snapshotIntervalEntry').val(dict['snapshot_interval']); markHideIfNull('snapshot_interval', 'snapshotIntervalEntry');
    $('#preservePicturesSelect').val(dict['preserve_pictures']);
    if ($('#preservePicturesSelect').val() == null) {
        $('#preservePicturesSelect').val('-1');
    }
    markHideIfNull('preserve_pictures', 'preservePicturesSelect');
    $('#picturesLifetimeEntry').val(dict['preserve_pictures']); markHideIfNull('preserve_pictures', 'picturesLifetimeEntry');
    $('#manualSnapshotsSwitch')[0].checked = dict['manual_snapshots']; markHideIfNull('manual_snapshots', 'manualSnapshotsSwitch');

    /* movies */
    $('#moviesEnabledSwitch')[0].checked = dict['movies']; markHideIfNull('movies', 'moviesEnabledSwitch');
    $('#movieFileNameEntry').val(dict['movie_file_name']); markHideIfNull('movie_file_name', 'movieFileNameEntry');
    $('#movieQualitySlider').val(dict['movie_quality']); markHideIfNull('movie_quality', 'movieQualitySlider');
    $('#movieFormatSelect').val(dict['movie_format']); markHideIfNull('movie_format', 'movieFormatSelect');
    $('#recordingModeSelect').val(dict['recording_mode']); markHideIfNull('recording_mode', 'recordingModeSelect');
    $('#maxMovieLengthEntry').val(dict['max_movie_length']); markHideIfNull('max_movie_length', 'maxMovieLengthEntry');
    $('#moviePassthroughSwitch')[0].checked = dict['movie_passthrough']; markHideIfNull('movie_passthrough', 'moviePassthroughSwitch');
    $('#preserveMoviesSelect').val(dict['preserve_movies']);
    if ($('#preserveMoviesSelect').val() == null) {
        $('#preserveMoviesSelect').val('-1');
    }
    markHideIfNull('preserve_movies', 'preserveMoviesSelect');
    $('#moviesLifetimeEntry').val(dict['preserve_movies']); markHideIfNull('preserve_movies', 'moviesLifetimeEntry');

    /* motion detection */
    $('#motionDetectionEnabledSwitch')[0].checked = dict['motion_detection']; markHideIfNull('motion_detection', 'motionDetectionEnabledSwitch');
    $('#frameChangeThresholdSlider').val(dict['frame_change_threshold']); markHideIfNull('frame_change_threshold', 'frameChangeThresholdSlider');
    $('#maxFrameChangeThresholdEntry').val(dict['max_frame_change_threshold']); markHideIfNull('max_frame_change_threshold', 'maxFrameChangeThresholdEntry');
    $('#autoThresholdTuningSwitch')[0].checked = dict['auto_threshold_tuning']; markHideIfNull('auto_threshold_tuning', 'autoThresholdTuningSwitch');
    $('#autoNoiseDetectSwitch')[0].checked = dict['auto_noise_detect']; markHideIfNull('auto_noise_detect', 'autoNoiseDetectSwitch');
    $('#noiseLevelSlider').val(dict['noise_level']); markHideIfNull('noise_level', 'noiseLevelSlider');
    $('#lightSwitchDetectSlider').val(dict['light_switch_detect']); markHideIfNull('light_switch_detect', 'lightSwitchDetectSlider');
    $('#despeckleFilterSwitch')[0].checked = dict['despeckle_filter']; markHideIfNull('despeckle_filter', 'despeckleFilterSwitch');
    $('#eventGapEntry').val(dict['event_gap']); markHideIfNull('event_gap', 'eventGapEntry');
    $('#preCaptureEntry').val(dict['pre_capture']); markHideIfNull('pre_capture', 'preCaptureEntry');
    $('#postCaptureEntry').val(dict['post_capture']); markHideIfNull('post_capture', 'postCaptureEntry');
    $('#minimumMotionFramesEntry').val(dict['minimum_motion_frames']); markHideIfNull('minimum_motion_frames', 'minimumMotionFramesEntry');
    $('#maskSwitch')[0].checked = dict['mask']; markHideIfNull('mask', 'maskSwitch');
    $('#maskTypeSelect').val(dict['mask_type']); markHideIfNull('mask_type', 'maskTypeSelect');
    $('#smartMaskSluggishnessSlider').val(dict['smart_mask_sluggishness']); markHideIfNull('smart_mask_sluggishness', 'smartMaskSluggishnessSlider');
    $('#maskLinesEntry').val((dict['mask_lines'] || []).join(',')); markHideIfNull('mask_lines', 'maskLinesEntry');
    $('#showFrameChangesSwitch')[0].checked = dict['show_frame_changes']; markHideIfNull('show_frame_changes', 'showFrameChangesSwitch');
    $('#createDebugMediaSwitch')[0].checked = dict['create_debug_media']; markHideIfNull('create_debug_media', 'createDebugMediaSwitch');

    /* motion notifications */
    $('#emailNotificationsEnabledSwitch')[0].checked = dict['email_notifications_enabled']; markHideIfNull('email_notifications_enabled', 'emailNotificationsEnabledSwitch');
    $('#emailFromEntry').val(dict['email_notifications_from']);
    $('#emailAddressesEntry').val(dict['email_notifications_addresses']);
    $('#smtpServerEntry').val(dict['email_notifications_smtp_server']);
    $('#smtpPortEntry').val(dict['email_notifications_smtp_port']);
    $('#smtpAccountEntry').val(dict['email_notifications_smtp_account']);
    $('#smtpPasswordEntry').val(dict['email_notifications_smtp_password']);
    $('#smtpTlsSwitch')[0].checked = dict['email_notifications_smtp_tls'];
    $('#emailPictureTimeSpanEntry').val(dict['email_notifications_picture_time_span']);

    $('#webHookNotificationsEnabledSwitch')[0].checked = dict['web_hook_notifications_enabled']; markHideIfNull('web_hook_notifications_enabled', 'webHookNotificationsEnabledSwitch');
    $('#webHookNotificationsUrlEntry').val(dict['web_hook_notifications_url']);
    $('#webHookNotificationsHttpMethodSelect').val(dict['web_hook_notifications_http_method']);

    $('#commandNotificationsEnabledSwitch')[0].checked = dict['command_notifications_enabled']; markHideIfNull('command_notifications_enabled', 'commandNotificationsEnabledSwitch');
    $('#commandNotificationsEntry').val(dict['command_notifications_exec']);
    $('#commandEndNotificationsEnabledSwitch')[0].checked = dict['command_end_notifications_enabled']; markHideIfNull('command_end_notifications_enabled', 'commandEndNotificationsEnabledSwitch');
    $('#commandEndNotificationsEntry').val(dict['command_end_notifications_exec']);

    /* working schedule */
    $('#workingScheduleEnabledSwitch')[0].checked = dict['working_schedule']; markHideIfNull('working_schedule', 'workingScheduleEnabledSwitch');
    $('#mondayEnabledSwitch')[0].checked = Boolean(dict['monday_from'] && dict['monday_to']); markHideIfNull('monday_from', 'mondayEnabledSwitch');
    $('#mondayFromEntry').val(dict['monday_from']); markHideIfNull('monday_from', 'mondayFromEntry');
    $('#mondayToEntry').val(dict['monday_to']); markHideIfNull('monday_to', 'mondayToEntry');

    $('#tuesdayEnabledSwitch')[0].checked = Boolean(dict['tuesday_from'] && dict['tuesday_to']); markHideIfNull('tuesday_from', 'tuesdayEnabledSwitch');
    $('#tuesdayFromEntry').val(dict['tuesday_from']); markHideIfNull('tuesday_from', 'tuesdayFromEntry');
    $('#tuesdayToEntry').val(dict['tuesday_to']); markHideIfNull('tuesday_to', 'tuesdayToEntry');

    $('#wednesdayEnabledSwitch')[0].checked = Boolean(dict['wednesday_from'] && dict['wednesday_to']); markHideIfNull('wednesday_from', 'wednesdayEnabledSwitch');
    $('#wednesdayFromEntry').val(dict['wednesday_from']); markHideIfNull('wednesday_from', 'wednesdayFromEntry');
    $('#wednesdayToEntry').val(dict['wednesday_to']); markHideIfNull('wednesday_to', 'wednesdayToEntry');

    $('#thursdayEnabledSwitch')[0].checked = Boolean(dict['thursday_from'] && dict['thursday_to']); markHideIfNull('thursday_from', 'thursdayEnabledSwitch');
    $('#thursdayFromEntry').val(dict['thursday_from']); markHideIfNull('thursday_from', 'thursdayFromEntry');
    $('#thursdayToEntry').val(dict['thursday_to']); markHideIfNull('thursday_to', 'thursdayToEntry');

    $('#fridayEnabledSwitch')[0].checked = Boolean(dict['friday_from'] && dict['friday_to']); markHideIfNull('friday_from', 'fridayEnabledSwitch');
    $('#fridayFromEntry').val(dict['friday_from']); markHideIfNull('friday_from', 'fridayFromEntry');
    $('#fridayToEntry').val(dict['friday_to']); markHideIfNull('friday_to', 'fridayToEntry');

    $('#saturdayEnabledSwitch')[0].checked = Boolean(dict['saturday_from'] && dict['saturday_to']); markHideIfNull('saturday_from', 'saturdayEnabledSwitch');
    $('#saturdayFromEntry').val(dict['saturday_from']); markHideIfNull('saturday_from', 'saturdayFromEntry');
    $('#saturdayToEntry').val(dict['saturday_to']); markHideIfNull('saturday_to', 'saturdayToEntry');

    $('#sundayEnabledSwitch')[0].checked = Boolean(dict['sunday_from'] && dict['sunday_to']); markHideIfNull('sunday_from', 'sundayEnabledSwitch');
    $('#sundayFromEntry').val(dict['sunday_from']); markHideIfNull('sunday_from', 'sundayFromEntry');
    $('#sundayToEntry').val(dict['sunday_to']); markHideIfNull('sunday_to', 'sundayToEntry');
    $('#workingScheduleTypeSelect').val(dict['working_schedule_type']); markHideIfNull('working_schedule_type', 'workingScheduleTypeSelect');

    /* video controls */
    $('tr.video-control').remove();
    if (dict['video_controls']) {
        var videoControls = Object.keys(dict['video_controls']).map(function (n) {
            dict['video_controls'][n].name = n;
            return dict['video_controls'][n];
        });
        videoControls.sort(function (c1, c2) {
            if (c1.name < c2.name) {
                return 1;
            }
            else if (c1.name > c2.name) {
                return -1;
            }
            else {
                return 0;
            }
        });
        videoControls.forEach(function (c) {
            var controlInput = addVideoControl(c.name, c.min, c.max, c.step);
            controlInput.val(c.value);
            controlInput[0].checked = Boolean(c.value);
            controlInput.change(function () {
                pushCameraConfig(/* reboot = */ false);
            });
        });
    }

    /* additional sections */
    $('input[type=checkbox].additional-section.main-config').each(function () {
        var name = this.id.substring(0, this.id.length - 6);
        this.checked = dict[name];
        markHideIfNull(name, this.id);
    });

    /* additional configs */
    $('tr.additional-config').each(function () {
        var $this = $(this);
        var control = $this.find('input, select, textarea, div.html');

        if (!control.hasClass('camera-config')) {
            return;
        }

        var id = control.attr('id');
        var name;
        if (id.endsWith('Entry')) {
            name = id.substring(0, id.length - 5);
            control.val(dict['_' + name]);
        }
        else if (id.endsWith('Select')) {
            name = id.substring(0, id.length - 6);
            control.val(dict['_' + name]);
        }
        else if (id.endsWith('Slider')) {
            name = id.substring(0, id.length - 6);
            control.val(dict['_' + name]);
        }
        else if (id.endsWith('Switch')) {
            name = id.substring(0, id.length - 6);
            control[0].checked = dict['_' + name];
        }
        else if (id.endsWith('Html')) {
            name = id.substring(0, id.length - 4);
            control.html(dict['_' + name]);
        }

        markHideIfNull('_' + name, id);
    });

    updateConfigUI();
}