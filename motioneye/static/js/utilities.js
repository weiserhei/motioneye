/* Object utilities */

Object.keys = Object.keys || (function () {
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString');
    var dontEnums = [
        'toString',
        'toLocaleString',
        'valueOf',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'constructor'
    ];
    var dontEnumsLength = dontEnums.length;

    return function (obj) {
        if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) {
            return [];
        }

        var result = [];
        for (var prop in obj) {
            if (hasOwnProperty.call(obj, prop)) {
                result.push(prop);
            }
        }

        if (hasDontEnumBug) {
            for (var i = 0; i < dontEnumsLength; i++) {
                if (hasOwnProperty.call(obj, dontEnums[i])) {
                    result.push(dontEnums[i]);
                }
            }
        }

        return result;
    };
})();

Object.values = function (obj) {
    return Object.keys(obj).map(function (k) {return obj[k];});
};

Object.update = function (dest, source) {
    for (var key in source) {
        if (!source.hasOwnProperty(key)) {
            continue;
        }

        dest[key] = source[key];
    }
};


/* Array utilities */

Array.prototype.indexOf = Array.prototype.indexOf || function (obj) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === obj) {
            return i;
        }
    }

    return -1;
};

Array.prototype.forEach = Array.prototype.forEach || function (callback, thisArg) {
    for (var i = 0; i < this.length; i++) {
        callback.call(thisArg, this[i], i, this);
    }
};

Array.prototype.every = Array.prototype.every || function (callback, thisArg) {
    for (var i = 0; i < this.length; i++) {
        if (!callback.call(thisArg, this[i], i, this)) {
            return false;
        }
    }

    return true;
};

Array.prototype.some = Array.prototype.some || function (callback, thisArg) {
    for (var i = 0; i < this.length; i++) {
        if (callback.call(thisArg, this[i], i, this)) {
            return true;
        }
    }

    return false;
};

Array.prototype.unique = function (callback, thisArg) {
    var uniqueElements = [];
    this.forEach(function (element) {
        if (uniqueElements.indexOf(element, Utils.equals) === -1) {
            uniqueElements.push(element);
        }
    });

    return uniqueElements;
};

Array.prototype.filter = function (func, thisArg) {
    var filtered = [];
    for (var i = 0; i < this.length; i++) {
        if (func.call(thisArg, this[i], i, this)) {
            filtered.push(this[i]);
        }
    }

    return filtered;
};

Array.prototype.map = function (func, thisArg) {
    var mapped = [];
    for (var i = 0; i < this.length; i++) {
        mapped.push(func.call(thisArg, this[i], i, this));
    }

    return mapped;
};

Array.prototype.sortKey = function (keyFunc, reverse) {
    this.sort(function (e1, e2) {
        var k1 = keyFunc(e1);
        var k2 = keyFunc(e2);

        if ((k1 < k2 && !reverse) || (k1 > k2 && reverse)) {
            return -1;
        }
        else if ((k1 > k2 && !reverse) || (k1 < k2 && reverse)) {
            return 1;
        }
        else {
            return 0;
        }
    });
};


/* String utilities */

String.prototype.startsWith = String.prototype.startsWith || function (str) {
    return (this.substr(0, str.length) === str);
};

String.prototype.endsWith = String.prototype.endsWith || function (str) {
    return (this.substr(this.length - str.length) === str);
};

String.prototype.trim = String.prototype.trim || function () {
    return this.replace(new RegExp('^\\s*'), '').replace(new RegExp('\\s*$'), '');
};

String.prototype.replaceAll = String.prototype.replaceAll || function (oldStr, newStr) {
    var p, s = this;
    while ((p = s.indexOf(oldStr)) >= 0) {
        s = s.substring(0, p) + newStr + s.substring(p + oldStr.length, s.length);
    }

    return s.toString();
};

