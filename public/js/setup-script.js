function initialize() {
  $("#form-storage").on("submit", (event) => {
    event.preventDefault();

    window.electron.clearAlerts();

    const host = $("#input-host").val() || "localhost";
    const port = $("#input-port").val() || "3306";
    const database = $("#input-database").val() || "curse_analytics";
    const username = $("#input-username").val() || "curse_analytics";
    const password = $("#input-password").val();

    window.electron.storageConnect(host, port, database, username, password);
  });

  $().alert();
}

window.addEventListener("load", () => {
  initialize();
});