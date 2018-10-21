#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const settings = require("./settings");
const INPUT_DIR = path.resolve(__dirname, settings.input);
console.log(`reading from ${INPUT_DIR}`);
const OUTPUT_DIR = path.resolve(__dirname, settings.output);
console.log(`writing to ${OUTPUT_DIR}`);
const TARGET_SIZE = settings.size;
console.log(`max target size ${TARGET_SIZE}`);
const QUALITY = Number(settings.quality) || 85;
console.log(`quality ${QUALITY}`);
const DEBOUNCE = Number(settings.debounce) || 1000;
console.log(`debounce ${DEBOUNCE}`);

const queueFile = (() => {
  const queue = {};

  return file => {
    if (queue[file]) clearTimeout(queue[file]);

    queue[file] = setTimeout(() => processFile(file), DEBOUNCE);
  };
})();

const { spawn } = require("child_process");
const processFile = file => {
  const inputPath = path.resolve(INPUT_DIR, file);
  const outputPath = path.resolve(OUTPUT_DIR, file);

  if (!fs.existsSync(inputPath)) {
    return;
  }

  const convert = spawn("convert", [
    inputPath,
    "-resize",
    TARGET_SIZE,
    "-quality",
    85,
    "-strip",
    outputPath
  ]);

  convert.on("close", code => {
    if (code !== 0) {
      console.log(`error converting ${inputPath} => ${outputPath}`);
      return queueFile(file);
    }
    console.log(`successfully converted ${inputPath} => ${outputPath}`);
  });
};

fs.watch(INPUT_DIR, { recursive: true }, (eventType, filename) => {
  queueFile(filename);
});
