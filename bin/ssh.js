const { NodeSSH } = require('node-ssh')
const pc = require("picocolors");


const ssh = new NodeSSH()

exports.sshOperation = async (sshName, remotePath) => {
    console.log(sshName, remotePath);
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
        await ssh.putDirectory('./', remotePath).then(() => {
            console.log('copy to ' + remotePath + pc.green(' success'))
        })
        ssh.dispose()
        console.log(pc.bold(pc.green('部署成功 🎉🎉🎉🎉')));

    } catch (error) {
        console.log(pc.bold(pc.red('部署失败 ＞﹏＜')));

    }

}


// sshOperation()