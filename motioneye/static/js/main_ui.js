/* UI */

function initUI() {
    /* checkboxes */
    makeCheckBox($('input[type=checkbox].styled'));

    /* sliders */
    $('input[type=text].range.styled').each(function () {
        var $this = $(this);
        var $tr = $this.parent().parent();
        var ticks = null;
        var ticksAttr = $tr.attr('ticks');
        if (ticksAttr) {
            ticks = ticksAttr.split('|').map(function (t) {
                var parts = t.split(',');
                if (parts.length < 2) {
                    parts.push(parts[0]);
                }
                return {value: Number(parts[0]), label: parts[1]};
            });
        }
        makeSlider($this, Number($tr.attr('min')), Number($tr.attr('max')),
                Number($tr.attr('snap')), ticks, Number($tr.attr('ticksnum')), Number($tr.attr('decimals')), $tr.attr('unit'));
    });

    /* progress bars */
    makeProgressBar($('div.progress-bar'));

    /* text validators */
    makeTextValidator($('tr[required=true] input[type=text]'), true);
    makeTextValidator($('tr[required=true] input[type=password]'), true);

    /* number validators */
    $('input[type=text].number').each(function () {
        var $this = $(this);
        var $tr = $this.parent().parent();
        makeNumberValidator($this, Number($tr.attr('min')), Number($tr.attr('max')),
                Boolean($tr.attr('floating')), Boolean($tr.attr('sign')), Boolean($tr.attr('required')));
    });

    /* time validators */
    makeTimeValidator($('input[type=text].time'));

    /* custom validators */
    makeCustomValidator($('#adminPasswordEntry, #normalPasswordEntry'), function (value) {
        if (!value.toLowerCase().match(new RegExp('^[\x21-\x7F]*$'))) {
            return "special characters are not allowed in password";
        }

        return true;
    }, '');
    makeCustomValidator($('#deviceNameEntry'), function (value) {
        if (!value) {
            return 'this field is required';
        }

        if (!value.match(deviceNameValidRegExp)) {
            return "special characters are not allowed in camera's name";
        }

        return true;
    }, '');
    makeCustomValidator($('#customWidthEntry, #customHeightEntry'), function (value) {
        if (!value) {
            return 'this field is required';
        }

        value = Number(value);
        if (value % 8) {
            return "value must be a multiple of 8";
        }

        return true;
    }, '');
    makeCustomValidator($('#rootDirectoryEntry'), function (value) {
        if (!value.match(dirnameValidRegExp)) {
            return "special characters are not allowed in root directory name";
        }
        if ($('#storageDeviceSelect').val() == 'custom-path' && String(value).trim() == '/') {
            return 'files cannot be created directly on the root of your system';
        }

        return true;
    }, '');
    makeCustomValidator($('#emailFromEntry'), function (value) {
        if (value && !value.match(emailValidRegExp)) {
            return 'enter a vaild email address';
        }

        return true;
    }, '');
    makeCustomValidator($('#emailAddressesEntry'), function (value) {
        if (!value.match(emailValidRegExp)) {
            return 'enter a list of comma-separated valid email addresses';
        }

        return true;
    }, '');
    makeCustomValidator($('#imageFileNameEntry, #movieFileNameEntry'), function (value) {
        if (!value.match(filenameValidRegExp)) {
            return "special characters are not allowed in file name";
        }

        return true;
    }, '');
    $('tr[validate] input[type=text]').each(function () {
        var $this = $(this);
        var $tr = $this.parent().parent();
        var required = $tr.attr('required');
        var validate = $tr.attr('validate');
        if (!validate) {
            return;
        }

        makeCustomValidator($this, function (value) {
            if (!value && required) {
                return 'this field is required';
            }

            if (!value.toLowerCase().match(new RegExp(validate))) {
                return 'enter a valid value';
            }

            return true;
        }, '');
    });

    /* input value processors */
    makeStrippedInput($('tr[strip=true] input[type=text]'));
    makeStrippedInput($('tr[strip=true] input[type=password]'));

    function checkMinimizeSection() {
        var $switch = $(this);
        var $sectionDiv = $switch.parents('div.settings-section-title:eq(0)');

        var $minimizeSpan = $switch.parent().find('span.minimize');
        if ($switch.is(':checked') && !$minimizeSpan.hasClass('open')) {
            $minimizeSpan.addClass('open');
        }
        else if (!$switch.is(':checked') && $minimizeSpan.hasClass('open') && !$sectionDiv.attr('minimize-switch-independent')) {
            $minimizeSpan.removeClass('open');
        }
    }

    /* update password changed flags */
    $('#adminPasswordEntry').keydown(function () {
        adminPasswordChanged.keydown = true;
    });
    $('#adminPasswordEntry').change(function () {
        adminPasswordChanged.change = true;
    });
    $('#normalPasswordEntry').keydown(function () {
        normalPasswordChanged.keydown = true;
    });
    $('#normalPasswordEntry').change(function () {
        normalPasswordChanged.change = true;
    });

    /* ui elements that enable/disable other ui elements */
    $('#storageDeviceSelect').change(updateConfigUI);
    $('#resolutionSelect').change(updateConfigUI);
    $('#leftTextTypeSelect').change(updateConfigUI);
    $('#rightTextTypeSelect').change(updateConfigUI);
    $('#captureModeSelect').change(updateConfigUI);
    $('#autoNoiseDetectSwitch').change(updateConfigUI);
    $('#autoThresholdTuningSwitch').change(updateConfigUI);
    $('#videoDeviceEnabledSwitch').change(checkMinimizeSection).change(updateConfigUI);
    $('#textOverlayEnabledSwitch').change(checkMinimizeSection).change(updateConfigUI);
    $('#videoStreamingEnabledSwitch').change(checkMinimizeSection).change(updateConfigUI);
    $('#streamingServerResizeSwitch').change(updateConfigUI);
    $('#stillImagesEnabledSwitch').change(checkMinimizeSection).change(updateConfigUI);
    $('#preservePicturesSelect').change(updateConfigUI);
    $('#moviesEnabledSwitch').change(checkMinimizeSection).change(updateConfigUI);
    $('#motionDetectionEnabledSwitch').change(checkMinimizeSection).change(updateConfigUI);
    $('#preserveMoviesSelect').change(updateConfigUI);
    $('#moviePassthroughSwitch').change(updateConfigUI);
    $('#workingScheduleEnabledSwitch').change(checkMinimizeSection).change(updateConfigUI);

    $('#mondayEnabledSwitch').change(updateConfigUI);
    $('#tuesdayEnabledSwitch').change(updateConfigUI);
    $('#wednesdayEnabledSwitch').change(updateConfigUI);
    $('#thursdayEnabledSwitch').change(updateConfigUI);
    $('#fridayEnabledSwitch').change(updateConfigUI);
    $('#saturdayEnabledSwitch').change(updateConfigUI);
    $('#sundayEnabledSwitch').change(updateConfigUI);

    /* minimizable sections */
    $('span.minimize').click(function () {
        $(this).toggleClass('open');

        /* enable the section switch when unminimizing */
        if ($(this).hasClass('open')) {
            var sectionSwitch = $(this).parent().find('input[type=checkbox]');
            var sectionSwitchDiv = $(this).parent().find('div.check-box');
            var sectionDiv = $(this).parents('div.settings-section-title:eq(0)');
            if (sectionSwitch.length && !sectionSwitch.is(':checked') &&
                !sectionSwitchDiv[0]._hideNull && !sectionDiv.attr('minimize-switch-independent')) {

                sectionSwitch[0].checked = true;
                sectionSwitch.change();
            }
        }

        updateConfigUI();
    });

    $('a.settings-section-title').click(function () {
        $(this).parent().find('span.minimize').click();
    });

    /* additional configs */
    var seenDependNames = {};
    $('tr[depends]').each(function () {
        var $tr = $(this);
        var depends = $tr.attr('depends').split(' ');
        depends.forEach(function (depend) {
            depend = depend.split('=')[0];
            depend = depend.replace(new RegExp('[^a-zA-Z0-9_]', 'g'), '');

            if (depend in seenDependNames) {
                return;
            }

            seenDependNames[depend] = true;

            var control = $('#' + depend + 'Entry, #' + depend + 'Select, #' + depend + 'Slider, #' + depend + 'Switch');
            control.change(updateConfigUI);
        });
    });

    /* prefs change handlers */
    $('#layoutColumnsSlider').change(function () {
        var columns = parseInt(this.value);
        setLayoutColumns(columns);
        savePrefs();
    });
    $('#fitFramesVerticallySwitch').change(function () {
        fitFramesVertically = this.checked;
        updateLayout();
        savePrefs();
    });
    $('#layoutRowsSlider').change(function () {
        layoutRows = parseInt(this.value);
        updateLayout();
        savePrefs();
    });
    $('#framerateDimmerSlider').change(function () {
        framerateFactor = parseInt(this.value) / 100;
        savePrefs();
    });
    $('#resolutionDimmerSlider').change(function () {
        resolutionFactor = parseInt(this.value) / 100;
        savePrefs();
    });

    /* various change handlers */
    $('#storageDeviceSelect').change(function () {
        $('#rootDirectoryEntry').val('/');
    });

    $('#rootDirectoryEntry').change(function () {
        this.value = this.value.trim();
    });

    $('#rootDirectoryEntry').change(function () {
        if (this.value.charAt(0) !== '/') {
            this.value = '/' + this.value;
        }
    });
    $('#cleanCloudEnabledSwitch').change(function () {
        var enabled = this.checked;
        var folder = $('#uploadLocationEntry').val();
        console.log('cleanCloudEnabled', enabled, folder);
        if (enabled) {
            runAlertDialog(('This will recursively remove all files present in the cloud folder "' + folder +
                    '", not just those uploaded by motionEye!'));
        }
    });

    /* streaming framerate must be >= device framerate + a margin */
    $('#framerateSlider').change(function () {
        var value = Number($('#framerateSlider').val());
        var streamingValue = Number($('#streamingFramerateSlider').val());

        value += 5; /* a margin of 5 extra fps */
        value = Math.min(value, 30); /* don't go above 30 fps */

        if (streamingValue < value) {
            $('#streamingFramerateSlider').val(value).change();
        }
    });

    /* capture mode and recording mode are not completely independent:
     * all-frames capture mode implies continuous recording (and vice-versa) */
    $('#captureModeSelect').change(function (val) {
        if ($('#captureModeSelect').val() == 'all-frames') {
            $('#recordingModeSelect').val('continuous');
        }
        else {
            if ($('#recordingModeSelect').val() == 'continuous') {
                $('#recordingModeSelect').val('motion-triggered');
            }
        }

        updateConfigUI();
    });
    $('#recordingModeSelect').change(function (val) {
        if ($('#recordingModeSelect').val() == 'continuous') {
            $('#captureModeSelect').val('all-frames');
        }
        else {
            if ($('#captureModeSelect').val() == 'all-frames') {
                $('#captureModeSelect').val('motion-triggered');
            }
        }

        updateConfigUI();
    });

    /* fetch & push handlers */
    $('#cameraSelect').focus(function () {
        /* remember the previously selected index */
        this._prevSelectedIndex = this.selectedIndex;

    }).change(function () {
        if ($('#cameraSelect').val() === 'add') {
            runAddCameraDialog();
            this.selectedIndex = this._prevSelectedIndex;
        }
        else {
            this._prevSelectedIndex = this.selectedIndex;
            beginProgress([$(this).val()]);
            fetchCurrentCameraConfig(endProgress);
            disableMaskEdit();
        }
    });
    $('input.main-config, select.main-config, textarea.main-config').change(function () {
        pushMainConfig($(this).parents('tr:eq(0)').attr('reboot') == 'true');
    });
    $('input.camera-config, select.camera-config, textarea.camera-config').change(function () {
        pushCameraConfig($(this).parents('tr:eq(0)').attr('reboot') == 'true');
    });

    /* whenever the window is resized,
     * if a modal dialog is visible, it should be repositioned */
    $(window).resize(updateModalDialogPosition);

    /* show a warning when enabling media files removal */
    var preserveSelects = $('#preservePicturesSelect, #preserveMoviesSelect');
    var rootDirectoryEntry = $('#rootDirectoryEntry');
    preserveSelects.focus(function () {
        this._prevValue = $(this).val();
    }).change(function () {
        var value = $(this).val();
        if (value != '0' && this._prevValue == '0') {
            var rootDir = rootDirectoryEntry.val();
            runAlertDialog(('This will recursively remove all old media files present in the directory "' + rootDir +
                    '", not just those created by motionEye!'));
        }
    });

    /* disable mask editor when mask gets disabled */
    $('#maskSwitch').change(function () {
       if (!this.checked) {
           disableMaskEdit();
       }
    });

    /* disable mask editor when mask gets disabled */
    $('#maskSwitch').change(function () {
       if (!this.checked) {
           disableMaskEdit();
       }
    });

    /* disable mask editor when mask type is no longer editable */
    $('#maskTypeSelect').change(function () {
        if ($(this).val() != 'editable') {
            disableMaskEdit();
        }
    });

    /* apply button */
    $('#applyButton').click(function () {
        if ($(this).hasClass('progress')) {
            return; /* in progress */
        }

        doApply();
    });

    /* shut down button */
    $('#shutDownButton').click(function () {
        doShutDown();
    });

    /* reboot button */
    $('#rebootButton').click(function () {
        doReboot();
    });

    /* remove camera button */
    $('div.button.rem-camera-button').click(doRemCamera);

    /* logout button */
    $('div.button.logout-button').click(doLogout);

    /* software update button */
    $('div#updateButton').click(doUpdate);

    /* backup/restore */
    $('div#backupButton').click(doBackup);
    $('div#restoreButton').click(doRestore);

    /* test buttons */
    $('div#uploadTestButton').click(doTestUpload);
    $('div#emailTestButton').click(doTestEmail);
    $('div#networkShareTestButton').click(doTestNetworkShare);

    /* mask editor buttons */
    $('div#editMaskButton').click(function () {
        var cameraId = $('#cameraSelect').val();
        var img = getCameraFrame(cameraId).find('img.camera')[0];
        if (!img._naturalWidth || !img._naturalHeight) {
            return runAlertDialog('Cannot edit the mask without a valid camera image!');
        }

        enableMaskEdit(cameraId, img._naturalWidth, img._naturalHeight);
    });
    $('div#saveMaskButton').click(function () {
        disableMaskEdit();
    });
    $('div#clearMaskButton').click(function () {
        var cameraId = $('#cameraSelect').val();
        if (!cameraId) {
            return;
        }

        clearMask(cameraId);
    });
}

