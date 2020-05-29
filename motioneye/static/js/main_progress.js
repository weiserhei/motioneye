/* progress */

function beginProgress(cameraIds) {
    if (inProgress) {
        return; /* already in progress */
    }

    inProgress = true;

    /* replace the main page message with a progress indicator */
    $('div.add-camera-message').replaceWith('<img class="main-loading-progress" src="' + staticPath + 'img/main-loading-progress.gif">');

    /* show the apply button progress indicator */
    $('#applyButton').html('<img class="apply-progress" src="' + staticPath + 'img/apply-progress.gif">');

    /* show the camera progress indicators */
    if (cameraIds) {
        cameraIds.forEach(function (cameraId) {
            getCameraProgress(cameraId).addClass('visible');
        });
    }
    else {
        getCameraProgresses().addClass('visible');
    }

    /* remove the settings progress lock */
    $('div.settings-progress').css('width', '100%').css('opacity', '0.9');
}

function endProgress() {
    if (!inProgress) {
        return; /* not in progress */
    }

    inProgress = false;

    /* deal with the apply button */
    if (Object.keys(pushConfigs).length === 0) {
        hideApply();
    }
    else {
        showApply();
    }

    /* hide the settings progress lock */
    $('div.settings-progress').css('opacity', '0');

    /* hide the camera progress indicator */
    getCameraProgresses().removeClass('visible');

    setTimeout(function () {
        $('div.settings-progress').css('width', '0px');
    }, 500);
}

function downloadFile(path) {
    path = basePath + path;

    var url = window.location.href;
    var parts = url.split('/');
    url = parts.slice(0, 3).join('/') + path;
    url = addAuthParams('GET', url);

    /* download the file by creating a temporary iframe */
    var frame = $('<iframe style="display: none;"></iframe>');
    frame.attr('src', url);
    $('body').append(frame);
}

function uploadFile(path, input, callback) {
    if (!window.FormData) {
        showErrorMessage("Your browser doesn't implement this function!");
        callback();
    }

    var formData = new FormData();
    var files = input[0].files;
    formData.append('files', files[0], files[0].name);

    ajax('POST', path, formData, callback);
}


    /* apply button */

function showApply() {
    var applyButton = $('#applyButton');

    applyButton.html('Apply');
    applyButton.css('display', 'inline-block');
    applyButton.removeClass('progress');
    setTimeout(function () {
        applyButton.css('opacity', '1');
    }, 10);
}

function hideApply() {
    var applyButton = $('#applyButton');

    applyButton.css('opacity', '0');
    applyButton.removeClass('progress');

    setTimeout(function () {
        applyButton.css('display', 'none');
    }, 500);
}

function isApplyVisible() {
    var applyButton = $('#applyButton');

    return applyButton.is(':visible');
}

function doApply() {
    if (!configUiValid()) {
        runAlertDialog('Make sure all the configuration options are valid!');
        return;
    }

    function actualApply() {
        var cameraIdsByInstance = getCameraIdsByInstance();

        /* gather the affected motion instances */
        var affectedInstances = {};

        Object.keys(pushConfigs).forEach(function (key) {
            if (key == 'main') {
                return;
            }

            /* key is a camera id */
            Object.keys(cameraIdsByInstance).forEach(function (instance) {
                var cameraIds = cameraIdsByInstance[instance];
                if (cameraIds.indexOf(parseInt(key)) >= 0) {
                    affectedInstances[instance] = true;
                }
            });
        });

        affectedInstances = Object.keys(affectedInstances);

        /* compute the affected camera ids */
        var affectedCameraIds = [];

        affectedInstances.forEach(function (instance) {
            affectedCameraIds = affectedCameraIds.concat(cameraIdsByInstance[instance] || []);
        });

        beginProgress(affectedCameraIds);
        affectedCameraIds.forEach(function (cameraId) {
            refreshDisabled[cameraId] |= 0;
            refreshDisabled[cameraId]++;
        });

        ajax('POST', basePath + 'config/0/set/', pushConfigs, function (data) {
            affectedCameraIds.forEach(function (cameraId) {
                refreshDisabled[cameraId]--;
            });

            if (data == null || data.error) {
                endProgress();
                showErrorMessage(data && data.error);
                return;
            }

            /* reset password change flags */
            adminPasswordChanged = {};
            normalPasswordChanged = {};

            if (data.reboot) {
                var count = 0;
                function checkServerReboot() {
                    ajax('GET', basePath + 'config/0/get/', null,
                        function () {
                            window.location.reload(true);
                        },
                        function () {
                            if (count < 25) {
                                count += 1;
                                setTimeout(checkServerReboot, 2000);
                            }
                            else {
                                window.location.reload(true);
                            }
                        }
                    );
                }

                setTimeout(checkServerReboot, 15000);

                return;
            }

            if (data.reload) {
                window.location.reload(true);
                return;
            }

            /* update the camera name in the device select
             * and frame title bar */
            Object.keys(pushConfigs).forEach(function (key) {
                var config = pushConfigs[key];
                if (config.key !== 'main') {
                    $('#cameraSelect').find('option[value=' + key + ']').html(config.name);
                }

                $('#camera' + key).find('span.camera-name').html(config.name);
            });

            pushConfigs = {};
            pushConfigReboot = false;
            endProgress();
            recreateCameraFrames(); /* a camera could have been disabled */
        });
    }

    if (pushConfigReboot) {
        runConfirmDialog('This will reboot the system. Continue?', function () {
            actualApply();
        });
    }
    else {
        actualApply();
    }
}

