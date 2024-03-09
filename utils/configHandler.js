import config from "config";

const setUserConfigDefaults = () => {
    config.util.setModuleDefaults("userConfig", {
        preferMetadata: "tmdb",
        preferMedia: "tv",
        copyResults: true,
        saveResults: false,
        inputFilePath: "batch/input.txt",
        outputFilePath: "batch/output/",
    });
};

const getUserConfig = () => {
    return config.get("userConfig");
};

export { setUserConfigDefaults, getUserConfig };