function addVideoControl(name, min, max, step) {
    var prevTr = $('#autoBrightnessSwitch').parent().parent();
    var controlTr = $('\
        <tr class="settings-item video-control"> \
            <td class="settings-item-label"><span class="settings-item-label"></span></td> \
            <td class="settings-item-value"><input type="text" class="range styled device camera-config"></td> \
        </tr>');

    prevTr.after(controlTr);
    var controlLabel = controlTr.find('span.settings-item-label');
    var controlInput = controlTr.find('input');

    controlInput.attr('id', name + 'VideoControlSlider');
    controlTr.attr('name', name);

    /* make name pretty */
    var title = name.replace(new RegExp('[^a-z0-9]', 'ig'), ' ');
    title = title.replace (/\s(\w)/g, function (_, c) {
        return c ? ' ' + c.toUpperCase () : ' ';
    });

    title = title.substr(0, 1).toUpperCase() + title.substr(1);

    controlLabel.text(title);

    if (min == 0 && max == 1) {
        controlInput.attr('type', 'checkbox');
        makeCheckBox(controlInput);
    }
    else {
        var ticksNumber = 3;
        if (max - min <= 6) {
            ticksNumber = max - min + 1;
        }
        makeSlider(controlInput, min, max, /* snapMode = */ 0, /* ticks = */ null, ticksNumber, null, null);
    }

    return controlInput;
}

