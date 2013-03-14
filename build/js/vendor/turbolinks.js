(function() {
  var anchoredLink, assets, assetsChanged, browserCompatibleDocumentParser, browserSupportsPushState, cacheCurrentPage, changePage, constrainPageCacheTo, createDocument, crossOriginLink, currentState, executeScriptTags, extractAssets, extractLink, extractTitleAndBody, fetchHistory, fetchReplacement, handleClick, ignoreClick, initialized, installClickHandlerLast, intersection, noTurbolink, nonHtmlLink, nonStandardClick, pageCache, recallScrollPosition, referer, reflectNewUrl, reflectRedirectedUrl, rememberCurrentAssets, rememberCurrentState, rememberCurrentUrl, rememberInitialPage, resetScrollPosition, samePageLink, triggerEvent, visit,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  initialized = false;

  currentState = null;

  referer = document.location.href;

  assets = [];

  pageCache = [];

  createDocument = null;

  visit = function(url) {
    if (browserSupportsPushState) {
      cacheCurrentPage();
      reflectNewUrl(url);
      return fetchReplacement(url);
    } else {
      return document.location.href = url;
    }
  };

  fetchReplacement = function(url) {
    var xhr,
      _this = this;
    triggerEvent('page:fetch');
    xhr = new XMLHttpRequest;
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'text/html, application/xhtml+xml, application/xml');
    xhr.setRequestHeader('X-XHR-Referer', referer);
    xhr.onload = function() {
      var doc;
      doc = createDocument(xhr.responseText);
      if (assetsChanged(doc)) {
        return document.location.href = url;
      } else {
        changePage.apply(null, extractTitleAndBody(doc));
        reflectRedirectedUrl(xhr);
        resetScrollPosition();
        return triggerEvent('page:load');
      }
    };
    xhr.onabort = function() {
      return console.log('Aborted turbolink fetch!');
    };
    return xhr.send();
  };

  fetchHistory = function(state) {
    var page;
    cacheCurrentPage();
    if (page = pageCache[state.position]) {
      changePage(page.title, page.body, page.breadcrumbs);
      recallScrollPosition(page);
      return triggerEvent('page:restore');
    } else {
      return fetchReplacement(document.location.href);
    }
  };

  cacheCurrentPage = function() {
    rememberInitialPage();
    pageCache[currentState.position] = {
      url: document.location.href,
      body: document.getElementById('doc-body'),
      breadcrumbs: document.getElementById('breadcrumbs'),
      title: document.title,
      positionY: window.pageYOffset,
      positionX: window.pageXOffset
    };
    return constrainPageCacheTo(10);
  };

  constrainPageCacheTo = function(limit) {
    return delete pageCache[currentState.position - limit];
  };

  changePage = function(title, body, breadcrumbs) {
    document.title = title;
    document.getElementById('doc-body').parentNode.replaceChild(body, document.getElementById('doc-body'));
    document.getElementById('breadcrumbs').parentNode.replaceChild(breadcrumbs, document.getElementById('breadcrumbs'));
    executeScriptTags();
    currentState = window.history.state;
    return triggerEvent('page:change');
  };

  executeScriptTags = function() {
    var script, _i, _len, _ref, _ref1, _results;
    _ref = document.body.getElementsByTagName('script');
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      script = _ref[_i];
      if ((_ref1 = script.type) === '' || _ref1 === 'text/javascript') {
        _results.push(eval(script.innerHTML));
      }
    }
    return _results;
  };

  reflectNewUrl = function(url) {
    if (url !== document.location.href) {
      referer = document.location.href;
      return window.history.pushState({
        turbolinks: true,
        position: currentState.position + 1
      }, '', url);
    }
  };

  reflectRedirectedUrl = function(xhr) {
    var location;
    if ((location = xhr.getResponseHeader('X-XHR-Current-Location'))) {
      return window.history.replaceState(currentState, '', location);
    }
  };

  rememberCurrentUrl = function() {
    return window.history.replaceState({
      turbolinks: true,
      position: window.history.length - 1
    }, '', document.location.href);
  };

  rememberCurrentState = function() {
    return currentState = window.history.state;
  };

  rememberCurrentAssets = function() {
    return assets = extractAssets(document);
  };

  rememberInitialPage = function() {
    if (!initialized) {
      rememberCurrentUrl();
      rememberCurrentState();
      createDocument = browserCompatibleDocumentParser();
      return initialized = true;
    }
  };

  recallScrollPosition = function(page) {
    return window.scrollTo(page.positionX, page.positionY);
  };

  resetScrollPosition = function() {
    return window.scrollTo(0, 0);
  };

  triggerEvent = function(name) {
    var event;
    event = document.createEvent('Events');
    event.initEvent(name, true, true);
    return document.dispatchEvent(event);
  };

  extractAssets = function(doc) {
    var node, _i, _len, _ref, _results;
    _ref = doc.head.childNodes;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      if (node.src || node.href) {
        _results.push(node.src || node.href);
      }
    }
    return _results;
  };

  assetsChanged = function(doc) {
    if (assets[assets.length - 1] === 'https://codio.com/sitebar.js') {
      assets.pop();
    }
    return intersection(extractAssets(doc), assets).length !== assets.length;
  };

  intersection = function(a, b) {
    var value, _i, _len, _ref, _results;
    if (a.length > b.length) {
      _ref = [b, a], a = _ref[0], b = _ref[1];
    }
    _results = [];
    for (_i = 0, _len = a.length; _i < _len; _i++) {
      value = a[_i];
      if (__indexOf.call(b, value) >= 0) {
        _results.push(value);
      }
    }
    return _results;
  };

  extractTitleAndBody = function(doc) {
    var title;
    title = doc.querySelector('title');
    return [title != null ? title.textContent : void 0, doc.getElementById('doc-body'), doc.getElementById('breadcrumbs')];
  };

  browserCompatibleDocumentParser = function() {
    var createDocumentUsingParser, createDocumentUsingWrite, testDoc, _ref;
    createDocumentUsingParser = function(html) {
      return (new DOMParser).parseFromString(html, 'text/html');
    };
    createDocumentUsingWrite = function(html) {
      var doc;
      doc = document.implementation.createHTMLDocument('');
      doc.open('replace');
      doc.write(html);
      doc.close;
      return doc;
    };
    if (window.DOMParser) {
      testDoc = createDocumentUsingParser('<html><body><p>test');
    }
    if ((testDoc != null ? (_ref = testDoc.body) != null ? _ref.childNodes.length : void 0 : void 0) === 1) {
      return createDocumentUsingParser;
    } else {
      return createDocumentUsingWrite;
    }
  };

  installClickHandlerLast = function(event) {
    if (!event.defaultPrevented) {
      document.removeEventListener('click', handleClick);
      return document.addEventListener('click', handleClick);
    }
  };

  handleClick = function(event) {
    var link;
    if (!event.defaultPrevented) {
      link = extractLink(event);
      if (link.nodeName === 'A' && !ignoreClick(event, link)) {
        visit(link.href);
        return event.preventDefault();
      }
    }
  };

  extractLink = function(event) {
    var link;
    link = event.target;
    while (!(link === document || link.nodeName === 'A')) {
      link = link.parentNode;
    }
    return link;
  };

  samePageLink = function(link) {
    return link.href === document.location.href;
  };

  crossOriginLink = function(link) {
    return location.protocol !== link.protocol || location.host !== link.host;
  };

  anchoredLink = function(link) {
    return ((link.hash && link.href.replace(link.hash, '')) === location.href.replace(location.hash, '')) || (link.href === location.href + '#');
  };

  nonHtmlLink = function(link) {
    return link.href.match(/\.[a-z]+(\?.*)?$/g) && !link.href.match(/\.html?(\?.*)?$/g);
  };

  noTurbolink = function(link) {
    var ignore;
    while (!(ignore || link === document)) {
      ignore = link.getAttribute('data-no-turbolink') != null;
      link = link.parentNode;
    }
    return ignore;
  };

  nonStandardClick = function(event) {
    return event.which > 1 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  };

  ignoreClick = function(event, link) {
    return crossOriginLink(link) || anchoredLink(link) || nonHtmlLink(link) || noTurbolink(link) || nonStandardClick(event);
  };

  browserSupportsPushState = window.history && window.history.pushState && window.history.replaceState && window.history.state !== void 0;

  if (browserSupportsPushState) {
    rememberCurrentAssets();
    document.addEventListener('click', installClickHandlerLast, true);
    window.addEventListener('popstate', function(event) {
      var _ref;
      if ((_ref = event.state) != null ? _ref.turbolinks : void 0) {
        return fetchHistory(event.state);
      }
    });
  }

  this.Turbolinks = {
    visit: visit
  };

}).call(this);
