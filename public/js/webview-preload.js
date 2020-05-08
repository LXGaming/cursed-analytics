const {ipcRenderer} = require("electron");

function initialize() {
  if (window.location.protocol !== "https:" || window.location.hostname !== "authors.curseforge.com") {
    return;
  }

  if (window.location.pathname === "/twitch-login") {
    let twitchOAuth = getTwitchOAuth();
    if (twitchOAuth != null) {
      window.location.href = twitchOAuth;
      return;
    }

    console.error("Twitch OAuth is unavailable");
    return;
  }

  if (window.location.pathname === "/dashboard/projects") {
    ipcRenderer.sendToHost("analytics", getProjectIds());
  }
}

function getProjectIds() {
  let projectIds = [];
  let links = getLinks();
  for (let index = 0; index < links.length; index++) {
    let link = links[index];
    if (link.endsWith("/exportcsv")) {
      let projectId = link.match(/\d+/)[0];
      projectIds.push(parseInt(projectId));
    }
  }

  return projectIds;
}

function getTwitchOAuth() {
  let links = getLinks();
  for (let index = 0; index < links.length; index++) {
    let link = links[index];
    if (link.startsWith("https://id.twitch.tv/oauth2/authorize")) {
      return link;
    }
  }

  return null;
}

function getLinks() {
  let links = [];
  let elements = document.getElementsByTagName("a");
  for (let index = 0; index < elements.length; index++) {
    let element = elements[index];
    if (element.href) {
      links.push(element.href);
    }
  }

  return links;
}

window.addEventListener("DOMContentLoaded", () => {
  initialize();
});

window.addEventListener("load", () => {
  // Twitch
  if (window.location.host === "www.twitch.tv" || window.location.host === "id.twitch.tv") {
    ipcRenderer.sendToHost("window:settings", {visibility: true});
    return;
  }

  // Cloudflare
  let wrapper = document.getElementById("cf-wrapper");
  if (wrapper != null) {
    let titleElement = wrapper.querySelector(".cf-header h1");
    let subtitleElement = wrapper.querySelector(".cf-header h2");
    if (titleElement != null && subtitleElement != null) {
      ipcRenderer.sendToHost("window:settings", {visibility: true});
    }
  }
});