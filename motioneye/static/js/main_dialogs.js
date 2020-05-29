/* dialogs */

function runAlertDialog(message, onOk, options) {
    var params = {
        title: message,
        buttons: 'ok',
        onOk: onOk
    };

    if (options) {
        Object.update(params, options);
    }

    runModalDialog(params);
}

function runConfirmDialog(message, onYes, options) {
    var params = {
        title: message,
        buttons: 'yesno',
        onYes: onYes
    };

    if (options) {
        Object.update(params, options);
    }

    runModalDialog(params);
}

function runLoginDialog(retry) {
    /* a workaround so that browsers will remember the credentials */
    var tempFrame = $('<iframe name="temp" id="temp" style="display: none;"></iframe>');
    $('body').append(tempFrame);

    var form =
            $('<form action="' + basePath + 'login/" target="temp" method="POST"><table class="login-dialog">' +
                '<tr>' +
                    '<td class="login-dialog-error" colspan="100"></td>' +
                '</tr>' +
                '<tr>' +
                    '<td class="dialog-item-label"><span class="dialog-item-label">Username</span></td>' +
                    '<td class="dialog-item-value"><input type="text" name="username" class="styled" id="usernameEntry" autofocus></td>' +
                '</tr>' +
                '<tr>' +
                    '<td class="dialog-item-label"><span class="dialog-item-label">Password</span></td>' +
                    '<td class="dialog-item-value"><input type="password" name="password" class="styled" id="passwordEntry"></td>' +
                    '<input type="submit" style="display: none;" name="login" value="login">' +
                '</tr>' +
                '<tr>' +
                    '<td class="dialog-item-label"><span class="dialog-item-label">Remember Me</span></td>' +
                    '<td class="dialog-item-value"><input type="checkbox" name="remember" class="styled" id="rememberCheck"></td>' +
                '</tr>' +
            '</table></form>');

    var form = 
            $('\
            <form class="form-signin text-light" action="' + basePath + 'login/" target="temp" method="POST"> \
            <div class="text-center mb-4"> \
                <h1 class="h3 mb-3 font-weight-normal">Login</h1> \
            </div> \
            \
            <div class="form-label-group"> \
                <input type="text" id="usernameEntry" name="username" class="form-control" placeholder="Username" autofocus> \
                <label for="usernameEntry">Username</label> \
            </div> \
            \
            <div class="form-label-group"> \
                <input type="password" id="passwordEntry" name="password" class="form-control" placeholder="Password"> \
                <label for="passwordEntry">Password</label> \
            </div> \
            <input type="submit" style="display: none;" name="login" value="login">\
            <div class="checkbox mb-3"> \
                <label> \
                <input type="checkbox" value="remember-me" id="rememberCheck"> Remember me \
                </label> \
            </div>'+
            // '<button class="btn btn-lg btn-primary btn-block" type="submit">Sign in</button>'+
            // '<p class="mt-5 mb-3 text-muted text-center">&copy; 2017-2020</p>'+
            '</form> \
            ');

    var usernameEntry = form.find('#usernameEntry');
    var passwordEntry = form.find('#passwordEntry');
    var rememberCheck = form.find('#rememberCheck');
    var errorTd = form.find('td.login-dialog-error');

    makeCheckBox(rememberCheck);

    if (window._loginRetry) {
        errorTd.css('display', 'table-cell');
        errorTd.html('Invalid credentials.');
    }

    var params = {
        title: 'Login',
        content: form,
        buttons: [
            {caption: 'Cancel', isCancel: true, click: function () {
                tempFrame.remove();
            }},
            {caption: 'Login', isDefault: true, click: function () {
                window.username = usernameEntry.val();
                window.passwordHash = sha1(passwordEntry.val()).toLowerCase();
                window._loginDialogSubmitted = true;

                if (rememberCheck[0].checked) {
                    setCookie(USERNAME_COOKIE, window.username, /* days = */ 3650);
                    setCookie(PASSWORD_COOKIE, window.passwordHash, /* days = */ 3650);
                }

                form.submit();
                setTimeout(function () {
                    tempFrame.remove();
                }, 5000);

                if (retry) {
                    retry();
                }
            }}
        ]
    };

    runModalDialog(params);
}

