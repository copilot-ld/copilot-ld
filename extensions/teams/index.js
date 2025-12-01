import dotenv from "dotenv";
dotenv.config();

import createServer from "./server.js";

const server = await createServer();

server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log("\n------------------- Startup ---------------------------");
  console.log(
    `\nRunning at: http://localhost:${process.env.teams_app_port || process.env.TEAMS_APP_PORT || 3978}`,
  );
  console.log("\nExpose publically: npm run ngrok");
  console.log(
    "\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator",
  );
  console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
  console.log("\n------------------- Listening ---------------------------");
});