function doShutDown() {
    runConfirmDialog('Really shut down?', function () {
        ajax('POST', basePath + 'power/shutdown/');
        setTimeout(function () {
            refreshInterval = 1000000;
            showModalDialog('<div class="modal-progress"></div>');

            function checkServer() {
                ajax('GET', basePath, null,
                    function () {
                        setTimeout(checkServer, 1000);
                    },
                    function () {
                        showModalDialog('Powered Off');
                        setTimeout(function () {
                            $('div.modal-glass').animate({'opacity': '1', 'background-color': '#212121'}, 200);
                        },100);
                    },
                    10000 /* timeout = 10s */
                );
            }

            checkServer();
        }, 10);
    });
}

function doReboot() {
    runConfirmDialog('Really reboot?', function () {
        ajax('POST', basePath + 'power/reboot/');
        setTimeout(function () {
            refreshInterval = 1000000;
            showModalDialog('<div class="modal-progress"></div>');
            var shutDown = false;

            function checkServer() {
                ajax('GET', basePath, null,
                    function () {
                        if (!shutDown) {
                            setTimeout(checkServer, 1000);
                        }
                        else {
                            runAlertDialog('The system has been rebooted!', function () {
                                window.location.reload(true);
                            });
                        }
                    },
                    function () {
                        shutDown = true; /* the first error indicates the system was shut down */
                        setTimeout(checkServer, 1000);
                    },
                    5 * 1000 /* timeout = 5s */
                );
            }

            checkServer();
        }, 10);
    });
}

function doRemCamera() {
    if (Object.keys(pushConfigs).length) {
        return runAlertDialog('Please apply the modified settings first!');
    }

    var cameraId = $('#cameraSelect').val();
    if (cameraId == null || cameraId === 'add') {
        runAlertDialog('No camera to remove!');
        return;
    }

    var deviceName = $('#cameraSelect').find('option[value=' + cameraId + ']').text();

    runConfirmDialog('Remove camera ' + deviceName + '?', function () {
        /* disable further refreshing of this camera */
        var img = $('div.camera-frame#camera' + cameraId).find('img.camera');
        if (img.length) {
            img[0].loading_count = 1;
        }

        beginProgress();
        ajax('POST', basePath + 'config/' + cameraId + '/rem/', null, function (data) {
            if (data == null || data.error) {
                endProgress();
                showErrorMessage(data && data.error);
                return;
            }

            fetchCurrentConfig(endProgress);
        });
    });
}

function doUpdate() {
    if (Object.keys(pushConfigs).length) {
        return runAlertDialog('Please apply the modified settings first!');
    }

    showModalDialog('<div class="modal-progress"></div>');
    ajax('GET', basePath + 'update/', null, function (data) {
        if (data.update_version == null) {
            runAlertDialog('motionEye is up to date (current version: ' + data.current_version + ')');
        }
        else {
            runConfirmDialog('New version available: ' + data.update_version + '. Update?', function () {
                refreshInterval = 1000000;
                showModalDialog('<div style="text-align: center;"><span>Updating. This may take a few minutes.</span><div class="modal-progress"></div></div>');
                ajax('POST', basePath + 'update/?version=' + data.update_version, null, function () {
                    var count = 0;
                    function checkServer() {
                        ajax('GET', basePath + 'config/0/get/', null,
                            function () {
                                runAlertDialog('motionEye was successfully updated!', function () {
                                    window.location.reload(true);
                                });
                            },
                            function () {
                                if (count < 60) {
                                    count += 1;
                                    setTimeout(checkServer, 5000);
                                }
                                else {
                                    runAlertDialog('Update failed!', function () {
                                        window.location.reload(true);
                                    });
                                }
                            }
                        );
                    }

                    setTimeout(checkServer, 15000);

                }, function (e) { /* error */
                    runAlertDialog('The update process has failed!', function () {
                        window.location.reload(true);
                    });
                });

                return false; /* prevents hiding the modal container */
            });
        }
    });
}