function runPictureDialog(entries, pos, mediaType) {
    var content = $('<div class="picture-dialog-content"></div>');

    var img = $('<img class="picture-dialog-content">');
    content.append(img);

    var video_container = $('<video class="picture-dialog-content" controls="true">');
    var video_loader = $('<img>');
    video_container.on('error', function(err) {
        var msg = '';

        /* Reference: https://html.spec.whatwg.org/multipage/embedded-content.html#error-codes */
        switch (err.target.error.code) {
            case err.target.error.MEDIA_ERR_ABORTED:
                msg = 'You aborted the video playback.';
                break;
            case err.target.error.MEDIA_ERR_NETWORK:
                msg = 'A network error occurred.';
                break;
            case err.target.error.MEDIA_ERR_DECODE:
                msg = 'Media decode error or unsupported media features.';
                break;
            case err.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                msg = 'Media format unsupported or otherwise unavilable/unsuitable for playing.';
                break;
            default:
                msg = 'Unknown error occurred.'
        }

        showErrorMessage('Error: ' + msg);
    });
    video_container.hide();
    content.append(video_container);

    var prevArrow = $('<div class="picture-dialog-prev-arrow button mouse-effect" title="previous picture"></div>');
    content.append(prevArrow);

    var playButton = $('<div class="picture-dialog-play button mouse-effect" title="play"></div>');
    content.append(playButton);

    var nextArrow = $('<div class="picture-dialog-next-arrow button mouse-effect" title="next picture"></div>');
    content.append(nextArrow);
    var progressImg = $('<div class="picture-dialog-progress">');

    function updatePicture() {
        var entry = entries[pos];

        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        var widthCoef = windowWidth < 1000 ? 0.8 : 0.5;
        var heightCoef = 0.75;

        var width = parseInt(windowWidth * widthCoef);
        var height = parseInt(windowHeight * heightCoef);

        prevArrow.css('display', 'none');
        nextArrow.css('display', 'none');

        var playable = video_container.get(0).canPlayType(entry.mimeType) != ''
        playButton.hide();
        video_container.hide();
        img.show();

        img.parent().append(progressImg);
        updateModalDialogPosition();

        img.attr('src', addAuthParams('GET', basePath + mediaType + '/' + entry.cameraId + '/preview' + entry.path));

        if (playable) {
            video_loader.attr('src', addAuthParams('GET', basePath + mediaType + '/' + entry.cameraId + '/playback' + entry.path));
            playButton.on('click', function() {
                video_container.attr('src', addAuthParams('GET', basePath + mediaType + '/' + entry.cameraId + '/playback' + entry.path));
                video_container.show();
                video_container.get(0).load();  /* Must call load() after changing <video> source */
                img.hide();
                playButton.hide();
                video_container.on('canplay', function() {
                    video_container.get(0).play();  /* Automatically play the video once the browser is ready */
                });
            });

            playButton.show();
        }

        img.load(function () {
            var aspectRatio = this.naturalWidth / this.naturalHeight;
            var sizeWidth = width * width / aspectRatio;
            var sizeHeight = height * aspectRatio * height;

            img.width('').height('');
            video_container.width('').height('');

            if (sizeWidth < sizeHeight) {
                img.width(width);
                video_container.width(width).height(parseInt(width/aspectRatio));
            }
            else {
                img.height(height);
                video_container.width(parseInt(height*aspectRatio)).height(height);
            }
            updateModalDialogPosition();
            prevArrow.css('display', pos < entries.length - 1 ? '' : 'none');
            nextArrow.css('display', pos > 0 ? '' : 'none');
            progressImg.remove();
        });

        modalContainer.find('span.modal-title:last').html(entry.name);
        updateModalDialogPosition();
    }

    prevArrow.click(function () {
        if (pos < entries.length - 1) {
            pos++;
        }

        updatePicture();
    });

    nextArrow.click(function () {
        if (pos > 0) {
            pos--;
        }

        updatePicture();
    });

    function bodyKeyDown(e) {
        switch (e.which) {
            case 37:
                if (prevArrow.is(':visible')) {
                    prevArrow.click();
                }
                break;

            case 39:
                if (nextArrow.is(':visible')) {
                    nextArrow.click();
                }
                break;
        }
    }

    $('body').on('keydown', bodyKeyDown);

    img.load(updateModalDialogPosition);

    runModalDialog({
        title: ' ',
        closeButton: true,
        buttons: [
            {caption: 'Close'},
            {caption: 'Download', isDefault: true, click: function () {
                var entry = entries[pos];
                downloadFile(mediaType + '/' + entry.cameraId + '/download' + entry.path);

                return false;
            }}
        ],
        content: content,
        stack: true,
        onShow: updatePicture,
        onClose: function () {
            $('body').off('keydown', bodyKeyDown);
        }
    });
}