function getPageContainer() {
    if (!pageContainer) {
        pageContainer = $('div.page-container');
    }

    return pageContainer;
}

function getCameraFrames() {
    var now = new Date().getTime();
    if (now - cameraFramesTime > CAMERA_FRAMES_CACHE_LIFETIME || !cameraFramesCached) {
        cameraFramesCached = getPageContainer().children('div.camera-frame');
        cameraFramesTime = now;
    }

    return cameraFramesCached;
}

function getCameraFrame(cameraId) {
    var frame = getPageContainer().children('div.camera-frame#camera' + cameraId);
    if (!frame.length) {
        /* look for camera frames detached from page container */
        frame = $('div.camera-frame#camera' + cameraId);
    }

    return frame;
}

function getCameraProgresses() {
    return getCameraFrames().find('div.camera-progress');
}

function getCameraProgress(cameraId) {
    return getCameraFrame(cameraId).find('div.camera-progress');
}

function setLayoutColumns(columns) {
    var cssClasses = {
        1: 'one-column',
        2: 'two-columns',
        3: 'three-columns',
        4: 'four-columns'
    };

    getPageContainer().removeClass(Object.values(cssClasses).join(' '));
    getPageContainer().addClass(cssClasses[columns]);

    layoutColumns = columns;
    updateLayout();
}

