on("onClientResourceStart", (resourceName: string) => {
  if (resourceName === GetCurrentResourceName()) {
    console.log("Client Script Started!");
    emitNet("logToServer", "Client resource loaded!");
  }
});