function runAddCameraDialog() {
    if (Object.keys(pushConfigs).length) {
        return runAlertDialog('Please apply the modified settings first!');
    }

    var content =
            $('<table class="add-camera-dialog">' +
                '<tr>' +
                    '<td class="dialog-item-label"><span class="dialog-item-label">Camera Type</span></td>' +
                    '<td class="dialog-item-value"><select class="styled" id="typeSelect">' +
                        (hasLocalCamSupport ? '<option value="v4l2">Local V4L2 Camera</option>' : '') +
                        (hasLocalCamSupport ? '<option value="mmal">Local MMAL Camera</option>' : '') +
                        (hasNetCamSupport ? '<option value="netcam">Network Camera</option>' : '') +
                        '<option value="motioneye">Remote motionEye Camera</option>' +
                        '<option value="mjpeg">Simple MJPEG Camera</option>' +
                    '</select></td>' +
                    '<td><span class="help-mark" title="the type of camera you wish to add">?</span></td>' +
                '</tr>' +
                '<tr class="motioneye netcam mjpeg">' +
                    '<td class="dialog-item-label"><span class="dialog-item-label">URL</span></td>' +
                    '<td class="dialog-item-value"><input type="text" class="styled" id="urlEntry" placeholder="http://example.com:8765/cams/..."></td>' +
                    '<td><span class="help-mark" title="the camera URL (e.g. http://example.com:8080/cam/)">?</span></td>' +
                '</tr>' +
                '<tr class="motioneye netcam mjpeg">' +
                    '<td class="dialog-item-label"><span class="dialog-item-label">Username</span></td>' +
                    '<td class="dialog-item-value"><input type="text" class="styled" id="usernameEntry" placeholder="username..."></td>' +
                    '<td><span class="help-mark" title="the username for the URL, if required (e.g. admin)">?</span></td>' +
                '</tr>' +
                '<tr class="motioneye netcam mjpeg">' +
                    '<td class="dialog-item-label"><span class="dialog-item-label">Password</span></td>' +
                    '<td class="dialog-item-value"><input type="password" class="styled" id="passwordEntry" placeholder="password..."></td>' +
                    '<td><span class="help-mark" title="the password for the URL, if required">?</span></td>' +
                '</tr>' +
                '<tr class="v4l2 motioneye netcam mjpeg mmal">' +
                    '<td class="dialog-item-label"><span class="dialog-item-label">Camera</span></td>' +
                    '<td class="dialog-item-value"><select class="styled" id="addCameraSelect"></select><span id="cameraMsgLabel"></span></td>' +
                    '<td><span class="help-mark" title="the camera you wish to add">?</span></td>' +
                '</tr>' +
                '<tr class="v4l2 motioneye netcam mjpeg mmal">' +
                    '<td colspan="100"><div class="dialog-item-separator"></div></td>' +
                '</tr>' +
                '<tr class="v4l2 motioneye netcam mjpeg mmal">' +
                    '<td class="dialog-item-value" colspan="100"><div id="addCameraInfo"></div></td>' +
                '</tr>' +
            '</table>');

    /* collect ui widgets */
    var typeSelect = content.find('#typeSelect');
    var urlEntry = content.find('#urlEntry');
    var usernameEntry = content.find('#usernameEntry');
    var passwordEntry = content.find('#passwordEntry');
    var addCameraSelect = content.find('#addCameraSelect');
    var addCameraInfo = content.find('#addCameraInfo');
    var cameraMsgLabel = content.find('#cameraMsgLabel');

    var isProgress = false;

    /* make validators */
    makeUrlValidator(urlEntry, true);
    makeTextValidator(usernameEntry, false);
    makeTextValidator(typeSelect, false);
    makeComboValidator(addCameraSelect, true);

    /* ui interaction */
    function updateUi() {
        content.find('tr.v4l2, tr.motioneye, tr.netcam, tr.mjpeg, tr.mmal').css('display', 'none');

        if (typeSelect.val() == 'motioneye') {
            content.find('tr.motioneye').css('display', 'table-row');
            usernameEntry.val('admin');
            usernameEntry.attr('readonly', 'readonly');
            addCameraInfo.html(
                    'Remote motionEye cameras are cameras installed behind another motionEye server. ' +
                    'Adding them here will allow you to view and manage them remotely.');
        }
        else if (typeSelect.val() == 'netcam') {
            usernameEntry.removeAttr('readonly');

            /* make sure there is one trailing slash
                * so that a path can be detected */
            var url = urlEntry.val().trim();
            var m = url.match(new RegExp('/', 'g'));
            if (m && m.length < 3 && !url.endsWith('/')) {
                urlEntry.val(url + '/');
            }

            content.find('tr.netcam').css('display', 'table-row');
            addCameraInfo.html(
                    'Network cameras (or IP cameras) are devices that natively stream RTSP/RTMP or MJPEG videos or plain JPEG images. ' +
                    "Consult your device's manual to find out the correct RTSP, RTMP, MJPEG or JPEG URL.");
        }
        else if (typeSelect.val() == 'mmal') {
            content.find('tr.mmal').css('display', 'table-row');
            addCameraInfo.html(
                    'Local MMAL cameras are devices that are connected directly to your motionEye system. ' +
                    'These are usually board-specific cameras.');
        }
        else if (typeSelect.val() == 'mjpeg') {
            usernameEntry.removeAttr('readonly');

            /* make sure there is one trailing slash
                * so that a path can be detected */
            var url = urlEntry.val().trim();
            var m = url.match(new RegExp('/', 'g'));
            if (m && m.length < 3 && !url.endsWith('/')) {
                urlEntry.val(url + '/');
            }

            content.find('tr.mjpeg').css('display', 'table-row');
            addCameraInfo.html(
                    'Adding your device as a simple MJPEG camera instead of as a network camera will improve the framerate, ' +
                    'but no motion detection, picture capturing or movie recording will be available for it. ' +
                    'The camera must be accessible to both your server and your browser. ' +
                    'This type of camera is not compatible with Internet Explorer.');
        }
        else { /* assuming v4l2 */
            content.find('tr.v4l2').css('display', 'table-row');
            addCameraInfo.html(
                    'Local V4L2 cameras are camera devices that are connected directly to your motionEye system, ' +
                    'usually via USB.');
        }

        updateModalDialogPosition();

        /* re-validate all the validators */
        content.find('.validator').each(function () {
            this.validate();
        });

        if (uiValid()) {
            listCameras();
        }
    }

    function uiValid(includeCameraSelect) {
        if (isProgress) {
            /* add dialog is not valid while in progress */
            return false;
        }

        var query = content.find('input, select');
        if (!includeCameraSelect) {
            query = query.not('#addCameraSelect');
        }
        else {
            if (cameraMsgLabel.html() || !addCameraSelect.val()) {
                return false;
            }
        }

        /* re-validate all the validators */
        content.find('.validator').each(function () {
            this.validate();
        });

        var valid = true;
        query.each(function () {
            if (this.invalid) {
                valid = false;
                return false;
            }
        });

        return valid;
    }

    function splitCameraUrl(url) {
        var parts = url.split('://');
        var scheme = parts[0];
        var index = parts[1].indexOf('/');
        var host = null;
        var path = '';
        if (index >= 0) {
            host = parts[1].substring(0, index);
            path = parts[1].substring(index);
        }
        else {
            host = parts[1];
        }

        var port = '';
        parts = host.split(':');
        if (parts.length >= 2) {
            host = parts[0];
            port = parts[1];
        }

        if (path == '') {
            path = '/';
        }

        return {
            scheme: scheme,
            host: host,
            port: port,
            path: path
        };
    }

    function listCameras() {
        var progress = $('<div style="text-align: center; margin: 2px;"><img src="' + staticPath + 'img/small-progress.gif"></div>');

        addCameraSelect.html('');
        addCameraSelect.hide();
        addCameraSelect.parent().find('div').remove(); /* remove any previous progress div */
        addCameraSelect.before(progress);

        var data = {};
        if (urlEntry.is(':visible') && urlEntry.val()) {
            data = splitCameraUrl(urlEntry.val());
        }
        data.username = usernameEntry.val();
        data.password = passwordEntry.val();
        data.proto = typeSelect.val();

        if (data.proto == 'motioneye') {
            data.password = sha1(data.password);
        }

        cameraMsgLabel.html('');

        isProgress = true;
        ajax('GET', basePath + 'config/list/', data, function (data) {
            progress.remove();
            isProgress = false;

            if (data == null || data.error) {
                cameraMsgLabel.html(data && data.error);

                return;
            }

            if (data.error || !data.cameras) {
                return;
            }

            data.cameras.forEach(function (info) {
                var option = $('<option value="' + info.id + '">' + info.name + '</option>');
                option[0]._extra_attrs = {};
                Object.keys(info).forEach(function (key) {
                    if (key == 'id' || key == 'name') {
                        return;
                    }

                    var value = info[key];
                    option[0]._extra_attrs[key] = value;
                });

                addCameraSelect.append(option);
            });

            if (!data.cameras || !data.cameras.length) {
                addCameraSelect.append('<option value="">(no cameras)</option>');
            }

            addCameraSelect.show();
            addCameraSelect[0].validate();
        });
    }

    typeSelect.change(function () {
        addCameraSelect.html('');
    });

    typeSelect.change(updateUi);
    urlEntry.change(updateUi);
    usernameEntry.change(updateUi);
    passwordEntry.change(updateUi);

    runModalDialog({
        title: 'Add Camera...',
        closeButton: true,
        buttons: 'okcancel',
        content: content,
        onOk: function () {
            if (!uiValid(true)) {
                return false;
            }

            var data = {};

            if (typeSelect.val() == 'motioneye') {
                data = splitCameraUrl(urlEntry.val());
                data.proto = 'motioneye';
                data.username = usernameEntry.val();
                data.password = sha1(passwordEntry.val());
                data.remote_camera_id = addCameraSelect.val();
            }
            else if (typeSelect.val() == 'netcam') {
                data = splitCameraUrl(urlEntry.val());
                data.username = usernameEntry.val();
                data.password = passwordEntry.val();
                data.proto = 'netcam';
                data.camera_index = addCameraSelect.val();
            }
            else if (typeSelect.val() == 'mmal') {
                data.path = addCameraSelect.val();
                data.proto = 'mmal';
            }
            else if (typeSelect.val() == 'mjpeg') {
                data = splitCameraUrl(urlEntry.val());
                data.username = usernameEntry.val();
                data.password = passwordEntry.val();
                data.proto = 'mjpeg';
            }
            else { /* assuming v4l2 */
                data.proto = 'v4l2';
                data.path = addCameraSelect.val();
            }

            /* add all extra attributes */
            var option = addCameraSelect.find('option:eq(' + addCameraSelect[0].selectedIndex + ')')[0];
            Object.keys(option._extra_attrs).forEach(function (key) {
                var value = option._extra_attrs[key];
                data[key] = value;
            });

            beginProgress();
            ajax('POST', basePath + 'config/add/', data, function (data) {
                endProgress();

                if (data == null || data.error) {
                    showErrorMessage(data && data.error);
                    return;
                }

                var cameraOption = $('#cameraSelect').find('option[value=add]');
                cameraOption.before('<option value="' + data.id + '">' + data.name + '</option>');
                $('#cameraSelect').val(data.id).change();
                recreateCameraFrames();
            });
        }
    });

    updateUi();
}

