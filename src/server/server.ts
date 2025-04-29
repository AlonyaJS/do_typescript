onNet("logToServer", (message: string) => {
  const playerId: number = global.source;

  console.log(`Player ${playerId} says: ${message}`);
});
