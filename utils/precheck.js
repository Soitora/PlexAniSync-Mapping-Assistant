import colors from "colors";

const validateEnvironmentVariable = (variable, expectedLength, regexTest, errorMessage) => {
    if (!process.env[variable]) {
        console.log(`Your ${variable.red} seems to be missing.`);
        process.exit(1);
    }

    if (expectedLength && process.env[variable].length !== expectedLength) {
        console.log(`Your ${variable.red} seems to be too short.\nExpected ${expectedLength.toString().green} characters, you had ${colors.red(process.env[variable].length)}.`);
        process.exit(1);
    }

    if (regexTest && !regexTest.test(process.env[variable])) {
        console.log(`Invalid ${variable.red} value, ${errorMessage}`);
        process.exit(1);
    }
};

export { validateEnvironmentVariable }