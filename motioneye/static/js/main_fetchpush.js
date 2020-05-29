/* fetch & push */

function fetchCurrentConfig(onFetch) {
    function fetchCameraList() {
        /* fetch the camera list */
        ajax('GET', basePath + 'config/list/', null, function (data) {
            if (data == null || data.error) {
                showErrorMessage(data && data.error);
                data = {cameras: []};
                if (onFetch) {
                    onFetch(null);
                }
            }

            initialConfigFetched = true;

            var i, cameras = data.cameras;

            /* filter shown cameras by query */
            var query = splitUrl().params;
            if (query.camera_ids) {
                var cameraIds = query.camera_ids.split(',');
                cameras = cameras.filter(function (c){
                    return cameraIds.indexOf(String(c.id)) >= 0;
                });
            }

            if (isAdmin()) {
                var cameraSelect = $('#cameraSelect');
                cameraSelect.html('');
                for (i = 0; i < cameras.length; i++) {
                    var camera = cameras[i];
                    cameraSelect.append('<option value="' + camera['id'] + '">' + camera['name'] + '</option>');
                }

                if (!query.camera_ids) {
                    cameraSelect.append('<option value="add">add camera...</option>');
                }

                var enabledCameras = cameras.filter(function (camera) {return camera['enabled'];});
                if (enabledCameras.length > 0) { /* prefer the first enabled camera */
                    cameraSelect[0].selectedIndex = cameras.indexOf(enabledCameras[0]);
                    fetchCurrentCameraConfig(onFetch);
                }
                else if (cameras.length) { /* only disabled cameras */
                    cameraSelect[0].selectedIndex = 0;
                    fetchCurrentCameraConfig(onFetch);
                }
                else { /* no camera at all */
                    cameraSelect[0].selectedIndex = -1;

                    if (onFetch) {
                        onFetch(data);
                    }
                }

                updateConfigUI();
            }
            else { /* normal user */
                if (!cameras.length) {
                    /* normal user with no cameras doesn't make too much sense - force login */
                    doLogout();
                }

                $('#cameraSelect').hide();
                $('#remCameraButton').hide();

                if (onFetch) {
                    onFetch(data);
                }
            }

            var mainLoadingProgressImg = $('img.main-loading-progress');
            if (mainLoadingProgressImg.length) {
                mainLoadingProgressImg.animate({'opacity': 0}, 200, function () {
                    recreateCameraFrames(cameras);
                    mainLoadingProgressImg.remove();
                });
            }
            else {
                recreateCameraFrames(cameras);
            }
        });
    }

    /* add a progress indicator */
    var pageContainer = getPageContainer();
    if (!pageContainer.children('img.main-loading-progress').length) {
        pageContainer.append('<img class="main-loading-progress" src="' + staticPath + 'img/main-loading-progress.gif">');
    }

    /* fetch the prefs */
    ajax('GET', basePath + 'prefs/', null, function (data) {
        if (data == null || data.error) {
            showErrorMessage(data && data.error);
            return;
        }

        dict2PrefsUi(data);
        applyPrefs(data);

        if (isAdmin()) {
            /* fetch the main configuration */
            ajax('GET', basePath + 'config/main/get/', null, function (data) {
                if (data == null || data.error) {
                    showErrorMessage(data && data.error);
                    return;
                }

                dict2MainUi(data);
                fetchCameraList();
            });
        }
        else {
            fetchCameraList();
        }
    });
}

function fetchCurrentCameraConfig(onFetch) {
    var cameraId = $('#cameraSelect').val();
    if (cameraId != null) {
        ajax('GET', basePath + 'config/' + cameraId + '/get/?force=true', null, function (data) {
            if (data == null || data.error) {
                showErrorMessage(data && data.error);
                dict2CameraUi(null);
                if (onFetch) {
                    onFetch(null);
                }

                return;
            }

            dict2CameraUi(data);
            if (onFetch) {
                onFetch(data);
            }
        });
    }
    else {
        dict2CameraUi({});
        if (onFetch) {
            onFetch({});
        }
    }
}

function pushMainConfig(reboot) {
    if (!initialConfigFetched) {
        return;
    }

    var mainConfig = mainUi2Dict();

    pushConfigReboot = pushConfigReboot || reboot;
    pushConfigs['main'] = mainConfig;
    if (!isApplyVisible()) {
        showApply();
    }
}

function pushCameraConfig(reboot) {
    if (!initialConfigFetched) {
        return;
    }

    var cameraId = $('#cameraSelect').val();
    if (!cameraId) {
        return; /* event triggered without a selected camera */
    }

    var cameraConfig = cameraUi2Dict();

    pushConfigReboot = pushConfigReboot || reboot;
    pushConfigs[cameraId] = cameraConfig;
    if (!isApplyVisible()) {
        showApply();
    }

    /* also update the config stored in the camera frame div */
    var cameraFrame = getCameraFrame(cameraId);
    if (cameraFrame.length) {
        Object.update(cameraFrame[0].config, cameraConfig);
    }
}

function getCameraIdsByInstance() {
    /* a motion instance is identified by the (host, port) pair;
        * the local instance has both the host and the port set to empty string */

    var cameraIdsByInstance = {};
    getCameraFrames().each(function () {
        var instance;
        if (this.config.proto == 'netcam' || this.config.proto == 'v4l2' || this.config.proto == 'mmal') {
            instance = '';
        }
        else if (this.config.proto == 'motioneye') {
            instance = this.config.host || '';
            if (this.config.port) {
                instance += ':' + this.config.port;
            }
        }
        else { /* assuming simple mjpeg camera */
            return;
        }

        (cameraIdsByInstance[instance] = cameraIdsByInstance[instance] || []).push(this.config.id);
    });

    return cameraIdsByInstance;
}

function getCameraIds() {
    return getCameraFrames().map(function () {
        return this.config.id;
    }).toArray();
}