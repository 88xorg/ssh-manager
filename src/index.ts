#!/usr/bin/env bun
import { select, printHeader, pressEnterToContinue, c } from "./ui";
import { connectToServer, addCredential, editCredential, removeCredential } from "./commands";

const MENU_ITEMS = [
  "Connect to server",
  "Add credential",
  "Edit credential",
  "Remove credential",
  "Exit",
];

async function main(): Promise<void> {
  while (true) {
    printHeader();
    const idx = await select("What would you like to do?", MENU_ITEMS);

    switch (idx) {
      case 0:
        await connectToServer();
        break;
      case 1:
        await addCredential();
        await pressEnterToContinue();
        break;
      case 2:
        await editCredential();
        await pressEnterToContinue();
        break;
      case 3:
        await removeCredential();
        await pressEnterToContinue();
        break;
      case 4:
      case -1:
        console.log();
        console.log(`  ${c.dim("Goodbye!")}`);
        console.log();
        process.exit(0);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
