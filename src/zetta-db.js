// @ts-check

/** @type { (addr: string) => boolean } */
// @ts-ignore
const isValidAddress = require("orbit-db").isValidAddress

const { getRandomData, toHex } = require("./util.js")

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
     * @param {string} dbName 
     */
    async _newDB(dbName) {
        const db = await this.orbitdb.log(dbName, this.options)
        await db.load()

        const address = db.address.toString()
        return address
    }

    /**
     * @param {string} name 页面名称
     * @param { "metadata" | "content" | "chat" } type 数据库类型
     * @returns {Promise<string>} 数据库地址
     */
    _newPageDB(name, type) {
        const randdata = toHex(getRandomData(16))
        const dbName = `zettawiki-${type}-${randdata}`
        return this._newDB(dbName)
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
     * @returns {Promise<string>} 数据库地址
     */
    newWikiDB() {
        const randdata = toHex(getRandomData(16))
        const dbName = `zettawiki-${randdata}`
        return this._newDB(dbName)
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

    /**
     * 加载数据库
     * @param {EventStore<any>} db 
     * @param {UserKey} creator
     */
    static async loadDB(db, creator) {
        await db.load()

        /** 
         * @type {string}
         * 当前用户公钥
         */
        // @ts-ignore
        const key = db.identity.publicKey
        if (key == creator) {
            return
        }

        await new Promise((resolve) => {
            db.events.on("replicated", () => {
                if (db.replicationStatus.progress >= db.replicationStatus.max) {
                    resolve()
                }
            })
        })

    }

}

module.exports = ZettaWikiDB
