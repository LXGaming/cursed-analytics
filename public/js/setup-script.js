function initialize() {
  $("#form-storage").on("submit", event => {
    event.preventDefault();
    
    const engine = $("#input-engine").val() || "mysql";
    const address = $("#input-address").val() || "localhost:3306";
    const database = $("#input-database").val() || "curse_analytics";
    const username = $("#input-username").val() || "curse_analytics";
    const password = $("#input-password").val();

    window.electron.connectStorage(engine, address, database, username, password);
  });
}

window.addEventListener("DOMContentLoaded", event => {
  initialize();
});