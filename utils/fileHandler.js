/** 递归指定目录下的所有文件夹和文件路径
 * @param {string} _path
 * @param {string} pathName
 * @returns {{folders: string[], files: string[]}}
 */
function eachFolderAndFile(_path, pathName = "") {
  const path = require("node:path");
  const fs = require("node:fs");
  const folders = [];
  const files = [];
  const dirs = fs.readdirSync(_path);

  for (const file of dirs) {
    const curPath = path.resolve(_path, file);
    const relativePath = pathName + "/" + file;
    if (fs.statSync(curPath).isDirectory()) {
      folders.push(relativePath);
      folders.push(...eachFolderAndFile(curPath, relativePath).folders);
      files.push(...eachFolderAndFile(curPath, relativePath).files);
    }
    if (fs.statSync(curPath).isFile()) {
      files.push(relativePath);
    }
  }
  return {
    folders,
    files,
  };
}

/** 计算文件目录大小 */
function computedFileSize(_path) {
  const path = require("node:path");
  const fs = require("node:fs");

  let totalSize = 0;
  const dirs = fs.readdirSync(_path);
  for (const file of dirs) {
    const curPath = path.resolve(_path, file);
    if (fs.statSync(curPath).isDirectory()) {
      totalSize += computedFileSize(curPath);
    } else {
      totalSize += fs.statSync(curPath).size;
    }
  }
  return totalSize;
}

module.exports = {
  eachFolderAndFile,
  computedFileSize,
};