function doBackup() {
    downloadFile('config/backup/');
}

function doRestore() {
    var content =
            $('<table class="restore-dialog">' +
                '<tr>' +
                    '<td class="dialog-item-label"><span class="dialog-item-label">Backup File</span></td>' +
                    '<td class="dialog-item-value"><form><input type="file" class="styled" id="fileInput"></form></td>' +
                    '<td><span class="help-mark" title="the backup file you have previously downloaded">?</span></td>' +
                '</tr>' +
            '</table>');

    /* collect ui widgets */
    var fileInput = content.find('#fileInput');

    /* make validators */
    makeFileValidator(fileInput, true);

    function uiValid() {
        /* re-validate all the validators */
        content.find('.validator').each(function () {
            this.validate();
        });

        var valid = true;
        var query = content.find('input, select');
        query.each(function () {
            if (this.invalid) {
                valid = false;
                return false;
            }
        });

        return valid;
    }

    runModalDialog({
        title: 'Restore Configuration',
        closeButton: true,
        buttons: 'okcancel',
        content: content,
        onOk: function () {
            if (!uiValid(true)) {
                return false;
            }

            refreshInterval = 1000000;

            setTimeout(function () {
                showModalDialog('<div style="text-align: center;"><span>Restoring configuration...</span><div class="modal-progress"></div></div>');
                uploadFile(basePath + 'config/restore/', fileInput, function (data) {
                    if (data && data.ok) {
                        var count = 0;
                        function checkServer() {
                            ajax('GET', basePath + 'config/0/get/', null,
                                function () {
                                    runAlertDialog('The configuration has been restored!', function () {
                                        window.location.reload(true);
                                    });
                                },
                                function () {
                                    if (count < 25) {
                                        count += 1;
                                        setTimeout(checkServer, 2000);
                                    }
                                    else {
                                        runAlertDialog('Failed to restore the configuration!', function () {
                                            window.location.reload(true);
                                        });
                                    }
                                }
                            );
                        }

                        if (data.reboot) {
                            setTimeout(checkServer, 15000);
                        }
                        else {
                            setTimeout(function () {
                                window.location.reload();
                            }, 5000);
                        }
                    }
                    else {
                        hideModalDialog();
                        showErrorMessage('Failed to restore the configuration!');
                    }
                });
            }, 10);
        }
    });
}

function doTestUpload() {
    var q = $('#uploadPortEntry, #uploadLocationEntry, #uploadServerEntry');
    var valid = true;
    q.each(function() {
        this.validate();
        if (this.invalid) {
            valid = false;
        }
    });

    if (!valid) {
        return runAlertDialog('Make sure all the configuration options are valid!');
    }

    showModalDialog('<div class="modal-progress"></div>', null, null, true);

    var data = {
        what: 'upload_service',
        service: $('#uploadServiceSelect').val(),
        server: $('#uploadServerEntry').val(),
        port: $('#uploadPortEntry').val(),
        method: $('#uploadMethodSelect').val(),
        location: $('#uploadLocationEntry').val(),
        subfolders: $('#uploadSubfoldersSwitch')[0].checked,
        username: $('#uploadUsernameEntry').val(),
        password: $('#uploadPasswordEntry').val(),
        authorization_key: $('#uploadAuthorizationKeyEntry').val()
    };

    var cameraId = $('#cameraSelect').val();

    ajax('POST', basePath + 'config/' + cameraId + '/test/', data, function (data) {
        /* clear the authorization key as it's definitely not usable anymore;
         * the credentials must have already been obtained and saved */
        $('#uploadAuthorizationKeyEntry').val('');

        /* also clear it from the pending configs dict */
        Object.keys(pushConfigs).forEach(function (id) {
            delete pushConfigs[id].upload_authorization_key;
        });

        hideModalDialog(); /* progress */
        if (data.error) {
            showErrorMessage('Accessing the upload service failed: ' + data.error + '!');
        }
        else {
            showPopupMessage('Accessing the upload service succeeded!', 'info');
        }
    });
}

function doTestEmail() {
    var q = $('#emailAddressesEntry, #smtpServerEntry, #smtpPortEntry');
    var valid = true;
    q.each(function() {
        this.validate();
        if (this.invalid) {
            valid = false;
        }
    });

    if (!valid) {
        return runAlertDialog('Make sure all the configuration options are valid!');
    }

    showModalDialog('<div class="modal-progress"></div>', null, null, true);

    var data = {
        what: 'email',
        from: $('#emailFromEntry').val(),
        addresses: $('#emailAddressesEntry').val(),
        smtp_server: $('#smtpServerEntry').val(),
        smtp_port: $('#smtpPortEntry').val(),
        smtp_account: $('#smtpAccountEntry').val(),
        smtp_password: $('#smtpPasswordEntry').val(),
        smtp_tls: $('#smtpTlsSwitch')[0].checked
    };

    var cameraId = $('#cameraSelect').val();

    ajax('POST', basePath + 'config/' + cameraId + '/test/', data, function (data) {
        hideModalDialog(); /* progress */
        if (data.error) {
            showErrorMessage('Notification email failed: ' + data.error + '!');
        }
        else {
            showPopupMessage('Notification email succeeded!', 'info');
        }
    });
}

