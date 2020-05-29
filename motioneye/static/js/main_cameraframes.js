/* camera frames */

function addCameraFrameUi(cameraConfig) {
    var cameraId = cameraConfig.id;

    var cameraFrameDiv = $(
            '<div class="camera-frame">' +
                '<div class="camera-container">' +
                    '<div class="camera-placeholder"><img class="no-camera" src="' + staticPath + 'img/no-camera.svg"></div>' +
                    '<img class="camera">' +
                    '<div class="camera-progress"><img class="camera-progress"></div>' +
                '</div>' +
                '<div class="camera-overlay">' +
                    '<div class="camera-overlay-top">' +
                        '<div class="camera-name"><span class="camera-name"></span></div>' +
                        '<div class="camera-top-buttons">' +
                            '<div class="button icon camera-top-button mouse-effect full-screen" title="toggle full-screen camera"></div>' +
                            '<div class="button icon camera-top-button mouse-effect media-pictures" title="open pictures browser"></div>' +
                            '<div class="button icon camera-top-button mouse-effect media-movies" title="open movies browser"></div>' +
                            '<div class="button icon camera-top-button mouse-effect configure" title="configure this camera"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="camera-overlay-mask"></div>' +
                    '<div class="camera-overlay-bottom">' +
                        '<div class="camera-info">' +
                            '<span class="camera-info" title="streaming/capture frame rate"></span>' +
                        '</div>' +
                        '<div class="camera-action-buttons">' +
                        '<div class="camera-action-buttons-wrapper">' +
                                '<div class="button icon camera-action-button mouse-effect lock" title="lock"></div>' +
                                '<div class="button icon camera-action-button mouse-effect unlock" title="unlock"></div>' +
                                '<div class="button icon camera-action-button mouse-effect light-on" title="turn light on"></div>' +
                                '<div class="button icon camera-action-button mouse-effect light-off" title="turn light off"></div>' +
                                '<div class="button icon camera-action-button mouse-effect alarm-on" title="turn alarm on"></div>' +
                                '<div class="button icon camera-action-button mouse-effect alarm-off" title="turn alarm off"></div>' +
                                '<div class="button icon camera-action-button mouse-effect snapshot" title="take a snapshot"></div>' +
                                '<div class="button icon camera-action-button mouse-effect record-start" title="toggle continuous recording mode"></div>' +
                                '<div class="button icon camera-action-button mouse-effect up" title="up"></div>' +
                                '<div class="button icon camera-action-button mouse-effect down" title="down"></div>' +
                                '<div class="button icon camera-action-button mouse-effect left" title="left"></div>' +
                                '<div class="button icon camera-action-button mouse-effect right" title="right"></div>' +
                                '<div class="button icon camera-action-button mouse-effect zoom-in" title="zoom in"></div>' +
                                '<div class="button icon camera-action-button mouse-effect zoom-out" title="zoom out"></div>' +
                                '<div class="button icon camera-action-button mouse-effect preset preset1" title="preset 1"></div>' +
                                '<div class="button icon camera-action-button mouse-effect preset preset2" title="preset 2"></div>' +
                                '<div class="button icon camera-action-button mouse-effect preset preset3" title="preset 3"></div>' +
                                '<div class="button icon camera-action-button mouse-effect preset preset4" title="preset 4"></div>' +
                                '<div class="button icon camera-action-button mouse-effect preset preset5" title="preset 5"></div>' +
                                '<div class="button icon camera-action-button mouse-effect preset preset6" title="preset 6"></div>' +
                                '<div class="button icon camera-action-button mouse-effect preset preset7" title="preset 7"></div>' +
                                '<div class="button icon camera-action-button mouse-effect preset preset8" title="preset 8"></div>' +
                                '<div class="button icon camera-action-button mouse-effect preset preset9" title="preset 9"></div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>');

    var nameSpan = cameraFrameDiv.find('span.camera-name');

    var configureButton = cameraFrameDiv.find('div.camera-top-button.configure');
    var picturesButton = cameraFrameDiv.find('div.camera-top-button.media-pictures');
    var moviesButton = cameraFrameDiv.find('div.camera-top-button.media-movies');
    var fullScreenButton = cameraFrameDiv.find('div.camera-top-button.full-screen');

    var cameraInfoDiv = cameraFrameDiv.find('div.camera-info');
    var cameraInfoSpan = cameraFrameDiv.find('span.camera-info');

    var lockButton = cameraFrameDiv.find('div.camera-action-button.lock');
    var unlockButton = cameraFrameDiv.find('div.camera-action-button.unlock');
    var lightOnButton = cameraFrameDiv.find('div.camera-action-button.light-on');
    var lightOffButton = cameraFrameDiv.find('div.camera-action-button.light-off');
    var alarmOnButton = cameraFrameDiv.find('div.camera-action-button.alarm-on');
    var alarmOffButton = cameraFrameDiv.find('div.camera-action-button.alarm-off');
    var snapshotButton = cameraFrameDiv.find('div.camera-action-button.snapshot');
    var recordButton = cameraFrameDiv.find('div.camera-action-button.record-start');
    var upButton = cameraFrameDiv.find('div.camera-action-button.up');
    var rightButton = cameraFrameDiv.find('div.camera-action-button.right');
    var downButton = cameraFrameDiv.find('div.camera-action-button.down');
    var leftButton = cameraFrameDiv.find('div.camera-action-button.left');
    var zoomInButton = cameraFrameDiv.find('div.camera-action-button.zoom-in');
    var zoomOutButton = cameraFrameDiv.find('div.camera-action-button.zoom-out');
    var preset1Button = cameraFrameDiv.find('div.camera-action-button.preset1');
    var preset2Button = cameraFrameDiv.find('div.camera-action-button.preset2');
    var preset3Button = cameraFrameDiv.find('div.camera-action-button.preset3');
    var preset4Button = cameraFrameDiv.find('div.camera-action-button.preset4');
    var preset5Button = cameraFrameDiv.find('div.camera-action-button.preset5');
    var preset6Button = cameraFrameDiv.find('div.camera-action-button.preset6');
    var preset7Button = cameraFrameDiv.find('div.camera-action-button.preset7');
    var preset8Button = cameraFrameDiv.find('div.camera-action-button.preset8');
    var preset9Button = cameraFrameDiv.find('div.camera-action-button.preset9');

    var cameraOverlay = cameraFrameDiv.find('div.camera-overlay');
    var cameraPlaceholder = cameraFrameDiv.find('div.camera-placeholder');
    var cameraProgress = cameraFrameDiv.find('div.camera-progress');
    var cameraImg = cameraFrameDiv.find('img.camera');
    var progressImg = cameraFrameDiv.find('img.camera-progress');

    /* no configure button unless admin */
    if (!isAdmin()) {
        configureButton.hide();
    }

    /* no media buttons for simple mjpeg cameras */
    if (cameraConfig['proto'] == 'mjpeg') {
        picturesButton.hide();
        moviesButton.hide();
    }

    cameraFrameDiv.attr('id', 'camera' + cameraId);
    cameraFrameDiv[0].refreshDivider = 0;
    cameraFrameDiv[0].config = cameraConfig;
    nameSpan.html(cameraConfig.name);
    progressImg.attr('src', staticPath + 'img/camera-progress.gif');

    cameraImg.click(function () {
        showCameraOverlay();
    });

    cameraOverlay.click(function () {
        hideCameraOverlay();
    });

    cameraOverlay.find('div.camera-overlay-top, div.camera-overlay-bottom').click(function () {
        return false;
    });

    cameraProgress.addClass('visible');
    cameraPlaceholder.css('opacity', '0');

    /* insert the new camera frame at the right position,
     * with respect to the camera id */
    var cameraFrames = getPageContainer().find('div.camera-frame');
    var cameraIds = cameraFrames.map(function () {return parseInt(this.id.substring(6));});
    cameraIds.sort();

    var index = 0; /* find the first position that is greater than the current camera id */
    while (index < cameraIds.length && cameraIds[index] < cameraId) {
        index++;
    }

    if (index < cameraIds.length) {
        var beforeCameraFrame = getPageContainer().find('div.camera-frame#camera' + cameraIds[index]);
        cameraFrameDiv.insertAfter(beforeCameraFrame);
    }
    else  {
        getPageContainer().append(cameraFrameDiv);
    }

    /* fade in */
    cameraFrameDiv.animate({'opacity': 1}, 100);

    /* add the top buttons handlers */
    configureButton.click(function () {
        doConfigureCamera(cameraId);
    });

    picturesButton.click(function (cameraId) {
        return function () {
            runMediaDialog(cameraId, 'picture');
        };
    }(cameraId));

    moviesButton.click(function (cameraId) {
        return function () {
            runMediaDialog(cameraId, 'movie');
        };
    }(cameraId));

    fullScreenButton.click(function (cameraId) {
        return function () {
            if (fullScreenCameraId && fullScreenCameraId == cameraId) {
                doExitFullScreenCamera();
            }
            else {
                doFullScreenCamera(cameraId);
            }
        };
    }(cameraId));

    /* action buttons */

    cameraFrameDiv.find('div.camera-action-button').css('display', 'none');
    var actionButtonDict = {
        'lock': lockButton,
        'unlock': unlockButton,
        'light_on': lightOnButton,
        'light_off': lightOffButton,
        'alarm_on': alarmOnButton,
        'alarm_off': alarmOffButton,
        'snapshot': snapshotButton,
        'record': recordButton,
        'up': upButton,
        'right': rightButton,
        'down': downButton,
        'left': leftButton,
        'zoom_in': zoomInButton,
        'zoom_out': zoomOutButton,
        'preset1': preset1Button,
        'preset2': preset2Button,
        'preset3': preset3Button,
        'preset4': preset4Button,
        'preset5': preset5Button,
        'preset6': preset6Button,
        'preset7': preset7Button,
        'preset8': preset8Button,
        'preset9': preset9Button
    };

    cameraConfig.actions.forEach(function (action) {
        var button = actionButtonDict[action];
        if (!button) {
            return;
        }

        button.css('display', '');
        button.click(function () {
            if (button.hasClass('pending')) {
                return;
            }

            button.addClass('pending');

            if (action == 'record') {
                if (button.hasClass('record-start')) {
                    action = 'record_start';
                }
                else {
                    action = 'record_stop';
                }
            }

            doAction(cameraId, action, function () {
                button.removeClass('pending');
            });
        })
    });

    if (cameraConfig.actions.length <= 4) {
        cameraOverlay.find('div.camera-overlay-bottom').addClass('few-buttons');
    }
    else {
        //cameraOverlay.find('div.camera-action-buttons-wrapper').css('width', Math.ceil(cameraConfig.actions.length / 2) * 2.5 + 'em');
        cameraOverlay.find('div.camera-action-buttons-wrapper').css('width', 4 * 2.5 + 'em');
    }

    var FPS_LEN = 4;
    cameraImg[0].fpsTimes = [];

    /* error and load handlers */
    cameraImg[0].onerror = function () {
        this.error = true;
        this.loading_count = 0;

        cameraImg.addClass('error').removeClass('initializing');
        cameraImg.height(Math.round(cameraImg.width() * 0.75));
        cameraPlaceholder.css('opacity', 1);
        cameraProgress.removeClass('visible');
        cameraFrameDiv.removeClass('motion-detected');
        cameraInfoSpan.html('');
    };
    cameraImg[0].onload = function () {
        if (this.error) {
            cameraImg.removeClass('error');
            cameraPlaceholder.css('opacity', 0);
            cameraImg.css('height', '');
            this.error = false;
        }

        this.loading_count = 0;
        if (this.naturalWidth) {
            this._naturalWidth = this.naturalWidth;
        }
        if (this.naturalHeight) {
            this._naturalHeight = this.naturalHeight;
        }

        if (this.initializing) {
            cameraProgress.removeClass('visible');
            cameraImg.removeClass('initializing');
            cameraImg.css('height', '');
            this.initializing = false;

            updateLayout();
        }

        /* there's no point in looking for a cookie update more often than once every second */
        var now = new Date().getTime();
        if ((!this.lastCookieTime || now - this.lastCookieTime > 1000) && (cameraFrameDiv[0].config['proto'] != 'mjpeg')) {
            if (getCookie('motion_detected_' + cameraId) == 'true') {
                cameraFrameDiv.addClass('motion-detected');
            }
            else {
                cameraFrameDiv.removeClass('motion-detected');
            }

            if (getCookie('record_active_' + cameraId) == 'true') {
                recordButton.removeClass('record-start').addClass('record-stop');
            }
            else {
                recordButton.removeClass('record-stop').addClass('record-start');
            }

            var captureFps = getCookie('capture_fps_' + cameraId);
            var monitorInfo = getCookie('monitor_info_' + cameraId);

            this.lastCookieTime = now;

            if (this.fpsTimes.length == FPS_LEN) {
                var streamingFps = this.fpsTimes.length * 1000 / (this.fpsTimes[this.fpsTimes.length - 1] - this.fpsTimes[0]);
                streamingFps = streamingFps.toFixed(1);

                var info = streamingFps;
                if (captureFps) {
                    info += '/' + captureFps;
                }

                info += ' fps';

                if (monitorInfo) {
                    monitorInfo = decodeURIComponent(monitorInfo);
                    if (monitorInfo.charAt(0) == monitorInfo.charAt(monitorInfo.length - 1) == '"') {
                        monitorInfo = monitorInfo.substring(1, monitorInfo.length - 1);
                    }
                    info += '<br>' + monitorInfo;
                    cameraInfoDiv.addClass('two-lines');
                }
                else {
                    cameraInfoDiv.removeClass('two-lines')
                }

                cameraInfoSpan.html(info);
            }
        }

        /* compute the actual framerate */
        if (cameraFrameDiv[0].config['proto'] != 'mjpeg') {
            this.fpsTimes.push(now);
            while (this.fpsTimes.length > FPS_LEN) {
                this.fpsTimes.shift();
            }
        }

        if (fullScreenCameraId) {
            /* update the modal dialog position when image is loaded */
            updateModalDialogPosition();
        }
    };

    cameraImg.addClass('initializing');
    cameraImg[0].initializing = true;
    cameraImg.height(Math.round(cameraImg.width() * 0.75));
}

