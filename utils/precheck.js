import chalk from "chalk";

const validateEnvironmentVariable = (variable, expectedLength, regexTest, errorMessage, shouldExit = true) => {
    const envValue = process.env[variable];

    if (!envValue) {
        console.log(`Your ${chalk.redBright(variable)} seems to be missing.`);
        if (shouldExit) process.exit(1);
    }

    if (expectedLength && envValue && envValue.length !== expectedLength) {
        console.log(
            `Your ${chalk.redBright(variable)} seems to be too short.\nExpected ${chalk.green(expectedLength.toString())} characters, you had ${chalk.redBright(envValue.length)}.`
        );
        if (shouldExit) process.exit(1);
    }

    if (regexTest && envValue && !regexTest.test(envValue)) {
        console.log(`Invalid ${chalk.redBright(variable)} value, ${errorMessage}`);
        if (shouldExit) process.exit(1);
    }
};

export { validateEnvironmentVariable };