String.prototype.format = function () {
    var text = this;

    var rex = new RegExp('%[sdf]');
    var match, i = 0;
    while (match = text.match(rex)) {
        text = text.substring(0, match.index) + arguments[i] + text.substring(match.index + 2);
        i++;
    }

    if (i) { /* %s format used */
        return text;
    }

    var keywords = arguments[0];

    for (var key in keywords) {
        text = text.replace('%(' + key + ')s', "" + keywords[key]);
        text = text.replace('%(' + key + ')d', "" + keywords[key]);
        text = text.replace('%(' + key + ')f', "" + keywords[key]);
    }

    return text;
};


/* misc utilities */

var sha1 = (function () {
    var K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
    var P = Math.pow(2, 32);

    function hash(msg) {
        msg += String.fromCharCode(0x80);

        var l = msg.length / 4 + 2;
        var N = Math.ceil(l / 16);
        var M = new Array(N);

        for (var i = 0; i < N; i++) {
            M[i] = new Array(16);
            for (var j = 0; j < 16; j++) {
                M[i][j] = (msg.charCodeAt(i * 64 + j * 4) << 24) | (msg.charCodeAt(i * 64 + j * 4 + 1) << 16) |
                (msg.charCodeAt(i * 64 + j * 4 + 2) << 8) | (msg.charCodeAt(i * 64 + j * 4 + 3));
            }
        }
        M[N - 1][14] = Math.floor(((msg.length - 1) * 8) / P);
        M[N - 1][15] = ((msg.length - 1) * 8) & 0xffffffff;

        var H0 = 0x67452301;
        var H1 = 0xefcdab89;
        var H2 = 0x98badcfe;
        var H3 = 0x10325476;
        var H4 = 0xc3d2e1f0;

        var W = new Array(80);
        var a, b, c, d, e;
        for (i = 0; i < N; i++) {
            for (var t = 0; t < 16; t++) W[t] = M[i][t];
            for (t = 16; t < 80; t++) W[t] = ROTL(W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16], 1);

            a = H0; b = H1; c = H2; d = H3; e = H4;

            for (var t = 0; t < 80; t++) {
                var s = Math.floor(t / 20);
                var T = (ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t]) & 0xffffffff;
                e = d;
                d = c;
                c = ROTL(b, 30);
                b = a;
                a = T;
            }

            H0 = (H0 + a) & 0xffffffff;
            H1 = (H1 + b) & 0xffffffff;
            H2 = (H2 + c) & 0xffffffff;
            H3 = (H3 + d) & 0xffffffff;
            H4 = (H4 + e) & 0xffffffff;
        }

        return toHexStr(H0) + toHexStr(H1) + toHexStr(H2) + toHexStr(H3) + toHexStr(H4);
    }

    function f(s, x, y, z)  {
        switch (s) {
            case 0: return (x & y) ^ (~x & z);
            case 1: return x ^ y ^ z;
            case 2: return (x & y) ^ (x & z) ^ (y & z);
            case 3: return x ^ y ^ z;
        }
    }

    function ROTL(x, n) {
        return (x << n) | (x >>> (32 - n));
    }

    function toHexStr(n) {
        var s = "", v;
        for (var i = 7; i >= 0; i--) {
            v = (n >>> (i * 4)) & 0xf;
            s += v.toString(16);
        }
        return s;
    }

    return hash;
}());

function splitUrl(url) {
    if (!url) {
        url = window.location.href;
    }

    var parts = url.split('?');
    if (parts.length < 2 || parts[1].length === 0) {
        return {baseUrl: parts[0], params: {}};
    }

    var baseUrl = parts[0];
    var paramStr = parts[1];

    parts = paramStr.split('&');
    var params = {};

    for (var i = 0; i < parts.length; i++) {
        var pair = parts[i].split('=');
        params[pair[0]] = pair[1];
    }

    return {baseUrl: baseUrl, params: params};
}

function qualifyUrl(url) {
    qualifyURLElement.href = url;
    return qualifyURLElement.href;
}

function qualifyPath(path) {
    var url = qualifyUrl(path);
    var pos = url.indexOf('//');
    if (pos === -1) { /* not a full url */
        return url;
    }

    url = url.substring(pos + 2);
    pos = url.indexOf('/');
    if (pos === -1) { /* root with no trailing slash */
        return '';
    }

    return url.substring(pos);
}

