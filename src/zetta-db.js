// @ts-check

/** @type { (addr: string) => boolean } */
// @ts-ignore
const isValidAddress = require("orbit-db").isValidAddress

const { getRandomInt, SHA256 } = require("./util.js")

/** 创建数据库时的选项 */
const dbOptions = {
    accessController: {
        // type: 'orbitdb',
        write: [
            "*"
        ]
    }
}

class ZettaWikiDB {

    /**
     * @param {OrbitDB} orbitdb OrbitDB 实例
     * @param {IStoreOptions} options 创建数据库时的选项
     */
    constructor(orbitdb, options = dbOptions) {
        this.orbitdb = orbitdb
        this.options = options
    }

    /**
     * @param {string} name 页面名称
     * @param { "metadata" | "content" | "chat" } type 数据库类型
     * @returns {Promise<string>} 数据库地址
     */
    async _newPageDB(name, type) {
        const time = +new Date()
        const randint = getRandomInt()
        const sha256Name = await SHA256(name)
        const dbName = `zetta-${sha256Name.slice(0, 7)}-${type}-${time}-${randint}`

        const db = await this.orbitdb.log(dbName, this.options)
        await db.load()

        const address = db.address.toString()
        return address
    }

    /**
     * @param {string} name 页面名称
     */
    newMetadataDB(name) {
        return this._newPageDB(name, "metadata")
    }

    /**
     * @param {string} name 页面名称
     */
    newContentDB(name) {
        return this._newPageDB(name, "content")
    }

    /**
     * @param {string} name 页面名称
     */
    newChatDB(name) {
        return this._newPageDB(name, "chat")
    }

    /**
     * @param {string} name 页面名称
     */
    async newAllPageDB(name) {
        return {
            metadataDB: await this.newMetadataDB(name),
            contentDB: await this.newContentDB(name),
            chatDB: await this.newChatDB(name),
        }
    }

    /**
     * 判断提供的数据库地址是否指向一个合法的 ZettaWiki 数据库
     * @param {string} addr 
     * @returns {Promise<boolean>}
     */
    async isValidDB(addr) {

        if (isValidAddress(addr)) {
            try {
                const db = await this.orbitdb.open(addr)
                await db.close()

                /** @type {string[]} */
                // @ts-ignore
                const writeAccess = db.access._write
                return writeAccess && writeAccess.includes("*")
            } catch (err) {
                console.error(err)
                return false
            }
        }

        return false
    }

}

module.exports = ZettaWikiDB
