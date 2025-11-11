import dotenv from "dotenv";
dotenv.config();

import createServer from "./server.js";

const server = createServer();

server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\n${server.name} listening to ${server.url}`);
  console.log(
    "\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator",
  );
  console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});
