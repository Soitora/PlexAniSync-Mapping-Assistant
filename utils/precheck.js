import colors from "colors";

const validateEnvironmentVariable = (variable, expectedLength, regexTest, errorMessage, shouldExit = true) => {
    const envValue = process.env[variable];

    if (!envValue) {
        console.log(`Your ${variable.red} seems to be missing.`);
        if (shouldExit) process.exit(1);
    }

    if (expectedLength && envValue && envValue.length !== expectedLength) {
        console.log(`Your ${variable.red} seems to be too short.\nExpected ${expectedLength.toString().green} characters, you had ${colors.red(envValue.length)}.`);
        if (shouldExit) process.exit(1);
    }

    if (regexTest && envValue && !regexTest.test(envValue)) {
        console.log(`Invalid ${variable.red} value, ${errorMessage}`);
        if (shouldExit) process.exit(1);
    }
};

export { validateEnvironmentVariable };
