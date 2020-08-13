import dotenv from "dotenv";

dotenv.config();

const optionsFromEnv = () => {
  const {
    LINK_CHECK_ROOT_URL,
    LINK_CHECK_FILE_GLOB,
    LINK_CHECK_EXCLUSION_FILE,
  } = process.env;
  return {
    rootURL: LINK_CHECK_ROOT_URL,
    fileGlob: LINK_CHECK_FILE_GLOB,
    exclusionFile: LINK_CHECK_EXCLUSION_FILE,
  };
};

export default optionsFromEnv;
