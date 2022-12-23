const {ipcRenderer} = require("electron");

function initialize() {
  if (window.location.protocol !== "https:") {
    return;
  }

  if (window.location.hostname.endsWith(".twitch.tv")) {
    return;
  }

  ipcRenderer.on("webview.url", (event, args) => {
    document.location.replace(args.url);
  });

  if (window.location.hostname === "authors-old.curseforge.com") {
    if (window.location.pathname === "/twitch-login") {
      let twitchOAuth = getTwitchOAuth();
      if (twitchOAuth != null) {
        window.location.href = twitchOAuth;
      } else {
        console.error("Twitch OAuth is unavailable");
      }

      return;
    }

    if (window.location.pathname === "/dashboard/projects") {
      ipcRenderer.send("project.list", {
        urls: getProjectUrls()
      });
      return;
    }

    if (window.location.pathname.startsWith("/store/transactions")) {
      const transactions = [];

      const transactionElements = document.querySelectorAll("div.transactions");
      for (const transactionElement of transactionElements) {
        const header = transactionElement.querySelector("div.transaction-listing-header abbr");
        const epoch = header.getAttribute("data-epoch");

        let rewards = transactionElement.querySelectorAll("ul.sub-reward-item li");
        for (const reward of rewards) {
          const points = reward.querySelector("b");
          const projects = reward.querySelector("a");

          transactions.push({
            timestamp: new Date(epoch * 1000),
            value: points.innerText,
            slug: getProjectSlug(projects.href)
          });
        }
      }

      ipcRenderer.send("project.transaction", {
        quantity: transactionElements.length,
        transactions: transactions
      });
      return;
    }

    console.warn("Unhandled page: %s", window.location.href);
  }

  ipcRenderer.send("project.create", {
    id: getProjectId(),
    name: getProjectName(),
    slug: getProjectSlug(document.location.pathname)
  });
}

function getProjectId() {
  let element;
  if (window.location.hostname === "dev.bukkit.org") {
    element = document.querySelector("ul.cf-details.project-details li");
  }

  if (window.location.hostname === "www.curseforge.com") {
    element = document.querySelector("div.w-full.flex.justify-between");
  }

  if (!element) {
    return null;
  }

  const childElements = element.children;
  if (!childElements || childElements.length !== 2) {
    return null;
  }

  if (childElements[0].innerText !== "Project ID") {
    return null;
  }

  return parseInt(childElements[1].innerText);
}

function getProjectName() {
  const element = document.querySelector("meta[property=\"og:title\"]");
  if (!element) {
    return null;
  }

  return element["content"];
}

function getProjectSlug(pathname) {
  if (!pathname) {
    return null;
  }

  const index = pathname.lastIndexOf("/");
  if (index <= 0 || index > pathname.length) {
    return null;
  }

  return pathname.substring(index + 1);
}

function getProjectUrls() {
  const projects = [];
  const links = getLinks("tbody a");
  for (const link of links) {
    projects.push(link);
  }

  return projects;
}

function getTwitchOAuth() {
  const links = getLinks("a");
  for (const link of links) {
    if (link.startsWith("https://id.twitch.tv/oauth2/authorize")) {
      return link;
    }
  }

  return null;
}

function getLinks(selectors) {
  const links = [];
  const elements = document.querySelectorAll(selectors);
  for (const element of elements) {
    if (element.href) {
      links.push(element.href);
    }
  }

  return links;
}

window.addEventListener("DOMContentLoaded", () => {
  initialize();
});

window.addEventListener("load", event => {
  // Twitch
  if (window.location.host === "id.twitch.tv" || window.location.host === "www.twitch.tv") {
    ipcRenderer.send("window.show");
    return;
  }

  const selectors = [
      // Cloudflare
      "cf-wrapper", // Legacy
      "challenge-running",
      "trk_jschal_js"
  ];

  for (const selector of selectors) {
    if (document.getElementById(selector)) {
      ipcRenderer.send("window.show");
      break;
    }
  }
});