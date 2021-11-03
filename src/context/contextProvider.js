import { useContext, createContext, useEffect, useState } from "react";
import xmlDataSrc from "../services/haarcascade_frontalface_default.xml";

const MainContext = createContext();

export const useMain = () => {
  return useContext(MainContext);
};

const ContextProvider = ({ children }) => {
  const [cv, setCv] = useState(null);
  useEffect(() => {
    const createFileFromUrl = function (openCv, path, url) {
      let request = new XMLHttpRequest();
      request.open("GET", url, true);
      request.responseType = "arraybuffer";
      request.onload = function (ev) {
        if (request.readyState === 4) {
          if (request.status === 200) {
            // console.log(request.response);
            let data = new Uint8Array(request.response);
            // console.log("data", data);
            openCv.FS_createDataFile("/", path, data, true, false, false);
          } else {
            console.log("Failed to load " + url + " status: " + request.status);
          }
        }
      };
      request.send();
    };
    const loadCv = async () => {
      const moduleCv = await import("../services/opencv");
      const opencv = await moduleCv.default;
      let faceCascadeFile = "haarcascade_frontalface_default.xml";
      createFileFromUrl(opencv, faceCascadeFile, xmlDataSrc);
      setCv(opencv);
    };
    loadCv();
  }, []);
  return <MainContext.Provider value={{ cv }}>{children}</MainContext.Provider>;
};

export default ContextProvider;
