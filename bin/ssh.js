const { NodeSSH } = require('node-ssh')
const pc = require("picocolors");


const ssh = new NodeSSH()

exports.sshOperation = async (sshName, remotePath) => {
    console.log(sshName, remotePath);
    const filesize = (computedFileSize('./') / 1024 / 1024).toFixed(2)
    console.log('文件大小：' + filesize + 'MB');
    if (!remotePath) {
        return
    }

    const sshList = require('../config.json').hosts
    const curHost = sshList[sshName]
    console.log('开始部署到 ' + curHost.host + ' 服务器.....');
    const sshConfig = {
        host: curHost.host,
        port: curHost.port,
        username: curHost.username,
        password: curHost.password,
        tryKeyboard: curHost.tryKeyboard,
    }
    try {
        await ssh.connect(sshConfig).then(async () => {
            console.log('正在连接 ' + sshConfig.host + pc.green(' success'))
        })
        await ssh.mkdir(remotePath).then(() => {
            console.log('mkdir ' + remotePath + pc.green(' success'))
        })
        console.log('正在上传中.....')
        let countTotal = 0
        let i = 0
        await ssh.putDirectory('./', remotePath, {

            transferOptions: {
                step: (total_transferred, chunk, total) => {
                    if (total_transferred > countTotal) {
                        i++
                        countTotal += total
                    }
                    process.stdout.write(`转移进度：${total_transferred} | 传递进度：${chunk} | 当前碎片总大小：${total} | 当前已上传大小： ${(countTotal / 1024 / 1024).toFixed(2)}MB\r`);
                }
            }
        }).then(() => {
            console.log('copy to ' + remotePath + pc.green(' success'))
        })
        ssh.dispose()
        console.log(pc.bold(pc.green('部署成功 🎉🎉🎉🎉')));

    } catch (error) {
        console.log(pc.bold(pc.red('部署失败 ＞﹏＜')));

    }

}


// sshOperation()
/** 计算文件目录大小 */
function computedFileSize(_path) {
    const path = require("node:path");
    const fs = require("node:fs");

    let totalSize = 0
    const dirs = fs.readdirSync(_path)
    for (const file of dirs) {
        const curPath = path.resolve(_path, file)
        if (fs.statSync(curPath).isDirectory()) {
            totalSize += computedFileSize(curPath)
        } else {
            totalSize += fs.statSync(curPath).size
        }
    }
    return totalSize
}