function doTestNetworkShare() {
    var q = $('#networkServerEntry, #networkShareNameEntry, #rootDirectoryEntry');
    var valid = true;
    q.each(function() {
        this.validate();
        if (this.invalid) {
            valid = false;
        }
    });

    if (!valid) {
        return runAlertDialog('Make sure all the configuration options are valid!');
    }

    showModalDialog('<div class="modal-progress"></div>', null, null, true);

    var data = {
        what: 'network_share',
        server: $('#networkServerEntry').val(),
        share: $('#networkShareNameEntry').val(),
        smb_ver: $('#networkSMBVerSelect').val(),
        username: $('#networkUsernameEntry').val(),
        password: $('#networkPasswordEntry').val(),
        root_directory: $('#rootDirectoryEntry').val()
    };

    var cameraId = $('#cameraSelect').val();

    ajax('POST', basePath + 'config/' + cameraId + '/test/', data, function (data) {
        hideModalDialog(); /* progress */
        if (data.error) {
            showErrorMessage('Accessing network share failed: ' + data.error + '!');
        }
        else {
            showPopupMessage('Accessing network share succeeded!', 'info');
        }
    });
}

function doDownloadZipped(cameraId, groupKey) {
    showModalDialog('<div class="modal-progress"></div>', null, null, true);
    ajax('GET', basePath + 'picture/' + cameraId + '/zipped/' + groupKey + '/', null, function (data) {
        if (data.error) {
            hideModalDialog(); /* progress */
            showErrorMessage(data.error);
        }
        else {
            hideModalDialog(); /* progress */
            downloadFile('picture/' + cameraId + '/zipped/' + groupKey + '/?key=' + data.key);
        }
    });
}

function doDeleteFile(path, callback) {
    var url = window.location.href;
    var parts = url.split('/');
    url = parts.slice(0, 3).join('/') + path;

    runConfirmDialog('Really delete this file?', function () {
        showModalDialog('<div class="modal-progress"></div>', null, null, true);
        ajax('POST', url, null, function (data) {
            hideModalDialog(); /* progress */
            hideModalDialog(); /* confirm */

            if (data == null || data.error) {
                showErrorMessage(data && data.error);
                return;
            }

            if (callback) {
                callback();
            }
        });

        return false;
    }, {stack: true});
}

function doDeleteAllFiles(mediaType, cameraId, groupKey, callback) {
    var msg;
    if (groupKey) {
        if (mediaType == 'picture') {
            msg = 'Really delete all pictures from "%(group)s"?'.format({group: groupKey});
        }
        else {
            msg = 'Really delete all movies from "%(group)s"?'.format({group: groupKey});
        }
    }
    else {
        if (mediaType == 'picture') {
            msg = 'Really delete all ungrouped pictures?';
        }
        else {
            msg = 'Really delete all ungrouped movies?';
        }
    }

    runConfirmDialog(msg, function () {
        showModalDialog('<div class="modal-progress"></div>', null, null, true);
        if (groupKey) {
            groupKey += '/';
        }
        ajax('POST', basePath + mediaType + '/' + cameraId + '/delete_all/' + groupKey, null, function (data) {
            hideModalDialog(); /* progress */
            hideModalDialog(); /* confirm */

            if (data == null || data.error) {
                showErrorMessage(data && data.error);
                return;
            }

            if (callback) {
                callback();
            }
        });

        return false;
    }, {stack: true});
}

function doAction(cameraId, action, callback) {
    ajax('POST', basePath + 'action/' + cameraId + '/' + action + '/', null, function (data) {
        if (data == null || data.error) {
            showErrorMessage(data && data.error);
        }

        if (callback) {
            callback();
        }
    });
}

function showUrl(url) {
    var span = $('<span class="url-message-span"></span>');
    span.html(url);
    runAlertDialog(span);

    var range, selection;
    if (window.getSelection && document.createRange) {
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(span[0]);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    else if (document.selection && document.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(span[0]);
        range.select();
    }
}

function showSnapshotUrl() {
    var url = $('#streamingSnapshotUrlHtml').data('url');
    showUrl(url);
}

function showMjpgUrl() {
    var url = $('#streamingMjpgUrlHtml').data('url');
    showUrl(url);
}

function showEmbedUrl() {
    var url = $('#streamingEmbedUrlHtml').data('url');
    showUrl(url);
}