function computeSignature(method, path, body) {
    path = qualifyPath(path);

    var parts = splitUrl(path);
    var query = parts.params;
    path = parts.baseUrl;
    path = '/' + path.substring(basePath.length);

    /* sort query arguments alphabetically */
    query = Object.keys(query).map(function (key) {return {key: key, value: decodeURIComponent(query[key])};});
    query = query.filter(function (q) {return q.key !== '_signature';});
    query.sortKey(function (q) {return q.key;});
    query = query.map(function (q) {return q.key + '=' + encodeURIComponent(q.value);}).join('&');
    path = path + '?' + query;
    path = path.replace(signatureRegExp, '-');
    body = body && body.replace(signatureRegExp, '-');

    return sha1(method + ':' + path + ':' + (body || '') + ':' + passwordHash).toLowerCase();
}

function addAuthParams(method, url, body) {
    if (!window.username) {
        return url;
    }

    if (url.indexOf('?') < 0) {
        url += '?';
    }
    else {
        url += '&';
    }

    url += '_username=' + window.username;
    if (window._loginDialogSubmitted) {
        url += '&_login=true';
        window._loginDialogSubmitted = false;
    }
    var signature = computeSignature(method, url, body);
    url += '&_signature=' + signature;

    return url;
}

function isAdmin() {
    return username === adminUsername;
}

function ajax(method, url, data, callback, error, timeout) {
    var origUrl = url;
    var origData = data;

    if (url.indexOf('?') < 0) {
        url += '?';
    }
    else {
        url += '&';
    }

    url += '_=' + new Date().getTime();

    var json = false;
    var processData = true;
    if (method == 'POST') {
        if (window.FormData && (data instanceof FormData)) {
            json = false;
            processData = false;
        }
        else if (typeof data == 'object') {
            data = JSON.stringify(data);
            json = true;
        }
    }
    else { /* assuming GET */
        if (data) {
            var query = $.param(data);
            /* $.param encodes spaces as "+" */
            query = query.replaceAll('+', '%20');
            url += '&' + query;
            data = null;
        }
    }

    url = addAuthParams(method, url, processData ? data : null);

    function onResponse(data) {
        if (data && data.error == 'unauthorized') {
            if (data.prompt) {
                runLoginDialog(function () {
                    ajax(method, origUrl, origData, callback, error);
                });
            }

            window._loginRetry = true;
        }
        else {
            delete window._loginRetry;
            if (callback) {
                $('body').toggleClass('admin', isAdmin());
                callback(data);
            }
        }
    }

    var options = {
        type: method,
        url: url,
        data: data,
        timeout: timeout || 300 * 1000,
        success: onResponse,
        contentType: json ? 'application/json' : false,
        processData: processData,
        error: error || function (request, options, error) {
            if (request.status == 403) {
                return onResponse(request.responseJSON);
            }

            showErrorMessage();
            if (callback) {
                callback();
            }
        }
    };

    $.ajax(options);
}

function getCookie(name) {
    var cookie = document.cookie + '';

    if (cookie.length <= 0) {
        return null;
    }

    var start = cookie.indexOf(name + '=');
    if (start == -1) {
        return null;
    }

    var start = start + name.length + 1;
    var end = cookie.indexOf(';', start);
    if (end == -1) {
        end = cookie.length;
    }

    return cookie.substring(start, end);
}

function setCookie(name, value, days) {
    var date, expires;
    if (days) {
        date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = 'expires=' + date.toGMTString();
    }
    else {
        expires = '';
    }

    document.cookie = name + '=' + value + '; ' + expires + '; path=/';
}

function showErrorMessage(message) {
    if (message == null || message == true) {
        message = 'An error occurred. Refreshing is recommended.';
    }

    showPopupMessage(message, 'error');
}

function doLogout() {
    setCookie(USERNAME_COOKIE, '_');
    window.location.reload(true);
}

function authorizeUpload() {
    var service = $('#uploadServiceSelect').val();
    var cameraId = $('#cameraSelect').val();
    var url = basePath + 'config/' + cameraId + '/authorize/?service=' + service;
    url = addAuthParams('GET', url);

    window.open(url, '_blank');
}