function remCameraFrameUi(cameraId) {
    var cameraFrameDiv = getPageContainer().find('div.camera-frame#camera' + cameraId);
    cameraFrameDiv.animate({'opacity': 0}, 100, function () {
        cameraFrameDiv.remove();
    });
}

function recreateCameraFrames(cameras) {
    function updateCameras(cameras) {
        cameras = cameras.filter(function (camera) {return camera.enabled;});
        var i, camera;

        /* remove everything on the page */
        getPageContainer().children().remove();

        /* add camera frames */
        for (i = 0; i < cameras.length; i++) {
            camera = cameras[i];
            addCameraFrameUi(camera);
        }

        /* overlay is always hidden after creating the frames */
        hideCameraOverlay();

        var query = splitUrl().params;
        if ($('#cameraSelect').find('option').length < 2 && isAdmin() && !query.camera_ids) {
            /* invite the user to add a camera */
            var addCameraLink = $('<div class="add-camera-message">' +
                    '<a href="javascript:runAddCameraDialog()">You have not configured any camera yet. Click here to add one...</a></div>');
            getPageContainer().append(addCameraLink);
        }
    }

    if (cameras != null) {
        updateCameras(cameras);
    }
    else {
        ajax('GET', basePath + 'config/list/', null, function (data) {
            if (data == null || data.error) {
                showErrorMessage(data && data.error);
                return;
            }

            updateCameras(data.cameras);
        });
    }

    /* update the settings panel */
    var cameraId = $('#cameraSelect').val();
    if (cameras == null && cameraId && cameraId != 'add') {
        openSettings(cameraId);
    }
}


