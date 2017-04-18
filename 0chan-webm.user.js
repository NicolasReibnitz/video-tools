// ==UserScript==
// @name        0chan webm
// @namespace   https://0chan.hk/webm
// @description Replace external WebM links with video tag.
// @downloadURL https://raw.githubusercontent.com/Kagami/video-tools/master/0chan-webm.user.js
// @updateURL   https://raw.githubusercontent.com/Kagami/video-tools/master/0chan-webm.user.js
// @include     https://0chan.hk/*
// @include     http://nullchan7msxi257.onion/*
// @version     0.2.1
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// @connect     mixtape.moe
// @connect     u.nya.is
// @connect     a.safe.moe
// @connect     a.pomf.cat
// @connect     gfycat.com
// @connect     0x0.st
// ==/UserScript==

var LOAD_BYTES1 = 100 * 1024;
var LOAD_BYTES2 = 500 * 1024;
var THUMB_SIZE = 200;
var ALLOWED_HOSTS = [
  "[a-z0-9]+.mixtape.moe", "u.nya.is",
  "a.safe.moe", "a.pomf.cat",
  "[a-z]+.gfycat.com",
  "0x0.st",
];
var ALLOWED_LINKS = ALLOWED_HOSTS.map(function(host) {
  host = host.replace(/\./g, "\\.");
  return new RegExp("^https?://" + host + "/.+\\.(webm|mp4)$");
});

function makeThumbnail(screenshot) {
  return new Promise(function(resolve, reject) {
    var img = document.createElement("img");
    img.addEventListener("load", function () {
      var c = document.createElement("canvas");
      var ctx = c.getContext("2d");
      var arrow = "\u25B6";
      var circle = "\u26AB";
      var textWidth = 0;
      var textHeight = THUMB_SIZE / 4;
      if (img.width > img.height) {
        c.width = THUMB_SIZE;
        c.height = (img.height*THUMB_SIZE) / img.width;
      } else {
        c.width = (img.width*THUMB_SIZE) / img.height;
        c.height = THUMB_SIZE;
      }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      ctx.font = textHeight + "px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      textWidth = ctx.measureText(circle).width;
      ctx.fillText(circle, c.width/2 - textWidth*0.55, c.height/2 + textHeight*0.45);
      textHeight /= 2;
      ctx.font = textHeight + "px sans-serif";
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      textWidth = ctx.measureText(arrow).width;
      ctx.fillText(arrow, c.width/2 - textWidth/2, c.height/2 + textHeight/2);
      resolve(c.toDataURL("image/png", 1.0));
    });
    img.addEventListener("error", reject);
    img.src = screenshot;
  });
}

function loadVideoDataFromURL(url, limit) {
  return new Promise(function(resolve, reject) {
    GM_xmlhttpRequest({
      url: url,
      method: "GET",
      responseType: "blob",
      headers: {
        Range: "bytes=0-" + limit,
      },
      onload: function(response) {
        resolve(response.response);
      },
      onerror: function(e) {
        reject(e);
      },
    });
  });
}

function loadVideo(videoData) {
  return new Promise(function(resolve, reject) {
    var vid = document.createElement("video");
    vid.muted = true;
    vid.autoplay = false;
    vid.addEventListener("error", function() {
      reject(new Error("failed to load"));
    });
    vid.addEventListener("loadeddata", function() {
      resolve(vid);
    });
    vid.src = URL.createObjectURL(videoData);
  });
}

function getVideoScreenshot(vid) {
  return new Promise(function(resolve, reject) {
    var c = document.createElement("canvas");
    var ctx = c.getContext("2d");
    c.width = vid.videoWidth;
    c.height = vid.videoHeight;
    ctx.drawImage(vid, 0, 0, c.width, c.height);
    resolve(c.toDataURL("image/png", 1.0));
  });
}

function createVideoElement(link, thumbnail) {
  var div = document.createElement("div");
  div.className = "post-img";

  var vid = document.createElement("video");
  vid.style.display = "block";
  vid.style.maxHeight = "350px";
  vid.style.cursor = "pointer";
  vid.poster = thumbnail;
  vid.preload = "none";
  vid.loop = true;
  vid.controls = false;
  vid.addEventListener("click", function() {
    if (!vid.controls) {
      close.style.display = "block";
      vid.controls = true;
      vid.play();
    }
  });
  vid.src = link.href;

  var close = document.createElement("div");
  var span = document.createElement("span");
  var i = document.createElement("i");
  close.className = "post-img-buttons";
  span.className = "post-img-button";
  i.className = "fa fa-times";
  close.style.display = "none";
  close.addEventListener("click", function() {
    close.style.display = "none";
    vid.controls = false;
    vid.src = link.href;
  });

  div.appendChild(vid);
  span.appendChild(i);
  close.appendChild(span);
  div.appendChild(close);
  return div;
}

function embedVideo(link) {
  var part1 = function(limit) {
    return loadVideoDataFromURL(link.href, limit)
      .then(loadVideo)
      .then(getVideoScreenshot);
  };
  var part2 = function(screenshot) {
    return makeThumbnail(screenshot).then(function(thumbnail) {
      var div = createVideoElement(link, thumbnail);
      link.parentNode.replaceChild(div, link);
    });
  };
  var partErr = function(err) {
    console.error("[0chan-webm] Failed to embed " + link.href +
                  " : " + err.message);
  };

  part1(LOAD_BYTES1).then(function(screenshot) {
    part2(screenshot).catch(partErr);
  }, function() {
    part1(LOAD_BYTES2).then(part2).catch(partErr);
  });
}

function handlePost(post) {
  var links = post.querySelectorAll("a[target=_blank]");
  Array.prototype.filter.call(links, function(link) {
    return ALLOWED_LINKS.some(function(re) {
      return re.test(link.href);
    });
  }).forEach(embedVideo);
}

// TODO: Handle OP post.
function handleThread(container) {
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      Array.prototype.filter.call(mutation.addedNodes, function(node) {
        return node.tagName === "DIV";
      }).forEach(handlePost);
    });
  });
  observer.observe(container, {childList: true});
  Array.prototype.forEach.call(container.children, handlePost);
}

// TODO: Handle multiple threads.
function handleThreads() {
  handleThread(document.querySelector(".thread-tree"));
}

unsafeWindow._webmHandler = typeof exportFunction === "undefined"
  ? handleThreads
  : exportFunction(handleThreads, unsafeWindow);

function handleApp(container) {
  // XXX: $bus is not yet available on DOMContentLoaded so wait for the
  // first mutation.
  var observer = new MutationObserver(function(mutations) {
    var app = unsafeWindow.app;
    if (!app.$bus) return;
    observer.disconnect();
    app.$bus.on("refreshContentDone", unsafeWindow._webmHandler);
  });
  observer.observe(container, {childList: true});
}

handleApp(document.body);
