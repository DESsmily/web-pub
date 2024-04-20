const { NodeSSH } = require("node-ssh");
const pc = require("picocolors");
const { eachFolderAndFile, computedFileSize } = require("../utils/fileHandler");
const path = require("node:path");
const SSHMultiSyncUpload = require("../utils/sshUpload");

const ssh = new NodeSSH();

exports.sshOperation = async (
  /** @type {{host: string, port: number, username: string, password: string, tryKeyboard: boolean} | null} */ sshConfig = null,
  remotePath,
  localPath = "./"
) => {
  // console.log(sshName, remotePath);
  const filesize = computedFileSize("./");
  console.log("文件大小：" + (filesize / 1024 / 1024).toFixed(2) + "MB");
  if (!remotePath) {
    return;
  }
  if (!sshConfig) {
    return;
  }
  console.log("开始部署到 " + sshConfig.host + " 服务器.....");

  try {
    await ssh.connect({ ...sshConfig }).then(async () => {
      console.log("正在连接 " + sshConfig.host + pc.green(" success"));
    });
    await ssh.exec("rm", ["-rf", remotePath]).then(() => {
      console.log(pc.green("清除目录文件 success"));
    });
    await ssh.mkdir(remotePath).then(() => {
      console.log("mkdir " + remotePath + pc.green(" success"));
    });
    console.log("正在上传中.....");
    // console.log(eachFolderAndFile);
    const { folders, files } = eachFolderAndFile(localPath || "./");
    const mkdirs = folders.map((folder) => remotePath + folder);
    await ssh
      .exec("mkdir", ["-p", ...mkdirs])
      .then(() => {
        mkdirs.forEach((folder) => {
          console.log("mkdir " + remotePath + folder + pc.green(" success"));
        });
      })
      .catch((error) => {
        console.log(error);
      });

    const sshMult = new SSHMultiSyncUpload({
      numAsync: 10,
    });

    const createfiles = files.map((file) => {
      return {
        local: path.resolve(localPath, "." + file),
        remote: remotePath + file,
      };
    });
    let countTotal = 0;
    const time = Date.now();
    let transTotal = 0;
    const sftp = await ssh.requestSFTP();
    createfiles.forEach((item) => {
      sshMult.addTask(() => {
        return new Promise((resolve, reject) => {
          sftp.fastPut(
            item.local,
            item.remote,
            {
              step: (total_transferred, chunk, total) => {
                if (total_transferred === total) {
                  countTotal += total;
                }
                transTotal = (countTotal / 1024 / 1024).toFixed(2);
                process.stdout.clearLine();
                process.stdout.write(
                  `当前进度：${((countTotal / filesize) * 100).toFixed(
                    2
                  )}% | 当前已上传大小： ${transTotal}MB\r`
                );
              },
            },
            (err) => {
              if (err) {
                console.log(
                  `${pc.red("上传失败")} ${item.local} -> ${item.remote}`
                );
                reject(err);
                //   console.log(err);
                return;
              }
              console.log(
                pc.bold(`上传文件: ${item.remote} ${pc.green("success")}`)
              );
              resolve(true);
            }
          );
        });
      });
    });
    sshMult.onFinish((e) => {
      console.log(
        pc.bold(
          pc.green(
            `🎉🎉🎉🎉 部署成功 🎉🎉🎉🎉 耗时 ${(e.time / 1000).toFixed(2)}s`
          )
        )
      );
      sftp.end();
      ssh.dispose();
    });

    sshMult.Run();
    // sshMult.onFinish((e) => {
    // });
    // console.log("上传完成", e);
  } catch (error) {
    console.log(pc.red("==========================="));
    console.log(error);
    console.log(pc.red("==========================="));
    console.log(pc.bold(pc.red("部署失败 ＞﹏＜")));
    ssh.dispose();
  }
};