function doConfigureCamera(cameraId) {
    if (inProgress) {
        return;
    }

    hideApply();
    pushConfigs = {};
    pushConfigReboot = false;

    openSettings(cameraId);
}

function doFullScreenCamera(cameraId) {
    if (inProgress) {
        return;
    }

    if (fullScreenCameraId != null) {
        return; /* a camera is already in full screen */
    }

    closeSettings();

    fullScreenCameraId = cameraId;

    var cameraIds = getCameraIds();
    cameraIds.forEach(function (cid) {
        if (cid == cameraId) {
            return;
        }

        refreshDisabled[cid] |= 0;
        refreshDisabled[cid]++;

        var cf = getCameraFrame(cid);
        cf.css('height', cf.height()); /* required for the height animation */
        setTimeout(function () {
            cf.addClass('full-screen-hidden');
        }, 10);
    });

    var cameraFrame = getCameraFrame(cameraId);
    var pageContainer = getPageContainer();

    pageContainer.addClass('full-screen');
    cameraFrame.addClass('full-screen');
    $('div.header').addClass('full-screen');
    $('div.footer').addClass('full-screen');

    /* try to make browser window full screen */
    var element = document.documentElement;
    var requestFullScreen = (
            element.requestFullscreen ||
            element.requestFullScreen ||
            element.webkitRequestFullscreen ||
            element.webkitRequestFullScreen ||
            element.mozRequestFullscreen ||
            element.mozRequestFullScreen ||
            element.msRequestFullscreen ||
            element.msRequestFullScreen);

    if (requestFullScreen) {
        requestFullScreen.call(element);
    }

    /* calling updateLayout like this fixes wrong frame size
     * after the window as actually been put into full screen mode */
    updateLayout();
    setTimeout(updateLayout, 200);
    setTimeout(updateLayout, 400);
    setTimeout(updateLayout, 1000);
}

