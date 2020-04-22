const {contextBridge, ipcRenderer} = require("electron");
const path = require("path");

const currentPath = path.resolve(__dirname, "..", "..");

function injectCSS(url) {
  const element = document.createElement("link");
  element.rel = "stylesheet";
  element.type = "text/css";
  element.href = url;
  document.head.append(element);
}

function injectScript(url) {
  const element = document.createElement("script");
  element.defer = true;
  element.src = url;
  document.head.append(element);
}

function populateInputs() {
  window.addEventListener("load", () => {
    const storage = ipcRenderer.sendSync("config:storage");
    setValue("input-host", storage.host);

    if (storage.port >= 1 && storage.port <= 65535) {
      setValue("input-port", storage.port);
    }

    setValue("input-database", storage.database);
    setValue("input-username", storage.username);
    setValue("input-password", storage.password);
  });
}

function setValue(id, value) {
  const element = document.getElementById(id);
  if (element == null) {
    return;
  }

  element.value = value;
}

function clearAlerts() {
  const alertElement = document.getElementById("alert");
  if (alertElement == null) {
    return;
  }

  while (alertElement.firstChild) {
    alertElement.removeChild(alertElement.firstChild);
  }
}

function clearAlert(id) {
  const alertElement = document.getElementById("alert");
  if (alertElement == null) {
    return;
  }

  const elements = alertElement.querySelectorAll("[data-id=" + id + "]");
  for (let index = 0; index < elements.length; index++) {
    alertElement.removeChild(elements[index]);
  }
}

function createAlert(args) {
  if (args == null || args.type == null || args.message == null) {
    return;
  }

  const alertElement = document.getElementById("alert");
  if (alertElement == null) {
    return;
  }

  const divElement = document.createElement("div");
  divElement.classList.add("alert", "alert-" + args.type, "alert-dismissible", "fade", "show");
  divElement.innerText = args.message;
  divElement.setAttribute("data-id", args.id || "generic");
  divElement.setAttribute("role", "alert");

  const buttonElement = document.createElement("button");
  buttonElement.classList.add("close", "no-select");
  buttonElement.type = "button"
  buttonElement.setAttribute("data-dismiss", "alert");
  buttonElement.setAttribute("aria-label", "Close");

  const spanElement = document.createElement("span");
  spanElement.innerHTML = "&times;";
  spanElement.setAttribute("aria-hidden", "true");

  buttonElement.append(spanElement);
  divElement.append(buttonElement);
  alertElement.prepend(divElement);
}

contextBridge.exposeInMainWorld("electron", {
  injectBase: () => {
    injectCSS(path.join(currentPath, "public", "css", "style.css"));
  },
  injectBootstrap: () => {
    injectCSS(path.join(currentPath, "node_modules", "bootstrap", "dist", "css", "bootstrap.min.css"));
    injectCSS(path.join(currentPath, "public", "css", "bootstrap-style.css"));
    injectScript(path.join(currentPath, "node_modules", "bootstrap", "dist", "js", "bootstrap.bundle.min.js"));
  },
  injectJQuery: () => {
    injectScript(path.join(currentPath, "node_modules", "jquery", "dist", "jquery.min.js"));
  },
  injectSetup: () => {
    injectScript(path.join(currentPath, "public", "js", "setup-script.js"));
    populateInputs();
  },
  injectWebview: () => {
    injectCSS(path.join(currentPath, "public", "css", "webview-style.css"));
  },
  clearAlerts: () => {
    clearAlerts();
  },
  clearAlert: (id) => {
    clearAlert(id);
  },
  storageConnect: (host, port, database, username, password) => {
    createAlert({id: "connecting", type: "primary", message: "Connecting..."});
    ipcRenderer.send("storage:connect", {
      host: host,
      port: port,
      database: database,
      username: username,
      password: password
    });
  }
});

ipcRenderer.on("alert", (event, args) => {
  clearAlert("connecting");
  if (args.type === "debug") {
    createAlert({type: "primary", message: args.message});
  } else if (args.type === "info") {
    createAlert({type: "success", message: args.message});
  } else if (args.type === "warn") {
    createAlert({type: "warning", message: args.message});
  } else if (args.type === "error") {
    createAlert({type: "danger", message: args.message});
  } else {
    console.warn("Unsupported alert type:", args.type);
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const webview = document.getElementById("webview");
  if (webview == null) {
    return;
  }

  webview.addEventListener("ipc-message", (event) => {
    if (event.channel == null || event.args == null || event.args.length !== 1) {
      return;
    }

    const channel = event.channel;
    const args = event.args[0];
    if (channel === "window:settings" && args.visibility === true) {
      webview.classList.remove("hidden");
    }

    ipcRenderer.send(channel, args);
  });
});