function updateLayout() {
    if (fitFramesVertically) {
        /* make sure the height of each camera
         * is smaller than the height of the screen
         * divided by the number of layout rows */

        /* find the max height/width ratio */
        var frames = getCameraFrames();
        var maxRatio = 0;

        frames.each(function () {
            var img = $(this).find('img.camera');
            var ratio = img.height() / img.width();
            if (ratio > maxRatio) {
                maxRatio = ratio;
            }
        });

        if (!maxRatio) {
            return; /* no camera frames */
        }

        var pageContainer = getPageContainer();
        var windowWidth = $(window).width();

        var columns = layoutColumns;
        if (isFullScreen() || windowWidth <= 1200) {
            columns = 1; /* always 1 column when in full screen or mobile */
        }

        var heightOffset = 5; /* some padding */
        if (!isFullScreen()) {
            heightOffset += 50; /* top bar */
        }

        var windowHeight = $(window).height() - heightOffset;
        var maxWidth = windowWidth;

        var width = windowHeight / maxRatio * columns;
        if (pageContainer.hasClass('stretched') && windowWidth > 1200) {
            maxWidth *= 0.6; /* opened settings panel occupies 40% of the window width */
        }

        if (width < 100) {
            width = 100; /* absolute minimum width for a frame */
        }

        if (width > maxWidth) {
            getPageContainer().css('width', '');
            return; /* page container width already at its maximum */
        }

        getPageContainer().css('width', width);
    }
    else {
        getPageContainer().css('width', '');
    }
}

