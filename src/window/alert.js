const toolbox = require("../util/toolbox");

function send(type, message) {
  const window = toolbox.getWindow();
  if (window == null) {
    return;
  }

  window.webContents.send("alert", {type: type, message: message});
}

module.exports = {
  debug: (message) => send("debug", message),
  info: (message) => send("info", message),
  warn: (message) => send("warn", message),
  error: (message) => send("error", message)
}