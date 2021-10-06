const {contextBridge, ipcRenderer} = require("electron");
const path = require("path");
const {fileURLToPath} = require("url");

const publicPath = path.resolve(__dirname, "..");

function initialize() {
  const file = fileURLToPath(window.location.toString());
  if (file === path.join(publicPath, "setup.html")) {
    initializeSetup();
  }

  if (file === path.join(publicPath, "webview.html")) {
    initializeWebview();
  }
}

function initializeSetup() {
  contextBridge.exposeInMainWorld("electron", {
    connectStorage: (engine, address, database, username, password) => {
      toggleFormState();
      createLog("debug", "Connecting...");

      ipcRenderer.invoke("storage.connect", {
        engine: engine,
        address: address,
        database: database,
        username: username,
        password: password
      }).finally(() => {
        toggleFormState();
      });
    }
  });

  ipcRenderer.on("window.notify", (event, args) => createLog(args.level, args.message));
  ipcRenderer.invoke("configuration.config").then(config => {
    if (config.storage.engine) {
      setValue("input-engine", config.storage.engine);
    }

    setValue("input-address", config.storage.address);
    setValue("input-database", config.storage.database);
    setValue("input-username", config.storage.username);
    setValue("input-password", config.storage.password);
  }, reason => {
    console.error("Encountered an error while invoking configuration:config: %s", reason);
    return null;
  });
}

function initializeWebview() {
  ipcRenderer.on("window.show", (event, args) => {
    const webview = document.getElementById("webview");
    if (!webview) {
      return;
    }

    webview.classList.remove("hidden");
  });
}

function createLog(level, message) {
  let color;
  if (!level || !message) {
    return;
  } else if (level === "debug") {
    color = "primary";
  } else if (level === "information") {
    color = "success";
  } else if (level === "warning") {
    color = "warning";
  } else if (level === "error") {
    color = "danger";
  } else {
    console.warn(`Unsupported alert level ${level}`);
    return;
  }

  const logElement = document.getElementById("log");
  if (!logElement) {
    return;
  }

  const logTemplate = document.getElementById("log-template");
  if (!logTemplate) {
    return;
  }

  const node = logTemplate.content.cloneNode(true);

  const element = node.querySelector("li");
  element.classList.add(`list-group-item-${color}`);

  const textElement = element.querySelector("small");
  textElement.innerText = `[${new Date().toLocaleTimeString("en-GB")}] ${message}`;

  logElement.prepend(node);
}

function toggleFormState() {
  const formElement = document.getElementById("form-storage");
  if (!formElement) {
    return;
  }

  const elements = formElement.querySelectorAll("button,input,span");
  for (const element of elements) {
    if (element.tagName === "SPAN") {
      if (element.classList.contains("d-none")) {
        element.classList.remove("d-none");
      } else {
        element.classList.add("d-none");
      }

      continue;
    }

    if (element.hasAttribute("disabled")) {
      element.removeAttribute("disabled");
    } else {
      element.setAttribute("disabled", "");
    }
  }
}

function setValue(id, value) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Failed to get element ${id}`);
    return;
  }

  element.value = value;
}

window.addEventListener("DOMContentLoaded", event => {
  initialize();
});