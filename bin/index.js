#!/usr/bin/env node

const { program } = require('commander')
const path = require('node:path')
const fs = require('node:fs')
const readline = require('node:readline')
const pc = require("picocolors");


program.version(require('../package.json').version)

const sshCmd = program.command('ssh').description('ssh')


// 添加配置
sshCmd.command('add').description('添加ssh连接配置 (web-pub ssh add test 127.0.0.1@22 root 123456)')
    .arguments('<alias> <host@port> <user> <password>', 'ip@端口（默认22，可不输） 用户名 密码')
    .action(async (alias, hostandport, user, password) => {
        checkConfigFile()
        const [host, port] = hostandport.split('@')
        if (!alias) {
            console.log('alis名称不能为空')
            return 0
        }
        if (!host || host.split('.').length != 4) {
            console.log('host格式不正确')
            return 0
        }
        // console.log(host, port, user, password);
        const conf = require('../config.json')
        const hosts = conf.hosts
        if (Reflect.has(hosts, alias)) {
            console.log('配置名称 ' + alias + ' 已存在');
            return 0
        }
        Reflect.set(hosts, alias, { host, port: port || 22, username: user, password, tryKeyboard: true })
        console.log(conf);
        require('fs').writeFileSync(path.resolve(__dirname, '../config.json'), JSON.stringify(conf, null, 2))
        console.log('配置 ' + alias + ' 添加成功');
    })

// 删除配置
sshCmd.command('del').description('删除ssh连接配置 (web-pub del test)')
    .arguments('<alias>', '配置名称')
    .action(async (alias) => {
        checkConfigFile()
        const conf = require('../config.json')
        const hosts = conf.hosts
        if (!Reflect.has(hosts, alias)) {
            console.log('配置名称 ' + alias + ' 不存在');
            return 0
        }
        Reflect.deleteProperty(hosts, alias)
        require('fs').writeFileSync(path.resolve(__dirname, '../config.json'), JSON.stringify(conf, null, 2))
        console.log('配置 ' + alias + ' 删除成功');
    })

// 查看配置
sshCmd.command('list').description('查看ssh连接配置 (web-pub list)')
    .action(async () => {
        checkConfigFile()
        const tabls = []
        const conf = require('../config.json')
        if (Object.keys(conf.hosts).length) {
            Object.keys(conf.hosts).forEach(alias => {
                const item = conf.hosts[alias]
                tabls.push({ name: alias, host: item.host, port: item.port, username: item.username, password: item.password })
                // console.table(
                //     [{ name: alias, host: item.host, port: item.port, username: item.username, password: item.password }],
                // )
            })
            console.table(tabls)

        } else {
            console.log('配置为空');
        }
    })



// 使用配置
program.command('use').description('使用ssh配置名称进行连接 部署')
    .arguments('<alias> <remotePath>', '配置名称 部署路径 （web-pub test /mnt/test）')
    .action(async (alias, /** @type {string} */ remotePath) => {
        if (!alias) {
            console.log('配置名称不能为空');
            return 0
        }
        const remotePathErr = [null, undefined, '', '*', '/', '/*']
        if (remotePathErr.includes(remotePath) || remotePath.split('/').some(item => item.includes('\\'))) {
            console.log(pc.red('部署路径不规范'));
            return 0
        }
        checkConfigFile()
        const conf = require('../config.json')
        const hosts = conf.hosts
        if (!Reflect.has(hosts, alias)) {
            console.log('配置名称 ' + alias + ' 不存在');
            return 0
        }
        runDeploy({ ...hosts[alias] }, remotePath)

    })

// 使用ssh手动配置 部署
program.command('run').description('配置ssh进行连接 部署')
    .option('-S, --sshConfig <ip@port@user@pass>', '服务器配置 例如 127.0.0.1@22@root@123')
    .option('-R, --remotePath <remotePath>', '部署路径 例如 /mnt/test')
    .action(async (config) => {
        if (!config.sshConfig || !config.remotePath) {
            console.log(pc.red('配置项 --sshConfig或-S 和 --remotePath或-R 不能为空'));
            return 0
        }
        const sshConfigData = config.sshConfig.split('@')
        const sshConfig = {
            host: sshConfigData[0],
            port: sshConfigData[1],
            username: sshConfigData[2],
            password: sshConfigData[3],
            tryKeyboard: true
        }
        if (!sshConfigData[0] || !sshConfigData[1] || !sshConfigData[2] || !sshConfigData[3]) {
            console.log(pc.red('ssh连接配置格式不正确'));
            return 0
        }


        const remotePathErr = [null, undefined, '', '*', '/', '/*']
        if (remotePathErr.includes(config.remotePath) || config.remotePath.split('/').some(item => item.includes('\\'))) {
            console.log(pc.red('部署路径不规范'));
            return 0
        }

        runDeploy(sshConfig, config.remotePath)


    })


program.parse(process.argv)


// 运行部署
function runDeploy( /** @type {{host: string, port: number, username: string, password: string, tryKeyboard: boolean} | null} */ sshConfig = null, remotePath) {
    const fileList = fs.readdirSync('.')
    console.log('文件列表：');
    fileList.forEach(file => {
        console.log(`${file} ${fs.statSync(file).isFile() ? '文件' : '目录'}`);
    })
    // 创建readline接口实例
    const r1 = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    r1.question('确认部署到 ' + sshConfig.host + ' 服务器吗？[y/n]', async (answer) => {
        if (answer.toLowerCase() != 'y') {
            console.log('取消部署');
            r1.close()
            return 0
        }
        const { sshOperation } = require('./ssh.js')

        await sshOperation({ ...sshConfig }, remotePath)
        r1.close()
    })
}


// 检查配置文件是否存在
function checkConfigFile() {
    if (!fs.existsSync(path.resolve(__dirname, '../config.json'))) {
        fs.writeFileSync(path.resolve(__dirname, '../config.json'), JSON.stringify({ hosts: {} }, null, 2))

    }
    const conf = require('../config.json')
    // 查看配置文件格式是否正确
    if (typeof conf !== 'object') {
        fs.writeFileSync(path.resolve(__dirname, '../config.json'), JSON.stringify({ hosts: {} }, null, 2))
    }
    if (!conf.hosts) {
        conf.hosts = {}
        fs.writeFileSync(path.resolve(__dirname, '../config.json'), JSON.stringify(conf, null, 2))
    }
}
