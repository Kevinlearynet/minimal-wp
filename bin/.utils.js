/**
 * Utility functions shared between builds
 */
const sass = require("sass");
const fs = require("fs");
const path = require("path");
const scssDir = path.resolve(`static/scss`);
const distDir = path.resolve(`static/dist`);
const debounce = require("lodash.debounce");

require("dotenv").config();
const scssFiles = fs.readdirSync(scssDir).filter((file) => file.endsWith(".scss") && !file.startsWith("_"));

// Generate /static/dist/importmap.json
module.exports.generateImportmap = () => {
  try {
    const start = performance.now();
    const json = require("../package-lock.json");

    const importmap = {
      imports: {},
    };

    for (const dir in json.packages) {
      if (!dir) continue;

      const details = json.packages[dir];
      if (details.dev === true) continue;

      const basename = path.basename(dir);
      importmap.imports[basename] = `${process.env.THEME_PATH}/${dir}`;
    }

    fs.writeFileSync(`${distDir}/importmap.json`, JSON.stringify(importmap), "utf8");
    const end = performance.now();
    const runtime = (end - start).toFixed(3);
    console.log(`JS modules import map re-generated at /static/dist/importmap.json in ${runtime}ms`);
  } catch (err) {
    console.error("Error generating /static/dist/importmap.json:", err);
  }
};

// Compile SASS
module.exports.scssToCSS = debounce(() => {
  try {
    // Read all /static/scss/*.scss files, ignoring any beginning with _
    scssFiles.forEach((scssFile) => {
      const start = performance.now();
      const basename = path.basename(scssFile);
      const result = sass.compile(`${scssDir}/${scssFile}`, {
        style: "compressed",
        sourceMap: true,
        logger: {
          warn(message, options) {
            if (message.includes(`deprecated`)) return;
            console.log(message);
          },
        },
      });
      const cssFile = `${distDir}/${scssFile}`.replace(".scss", ".css");
      fs.writeFileSync(cssFile, result.css);
      const end = performance.now();
      const runtime = (end - start).toFixed(3);
      const compiledFilename = path.basename(cssFile);
      console.log(`Sass compiled ${basename} to ${compiledFilename} successfully in ${runtime}ms`);
    });
  } catch (error) {
    console.log(`Error compiling SASS to CSS:`, error);
  }
}, 50);
