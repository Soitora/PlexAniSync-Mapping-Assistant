import chalk from "chalk";

// Inquirer also inserts a separator after the prefix; this explicit space keeps
// the completed-prompt checkmark visually separated in Windows terminals.
export const promptTheme = {
    prefix: {
        done: `${chalk.green("✔")} `,
    },
};
