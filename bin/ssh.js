const { NodeSSH } = require('node-ssh')
const pc = require("picocolors");


const ssh = new NodeSSH()

exports.sshOperation = async (sshName, remotePath) => {
    console.log(sshName, remotePath);
    const filesize = computedFileSize('./')
    console.log('文件大小：' + (filesize / 1024 / 1024).toFixed(2) + 'MB');
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
        await ssh.exec('rm', ['-rf', remotePath + '/static']).then(() => {
            console.log(pc.green('清除目录static文件 success'))
        })
        await ssh.mkdir(remotePath).then(() => {
            console.log('mkdir ' + remotePath + pc.green(' success'))
        })
        console.log('正在上传中.....')
        let countTotal = 0
        const time = Date.now()
        await ssh.putDirectory('./', remotePath, {
            sftp: true,

            transferOptions: {
                step: (total_transferred, chunk, total) => {
                    if (total_transferred === total) {

                        countTotal += total
                    }
                    transTotal = (countTotal / 1024 / 1024).toFixed(2)
                    process.stdout.clearLine();
                    // process.stdout.cursorTo(0);
                    // process.stdout.write(`转移进度：${total_transferred}\t / 传递进度：${chunk} / 当前碎片总大小：${total}\t / 当前已上传大小： ${transTotal}MB\r`);
                    process.stdout.write(`当前进度：${((countTotal / filesize) * 100).toFixed(2)}% | 当前已上传大小： ${transTotal}MB\r`);
                }
            }
        }).then(() => {
            console.log('copy to ' + remotePath + pc.green(' success'))
        })
        ssh.dispose()
        console.log('总耗时：' + (Date.now() - time) / 1000 + 's');
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