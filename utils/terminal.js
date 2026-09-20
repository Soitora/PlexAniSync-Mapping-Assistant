import { execFileSync } from "node:child_process";
import chalk from "chalk";

export function configureInteractiveTerminal() {
    if (!process.stdout.isTTY) {
        return;
    }

    if (process.platform === "win32") {
        try {
            // Node writes Unicode as UTF-8; make the active Windows console decode it the same way.
            execFileSync("chcp.com", ["65001"], { stdio: "ignore", windowsHide: true });
        } catch {
            // Keep the CLI usable if the host does not expose the Windows code-page utility.
        }
    }

    chalk.level = 1;
}
