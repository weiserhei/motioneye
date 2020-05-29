var USERNAME_COOKIE = 'meye_username';
var PASSWORD_COOKIE = 'meye_password_hash';
var CAMERA_FRAMES_CACHE_LIFETIME = 1000;

var pushConfigs = {};
var pushConfigReboot = false;
var adminPasswordChanged = {};
var normalPasswordChanged = {};
var refreshDisabled = {}; /* dictionary indexed by cameraId, tells if refresh is disabled for a given camera */
var fullScreenCameraId = null;
var inProgress = false;
var refreshInterval = 15; /* milliseconds */
var framerateFactor = 1;
var resolutionFactor = 1;
var username = '';
var passwordHash = '';
var basePath = null;
var signatureRegExp = new RegExp('[^A-Za-z0-9/?_.=&{}\\[\\]":, -]', 'g');
var deviceNameValidRegExp = new RegExp('^[A-Za-z0-9\-\_\+\ ]+$');
var filenameValidRegExp = new RegExp('^([A-Za-z0-9 \(\)/._-]|%[CYmdHMSqv])+$');
var dirnameValidRegExp = new RegExp('^[A-Za-z0-9 \(\)/._-]+$');
var emailValidRegExp = new RegExp('^[A-Za-z0-9 _+.@^~<>,-]+$');
var initialConfigFetched = false; /* used to workaround browser extensions that trigger stupid change events */
var pageContainer = null;
var overlayVisible = false;
var layoutColumns = 1;
var fitFramesVertically = false;
var layoutRows = 1;
var modalContainer = null;
var cameraFramesCached = null;
var cameraFramesTime = 0;
var qualifyURLElement;

/* startup function */

$(document).ready(function () {
    modalContainer = $('div.modal-container');
    qualifyURLElement = document.createElement('a');

    /* detect base path */
    if (frame) {
        window.basePath = qualifyPath('../../../');

    }
    else {
        window.basePath = splitUrl(qualifyPath('')).baseUrl;

        /* restore the username from cookie */
        window.username = getCookie(USERNAME_COOKIE);
        window.passwordHash = getCookie(PASSWORD_COOKIE);
    }

    /* open/close settings */
    $('div.settings-button').click(function () {
        if (isSettingsOpen()) {
            closeSettings();
        }
        else {
            openSettings();
        }
    });

    initUI();
    beginProgress();

    ajax('GET', basePath + 'login/', null, function () {
        if (!frame) {
            fetchCurrentConfig(endProgress);
        }
    });

    refreshCameraFrames();
    checkCameraErrors();

    $(window).resize(function () {
        updateLayout();
    });
});
