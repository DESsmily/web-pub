#!/usr/bin/env node

const { program } = require('commander')
const path = require('node:path')
const fs = require('node:fs')
const readline = require('node:readline')


program.version(require('../package.json').version)

const sshCmd = program.command('ssh').description('ssh')
if (!fs.existsSync(path.resolve(__dirname, '../config.json'))) {
    fs.writeFileSync(path.resolve(__dirname, '../config.json'), JSON.stringify({ hosts: {} }, null, 2))

}
const conf = require('../config.json')
if (typeof conf !== 'object') {
    fs.writeFileSync(path.resolve(__dirname, '../config.json'), JSON.stringify({ hosts: {} }, null, 2))
}
if (!conf.hosts) {
    conf.hosts = {}
    fs.writeFileSync(path.resolve(__dirname, '../config.json'), JSON.stringify(conf, null, 2))
}
sshCmd.command('add').description('添加ssh连接配置 (web-pub ssh add test 127.0.0.1@22 root 123456)')
    .arguments('<alias> <host@port> <user> <password>', 'ip@端口（默认22，可不输） 用户名 密码')
    .action(async (alias, hostandport, user, password) => {
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


sshCmd.command('del').description('删除ssh连接配置 (web-pub del test)')
    .arguments('<alias>', '配置名称')
    .action(async (alias) => {
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

sshCmd.command('list').description('查看ssh连接配置 (web-pub list)')
    .action(async () => {
        const conf = require('../config.json')
        if (Object.keys(conf.hosts).length) {
            Object.keys(conf.hosts).forEach(alias => {
                const item = conf.hosts[alias]
                console.table(
                    [{ name: alias, host: item.host, port: item.port, username: item.username, password: item.password }],
                )
            })

        } else {
            console.log('配置为空');
        }
    })

program.command('use').description('使用ssh配置名称进行连接 部署')
    .arguments('<alias> <remotePath>', '配置名称 部署路径 （web-pub test /mnt/test）')
    .action(async (alias, remotePath) => {
        if (!alias) {
            console.log('配置名称不能为空');
            return 0
        }
        if (!remotePath) {
            console.log('部署路径不能为空');
            return 0
        }
        const conf = require('../config.json')
        const hosts = conf.hosts
        if (!Reflect.has(hosts, alias)) {
            console.log('配置名称 ' + alias + ' 不存在');
            return 0
        }
        const fileList = fs.readdirSync('.')
        if (fileList.includes('node_modules')) {
            console.log('目录不应该存在node_modules');
            return 0
        }
        if (!fileList.some(file => file.includes('.html'))) {
            console.log('目录未找到html文件');
            return 0
        }
        // 创建readline接口实例
        const r1 = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        r1.question('确认部署到 ' + hosts[alias].host + ' 服务器吗？[y/n]', async (answer) => {
            if (answer.toLowerCase() != 'y') {
                console.log('取消部署');
                r1.close()
                return 0
            }
            const { sshOperation } = require('./ssh.js')
            await sshOperation(alias, remotePath)
            r1.close()
        })

    })


program.parse(process.argv)