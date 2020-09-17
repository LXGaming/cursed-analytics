const {app, session} = require("electron");

let blocking = false;
let cloudflare = false;

function onBeforeRequest(details, callback) {
  let url = new URL(details.url);

  // Allow Dev Tools
  if (url.protocol === "data:" || url.protocol === "devtools:") {
    callback(details);
    return;
  }

  // Allow WebView
  if (url.protocol === "file:" && (url.pathname.endsWith(".css") || url.pathname.endsWith(".html") || url.pathname.endsWith(".js"))) {
    callback(details);
    return;
  }

  // Only allow https and websockets
  if (url.protocol !== "https:" && url.protocol !== "wss:") {
    block(url, callback, {cancel: true});
    return;
  }

  if (isCurseForge(url.host) && (url.pathname === "/" || url.pathname === "/dashboard")) {
    allow(url, callback, {redirectURL: "https://authors.curseforge.com/dashboard/projects"});
    return;
  }

  if (isAmazonWebServices(url.host, url.pathname)) {
    allow(url, callback, details);
    return;
  }

  if (isCurseForge(url.host, url.pathname)) {
    blocking = true;
    cloudflare = false;
    allow(url, callback, details);
    return;
  }

  if (isTwitch(url.host, url.pathname)) {
    blocking = false;
    cloudflare = false;
  }

  if (cloudflare) {
    blocking = false;
  }

  if (!blocking) {
    allow(url, callback, details);
  } else {
    block(url, callback, {cancel: true});
  }
}

function onHeadersReceived(details, callback) {
  let url = new URL(details.url);
  if (details.statusCode === 403 && isCurseForge(url.host, url.pathname)) {
    cloudflare = true;
  }

  callback(details);
}

function allow(url, callback, object) {
  if (object.redirectURL != null) {
    console.debug("[REDIRECT]", sanitizeURL(url), "->", sanitizeURL(object.redirectURL));
  } else {
    console.debug("[ALLOW]", sanitizeURL(url));
  }

  object.cancel = false;
  return callback(object);
}

function block(url, callback, object) {
  console.debug("[BLOCK]", sanitizeURL(url))
  object.cancel = true;
  callback(object);
}

function isAmazonWebServices(host, path) {
  return host.startsWith("twitch-piper-reports.") && host.endsWith(".amazonaws.com");
}

function isCurseForge(host, path) {
  if (host === "authors.curseforge.com") {
    return path == null
      || path === "/dashboard/projects"
      || (path.startsWith("/dashboard/project/") && path.endsWith("/exportcsv"))
      || path === "/login"
      || path === "/login-callback"
      || path === "/twitch-login"
      || path === "/logout";
  }

  return false;
}

function isTwitch(host, path) {
  if (host === "www.twitch.tv") {
    return path == null
      || path === "/login";
  }

  if (host === "id.twitch.tv") {
    return path == null
      || path === "/oauth2/authorize";
  }

  return false;
}

function sanitizeURL(url) {
  return url.toString().split("?")[0];
}

app.whenReady().then(() => {
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => onBeforeRequest(details, callback));
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => onHeadersReceived(details, callback));
});