function runTimelapseDialog(cameraId, groupKey, group) {
    var content =
            $('<table class="timelapse-dialog">' +
                '<tr><td colspan="2" class="timelapse-warning"></td></tr>' +
                '<tr>' +
                    '<td class="dialog-item-label"><span class="dialog-item-label">Group</span></td>' +
                    '<td class="dialog-item-value">' + groupKey + '</td>' +
                '</tr>' +
                '<tr>' +
                    '<td class="dialog-item-label"><span class="dialog-item-label">Include a picture taken every</span></td>' +
                    '<td class="dialog-item-value">' +
                        '<select class="styled timelapse" id="intervalSelect">' +
                            '<option value="1">second</option>' +
                            '<option value="5">5 seconds</option>' +
                            '<option value="10">10 seconds</option>' +
                            '<option value="30">30 seconds</option>' +
                            '<option value="60">minute</option>' +
                            '<option value="300">5 minutes</option>' +
                            '<option value="600">10 minutes</option>' +
                            '<option value="1800">30 minutes</option>' +
                            '<option value="3600">hour</option>' +
                        '</select>' +
                    '</td>' +
                    '<td><span class="help-mark" title="choose the interval of time between two selected pictures">?</span></td>' +
                '</tr>' +
                '<tr>' +
                    '<td class="dialog-item-label"><span class="dialog-item-label">Movie framerate</span></td>' +
                    '<td class="dialog-item-value"><input type="text" class="styled range" id="framerateSlider"></td>' +
                    '<td><span class="help-mark" title="choose how fast you want the timelapse playback to be">?</span></td>' +
                '</tr>' +
            '</table>');

    var intervalSelect = content.find('#intervalSelect');
    var framerateSlider = content.find('#framerateSlider');
    var timelapseWarning = content.find('td.timelapse-warning');

    if (group.length > 1440) { /* one day worth of pictures, taken 1 minute apart */
        timelapseWarning.html('Given the large number of pictures, creating your timelapse might take a while!');
        timelapseWarning.css('display', 'table-cell');
    }

    makeSlider(framerateSlider, 1, 100, 0, [
        {value: 1, label: '1'},
        {value: 20, label: '20'},
        {value: 40, label: '40'},
        {value: 60, label: '60'},
        {value: 80, label: '80'},
        {value: 100, label: '100'}
    ], null, 0);

    intervalSelect.val(60);
    framerateSlider.val(20).each(function () {this.update()});

    runModalDialog({
        title: 'Create Timelapse Movie',
        closeButton: true,
        buttons: 'okcancel',
        content: content,
        onOk: function () {
            var progressBar = $('<div style=""></div>');
            makeProgressBar(progressBar);

            runModalDialog({
                title: 'Creating Timelapse Movie...',
                content: progressBar,
                stack: true,
                noKeys: true
            });

            var url = basePath + 'picture/' + cameraId + '/timelapse/' + groupKey + '/';
            var data = {interval: intervalSelect.val(), framerate: framerateSlider.val()};
            var first = true;

            function checkTimelapse() {
                var actualUrl = url;
                if (!first) {
                    actualUrl += '?check=true';
                }

                ajax('GET', actualUrl, data, function (data) {
                    if (data == null || data.error) {
                        hideModalDialog(); /* progress */
                        hideModalDialog(); /* timelapse dialog */
                        showErrorMessage(data && data.error);
                        return;
                    }

                    if (data.progress != -1 && first) {
                        showPopupMessage('A timelapse movie is already being created.');
                    }

                    if (data.progress == -1 && !first && !data.key) {
                        hideModalDialog(); /* progress */
                        hideModalDialog(); /* timelapse dialog */
                        showErrorMessage('The timelapse movie could not be created.');
                        return;
                    }

                    if (data.progress == -1) {
                        data.progress = 0;
                    }

                    if (data.key) {
                        progressBar[0].setProgress(100);
                        progressBar[0].setText('100%');

                        setTimeout(function () {
                            hideModalDialog(); /* progress */
                            hideModalDialog(); /* timelapse dialog */
                            downloadFile('picture/' + cameraId + '/timelapse/' + groupKey + '/?key=' + data.key);
                        }, 500);
                    }
                    else {
                        progressBar[0].setProgress(data.progress * 100);
                        progressBar[0].setText(parseInt(data.progress * 100) + '%');
                        setTimeout(checkTimelapse, 1000);
                    }

                    first = false;
                });
            }

            checkTimelapse();

            return false;
        },
        stack: true
    });
}