function showCameraOverlay() {
    getCameraFrames().find('div.camera-overlay').css('display', '');
    setTimeout(function () {
        getCameraFrames().find('div.camera-overlay').addClass('visible');
    }, 10);

    overlayVisible = true;
}

function hideCameraOverlay() {
    getCameraFrames().find('div.camera-overlay').removeClass('visible');
    setTimeout(function () {
        getCameraFrames().find('div.camera-overlay').css('display', 'none');
    }, 300);

    overlayVisible = false;

    disableMaskEdit();
}

function enableMaskEdit(cameraId, width, height) {
    var cameraFrame = getCameraFrame(cameraId);
    var overlayDiv = cameraFrame.find('div.camera-overlay');
    var maskDiv = cameraFrame.find('div.camera-overlay-mask');

    if (overlayDiv.hasClass('mask-edit')) {
        return; /* already enabled */
    }

    overlayDiv.addClass('mask-edit');

    var nx = maskWidth; /* number of rectangles */
    var rx, rw;
    if (width % nx) {
        nx--;
        rx = width % nx; /* remainder */
    }
    else {
        rx = 0;
    }

    rw = parseInt(width / nx); /* rectangle width */

    var maskHeight;
    var ny = maskHeight = parseInt(height * maskWidth / width); /* number of rectangles */
    var ry, rh;
    if (height % ny) {
        ny--;
        ry = height % ny; /* remainder */
    }
    else {
        ry = 0;
    }

    rh = parseInt(height / ny); /* rectangle height */

    var mouseDown = false;
    var currentState = false;
    var elementsMatrix = Array.apply(null, Array(maskHeight)).map(function(){return []});

    function matrixToMaskLines() {
        var maskLines = [];
        var bits, line;

        maskLines.push(width);
        maskLines.push(height);

        for (y = 0; y < ny; y++) {
            bits = [];
            for (x = 0; x < nx; x++) {
                bits.push(elementsMatrix[y][x].hasClass('on'));
            }

            if (rx) {
                bits.push(elementsMatrix[y][nx].hasClass('on'));
            }

            line = 0;
            bits.forEach(function (bit, i) {
                if (bit) {
                    line |= 1 << (maskWidth - 1 - i);
                }
            });

            maskLines.push(line);
        }

        if (ry) {
            bits = [];
            for (x = 0; x < nx; x++) {
                bits.push(elementsMatrix[ny][x].hasClass('on'));
            }

            if (rx) {
                bits.push(elementsMatrix[ny][nx].hasClass('on'));
            }

            line = 0;
            bits.forEach(function (bit, i) {
                if (bit) {
                    line |= 1 << (maskWidth - 1 - i);
                }
            });

            maskLines.push(line);
        }

        $('#maskLinesEntry').val(maskLines.join(',')).change();
    }

    function handleMouseUp() {
        mouseDown = false;
        $('html').unbind('mouseup', handleMouseUp);
        matrixToMaskLines();
    }

    function makeMaskElement(x, y, px, py, pw, ph) {
        px = px * 100 / width;
        py = py * 100 / height;
        pw = pw * 100 / width;
        ph = ph * 100 / height;

        var el = $('<div class="mask-element"></div>');
        el.css('left', px + '%');
        el.css('top', py + '%');
        el.css('width', pw + '%');
        el.css('height', ph + '%');
        if (x == maskWidth - 1) {
            el.addClass('last-row');
        }
        if (y == maskHeight - 1) {
            el.addClass('last-line');
        }
        maskDiv.append(el);

        elementsMatrix[y][x] = el;

        el.mousedown(function () {
            mouseDown = true;
            el.toggleClass('on');
            currentState = el.hasClass('on');
            $('html').mouseup(handleMouseUp);
        });

        el.mouseenter(function () {
            if (!mouseDown) {
                return;
            }

            el.toggleClass('on', currentState);
        });
    }

    maskDiv[0]._matrixToMaskLines = matrixToMaskLines;

    /* make sure the mask is empty */
    maskDiv.html('');

    /* prevent editor closing by accidental click on mask container */
    maskDiv.click(function () {
        return false;
    });

    var x, y;
    for (y = 0; y < ny; y++) {
        for (x = 0; x < nx; x++) {
            makeMaskElement(x, y, x * rw, y * rh, rw, rh);
        }

        if (rx) {
            makeMaskElement(nx, y, nx * rw, y * rh, rx, rh);
        }
    }

    if (ry) {
        for (x = 0; x < nx; x++) {
            makeMaskElement(x, ny, x * rw, ny * rh, rw, ry);
        }

        if (rx) {
            makeMaskElement(nx, ny, nx * rw, ny * rh, rx, ry);
        }
    }

    /* use mask lines to initialize the element matrix */
    var line;
    var maskLines = $('#maskLinesEntry').val() ? $('#maskLinesEntry').val().split(',').map(function (v) {return parseInt(v);}) : [];
    maskLines = maskLines.slice(2);

    for (y = 0; y < ny; y++) {
        line = maskLines[y];
        for (x = 0; x < nx; x++) {
            if (line & (1 << (maskWidth - 1 - x))) {
                elementsMatrix[y][x].addClass('on');
            }
        }
        if (rx && (line & 1)) {
            elementsMatrix[y][nx].addClass('on');
        }
    }

    if (ry) {
        line = maskLines[ny];
        for (x = 0; x < nx; x++) {
            if (line & (1 << (maskWidth - 1 - x))) {
                elementsMatrix[ny][x].addClass('on');
            }
        }

        if (rx && (line & 1)) {
            elementsMatrix[ny][nx].addClass('on');
        }
    }

    var selectedCameraId = $('#cameraSelect').val();
    if (selectedCameraId && (!cameraId || cameraId == selectedCameraId)) {
        $('#saveMaskButton, #clearMaskButton').css('display', 'inline-block');
        $('#editMaskButton').css('display', 'none');
    }

    if (!overlayVisible) {
        showCameraOverlay();
    }
}

function disableMaskEdit(cameraId) {
    var cameraFrames;
    if (cameraId) {
        cameraFrames = [getCameraFrame(cameraId)];
    }
    else { /* disable mask editor on any camera */
        cameraFrames = getCameraFrames().toArray().map(function (f) {return $(f);});
    }

    cameraFrames.forEach(function (cameraFrame) {
        var overlayDiv = cameraFrame.find('div.camera-overlay');
        var maskDiv = cameraFrame.find('div.camera-overlay-mask');

        overlayDiv.removeClass('mask-edit');
        maskDiv.html('');
        maskDiv.unbind('click');
    });

    var selectedCameraId = $('#cameraSelect').val();
    if (selectedCameraId && (!cameraId || cameraId == selectedCameraId)) {
        $('#editMaskButton').css('display', 'inline-block');
        $('#saveMaskButton, #clearMaskButton').css('display', 'none');
    }
}

function clearMask(cameraId) {
    var cameraFrame = getCameraFrame(cameraId);
    var maskDiv = cameraFrame.find('div.camera-overlay-mask');

    maskDiv.find('div.mask-element').removeClass('on');
    maskDiv[0]._matrixToMaskLines();
}
