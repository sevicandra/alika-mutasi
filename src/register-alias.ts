import moduleAlias from "module-alias";
import path from "path";

const basePath = __dirname.includes("dist") ? "dist" : "src";

moduleAlias.addAlias("@", path.join(__dirname, "..", basePath));