function doExitFullScreenCamera() {
    if (fullScreenCameraId == null) {
        return; /* no current full-screen camera */
    }

    getCameraFrames().
            removeClass('full-screen-hidden').
            css('height', '');

    var cameraFrame = getCameraFrame(fullScreenCameraId);
    var pageContainer = getPageContainer();

    $('div.header').removeClass('full-screen');
    $('div.footer').removeClass('full-screen');
    pageContainer.removeClass('full-screen');
    cameraFrame.removeClass('full-screen');

    var cameraIds = getCameraIds();
    cameraIds.forEach(function (cid) {
        if (cid == fullScreenCameraId) {
            return;
        }

        refreshDisabled[cid]--;
    });

    fullScreenCameraId = null;

    updateLayout();

    /* exit browser window full screen */
    var exitFullScreen = (
            document.exitFullscreen ||
            document.cancelFullScreen ||
            document.webkitExitFullscreen ||
            document.webkitCancelFullScreen ||
            document.mozExitFullscreen ||
            document.mozCancelFullScreen ||
            document.msExitFullscreen ||
            document.msCancelFullScreen);

    if (exitFullScreen) {
        exitFullScreen.call(document);
    }
}

function isFullScreen() {
    return fullScreenCameraId != null;
}

function refreshCameraFrames() {
    var timestamp = new Date().getTime();

    if (modalContainer.css('display') != 'none') {
        /* pause camera refresh if hidden by a dialog */
        return setTimeout(refreshCameraFrames, 1000);
    }

    function refreshCameraFrame(cameraId, img, serverSideResize) {
        if (refreshDisabled[cameraId]) {
            /* camera refreshing disabled, retry later */

            return;
        }

        if (img.loading_count) {
            img.loading_count++; /* increases each time the camera would refresh but is still loading */

            if (img.loading_count > 2 * 1000 / refreshInterval) { /* limits the retries to one every two seconds */
                img.loading_count = 0;
            }
            else {
                return; /* wait for the previous frame to finish loading */
            }
        }

        var path = basePath + 'picture/' + cameraId + '/current/?_=' + timestamp;
        if (resolutionFactor != 1) {
            path += '&width=' + resolutionFactor;
        }
        else if (serverSideResize) {
            path += '&width=' + img.width;
        }

        path = addAuthParams('GET', path);

        img.src = path;
        img.loading_count = 1;
    }

    var cameraFrames;
    if (fullScreenCameraId != null && fullScreenCameraId >= 0) {
        cameraFrames = getCameraFrame(fullScreenCameraId);
    }
    else {
        cameraFrames = getCameraFrames();
    }

    cameraFrames.each(function () {
        if (!this.img) {
            this.img = $(this).find('img.camera')[0];
            if (this.config['proto'] == 'mjpeg') {
                var url = this.config['url'].replace('127.0.0.1', window.location.host.split(':')[0]);
                url += (url.indexOf('?') > 0 ? '&' : '?') + '_=' + new Date().getTime();

                /* if (url.indexOf('@') >= 0) {
                    url = url.substring(0, url.indexOf('//') + 2)+ url.substring(url.indexOf('@') + 1);
                } */

                this.img.src = url;
            }
        }

        if (this.config['proto'] == 'mjpeg') {
            return; /* no manual refresh for simple mjpeg cameras */
        }

        var count = parseInt(1000 / (refreshInterval * this.config['streaming_framerate']));
        var serverSideResize = this.config['streaming_server_resize'];
        var cameraId = this.id.substring(6);

        count /= framerateFactor;

        /* if frameFactor is 0, we only want one camera refresh at the beginning,
         * and no subsequent refreshes at all */
        if (framerateFactor == 0 && this.refreshDivider == 0) {
            refreshCameraFrame(cameraId, this.img, serverSideResize);
            this.refreshDivider++;
        }

        if (this.img.error) {
            /* in case of error, decrease the refresh rate to 1 fps */
            count = 1000 / refreshInterval;
        }

        if (this.refreshDivider < count) {
            this.refreshDivider++;
        }
        else {
            refreshCameraFrame(cameraId, this.img, serverSideResize);
            this.refreshDivider = 0;
        }
    });

    setTimeout(refreshCameraFrames, refreshInterval);
}

function checkCameraErrors() {
    /* properly triggers the onerror event on the cameras whose imgs were not successfully loaded,
     * but the onerror event hasn't been triggered, for some reason (seems to happen in Chrome) */
    var cameraImgs = getPageContainer().find('img.camera');
    var now = new Date().getTime();

    cameraImgs.each(function () {
        if (this.complete === true && this.naturalWidth === 0 && !this.error && this.src) {
            $(this).error();
        }

        /* fps timeout */
        if (this.fpsTimes && this.fpsTimes.length && (now - this.fpsTimes[this.fpsTimes.length - 1]) > 2000) {
            $(this).parents('div.camera-frame').find('span.camera-info.fps').html('0 fps');
        }
    });

    setTimeout(checkCameraErrors, 1000);
}