function runMediaDialog(cameraId, mediaType) {
    var dialogDiv = $('<div class="media-dialog"></div>');
    var mediaListDiv = $('<div class="media-dialog-list"></div>');
    var groupsDiv = $('<div class="media-dialog-groups"></div>');
    var buttonsDiv = $('<div class="media-dialog-buttons"></div>');

    var groups = {};
    var groupKey = null;

    dialogDiv.append(groupsDiv);
    dialogDiv.append(mediaListDiv);
    dialogDiv.append(buttonsDiv);

    /* add a temporary div to compute 3em in px */
    var tempDiv = $('<div style="width: 3em; height: 3em;"></div>');
    modalContainer.append(tempDiv);
    var height = tempDiv.height();
    tempDiv.remove();

    function showGroup(key) {
        groupKey = key;

        if (mediaListDiv.find('img.media-list-progress').length) {
            return; /* already in progress of loading */
        }

        /* (re)set the current state of the group buttons */
        groupsDiv.find('div.media-dialog-group-button').each(function () {
            var $this = $(this);
            if (this.key == key) {
                $this.addClass('current');
            }
            else {
                $this.removeClass('current');
            }
        });

        var mediaListByName = {};
        var entries = groups[key];

        /* cleanup the media list */
        mediaListDiv.children('div.media-list-entry').detach();
        mediaListDiv.html('');

        function addEntries() {
            /* add the entries to the media list */
            entries.forEach(function (entry) {
                var entryDiv = entry.div;
                var detailsDiv = null;

                if (!entryDiv) {
                    entryDiv = $('<div class="media-list-entry"></div>');

                    var previewImg = $('<img class="media-list-preview" src="' + staticPath + 'img/modal-progress.gif"/>');
                    entryDiv.append(previewImg);
                    previewImg[0]._src = addAuthParams('GET', basePath + mediaType + '/' + cameraId + '/preview' + entry.path + '?height=' + height);

                    var downloadButton = $('<div class="media-list-download-button button">Download</div>');
                    entryDiv.append(downloadButton);

                    var deleteButton = $('<div class="media-list-delete-button button">Delete</div>');
                    if (isAdmin()) {
                        entryDiv.append(deleteButton);
                    }

                    var nameDiv = $('<div class="media-list-entry-name">' + entry.name + '</div>');
                    entryDiv.append(nameDiv);

                    detailsDiv = $('<div class="media-list-entry-details"></div>');
                    entryDiv.append(detailsDiv);

                    downloadButton.click(function () {
                        downloadFile(mediaType + '/' + cameraId + '/download' + entry.path);
                        return false;
                    });

                    deleteButton.click(function () {
                        doDeleteFile(basePath + mediaType + '/' + cameraId + '/delete' + entry.path, function () {
                            entryDiv.remove();
                            var pos = entries.indexOf(entry);
                            if (pos >= 0) {
                                entries.splice(pos, 1); /* remove entry from group */
                            }

                            /* update text on group button */
                            groupsDiv.find('div.media-dialog-group-button').each(function () {
                                var $this = $(this);
                                if (this.key == groupKey) {
                                    var text = this.innerHTML;
                                    text = text.substring(0, text.lastIndexOf(' '));
                                    text += ' (' + entries.length + ')';
                                    this.innerHTML = text;
                                }
                            });
                        });

                        return false;
                    });

                    entryDiv.click(function () {
                        var pos = entries.indexOf(entry);
                        runPictureDialog(entries, pos, mediaType);
                    });

                    entry.div = entryDiv;
                }
                else {
                    detailsDiv = entry.div.find('div.media-list-entry-details');
                }

                var momentSpan = $('<span class="details-moment">' + entry.momentStr + ', </span>');
                var momentShortSpan = $('<span class="details-moment-short">' + entry.momentStrShort + '</span>');
                var sizeSpan = $('<span class="details-size">' + entry.sizeStr + '</span>');
                detailsDiv.empty();
                detailsDiv.append(momentSpan);
                detailsDiv.append(momentShortSpan);
                detailsDiv.append(sizeSpan);
                mediaListDiv.append(entryDiv);
            });

            /* trigger a scroll event */
            mediaListDiv.scroll();
        }

        /* if details are already fetched, simply add the entries and return */
        if (entries[0].timestamp) {
            return addEntries();
        }

        var previewImg = $('<img class="media-list-progress" src="' + staticPath + 'img/modal-progress.gif"/>');
        mediaListDiv.append(previewImg);

        var url = basePath + mediaType + '/' + cameraId + '/list/?prefix=' + (key || 'ungrouped');
        ajax('GET', url, null, function (data) {
            previewImg.remove();

            if (data == null || data.error) {
                hideModalDialog();
                showErrorMessage(data && data.error);
                return;
            }

            /* index the media list by name */
            data.mediaList.forEach(function (media) {
                var path = media.path;
                var parts = path.split('/');
                var name = parts[parts.length - 1];

                mediaListByName[name] = media;
            });

            /* assign details to entries */
                entries.forEach(function (entry) {
                    var media = mediaListByName[entry.name];
                    if (media) {
                        entry.mimeType = media.mimeType;
                        entry.momentStr = media.momentStr;
                        entry.momentStrShort = media.momentStrShort;
                        entry.sizeStr = media.sizeStr;
                        entry.timestamp = media.timestamp;
                    }
                });

                /* sort the entries by timestamp */
            entries.sortKey(function (e) {return e.timestamp || e.name;}, true);

            addEntries();
        });
    }

    if (mediaType == 'picture') {
        var zippedButton = $('<div class="media-dialog-button">Zipped</div>');
        buttonsDiv.append(zippedButton);

        zippedButton.click(function () {
            if (groupKey != null) {
                doDownloadZipped(cameraId, groupKey);
            }
        });

        var timelapseButton = $('<div class="media-dialog-button">Timelapse</div>');
        buttonsDiv.append(timelapseButton);

        timelapseButton.click(function () {
            if (groupKey != null) {
                runTimelapseDialog(cameraId, groupKey, groups[groupKey]);
            }
        });
    }

    if (isAdmin()) {
        var deleteAllButton = $('<div class="media-dialog-button media-dialog-delete-all-button">Delete All</div>');
        buttonsDiv.append(deleteAllButton);

        deleteAllButton.click(function () {
            if (groupKey != null) {
                doDeleteAllFiles(mediaType, cameraId, groupKey, function () {
                    /* delete th group button */
                    groupsDiv.find('div.media-dialog-group-button').each(function () {
                        var $this = $(this);
                        if (this.key == groupKey) {
                            $this.remove();
                        }
                    });

                    /* delete the group itself */
                    delete groups[groupKey];

                    /* show the first existing group, if any */
                    var keys = Object.keys(groups);
                    if (keys.length) {
                        showGroup(keys[0]);
                    }
                    else {
                        hideModalDialog();
                    }
                });
            }
        });
    }

    function updateDialogSize() {
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();

        if (Object.keys(groups).length == 0) {
            groupsDiv.width('auto');
            groupsDiv.height('auto');
            groupsDiv.addClass('small-screen');
            mediaListDiv.width('auto');
            mediaListDiv.height('auto');
            buttonsDiv.hide();

            return;
        }

        buttonsDiv.show();

        if (windowWidth < 1000) {
            mediaListDiv.width(windowWidth - 30);
            mediaListDiv.height(windowHeight - 140);
            groupsDiv.width(windowWidth - 30);
            groupsDiv.height('');
            groupsDiv.addClass('small-screen');
        }
        else {
            mediaListDiv.width(parseInt(windowWidth * 0.7));
            mediaListDiv.height(parseInt(windowHeight * 0.7));
            groupsDiv.height(parseInt(windowHeight * 0.7));
            groupsDiv.width('');
            groupsDiv.removeClass('small-screen');
        }
    }

    function onResize() {
        updateDialogSize();
        updateModalDialogPosition();
    }

    $(window).resize(onResize);

    updateDialogSize();

    showModalDialog('<div class="modal-progress"></div>');

    /* fetch the media list */
    ajax('GET', basePath + mediaType + '/' + cameraId + '/list/', null, function (data) {
        if (data == null || data.error) {
            hideModalDialog();
            showErrorMessage(data && data.error);
            return;
        }

        /* group the media */
        data.mediaList.forEach(function (media) {
            var path = media.path;
            var parts = path.split('/');
            var keyParts = parts.splice(0, parts.length - 1);
            var key = keyParts.join('/');

            if (key.indexOf('/') === 0) {
                key = key.substring(1);
            }

            var list = (groups[key] = groups[key] || []);

            list.push({
                'path': path,
                'group': key,
                'name': parts[parts.length - 1],
                'cameraId': cameraId
            });
        });

        updateDialogSize();

        var keys = Object.keys(groups);
        keys.sort();
        keys.reverse();

        if (keys.length) {
            keys.forEach(function (key) {
                var groupButton = $('<div class="media-dialog-group-button"></div>');
                groupButton.text((key || '(ungrouped)') + ' (' + groups[key].length + ')');
                groupButton[0].key = key;

                groupButton.click(function () {
                    showGroup(key);
                });

                groupsDiv.append(groupButton);
            });

            /* add tooltips to larger group buttons */
            setTimeout(function () {
                groupsDiv.find('div.media-dialog-group-button').each(function () {
                    if (this.scrollWidth > this.offsetWidth) {
                        this.title = this.innerHTML;
                    }
                });
            }, 10);
        }
        else {
            groupsDiv.html('(no media files)');
            mediaListDiv.remove();
        }

        var title;
        if ($(window).width() < 1000) {
            title = data.cameraName;
        }
        else if (mediaType === 'picture') {
            title = 'Pictures taken by ' + data.cameraName;
        }
        else {
            title = 'Movies recorded by ' + data.cameraName;
        }

        runModalDialog({
            title: title,
            closeButton: true,
            buttons: '',
            content: dialogDiv,
            onShow: function () {
                //dialogDiv.scrollTop(dialogDiv.prop('scrollHeight'));
                if (keys.length) {
                    showGroup(keys[0]);
                }
            },
            onClose: function () {
                $(window).unbind('resize', onResize);
            }
        });
    });

    /* install the media list scroll event handler */
    mediaListDiv.scroll(function () {
        var height = mediaListDiv.height();

        mediaListDiv.find('img.media-list-preview').each(function () {
            if (!this._src) {
                return;
            }

            var $this = $(this);
            var entryDiv = $this.parent();

            var top1 = entryDiv.position().top;
            var top2 = top1 + entryDiv.height();

            if ((top1 >= 0 && top1 <= height) ||
                (top2 >= 0 && top2 <= height)) {

                this.src = this._src;
                delete this._src;
            }
        });
    });
}