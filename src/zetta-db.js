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
        const db = await this.orbitdb.create(dbName, "eventlog", this.options)
        await db.load()

        // @ts-ignore
        await db._addOperation({
            op: "INIT",
            key: null,
            value: {
                op: "INIT",
                date: new Date().toISOString(),
                // @ts-ignore
                creator: db.identity.publicKey,
            }
        })

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
                const db = await this.orbitdb.open(addr, { type: "eventlog" })
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
     * 判断数据库是否已经加载完全
     * @param {EventStore<any>} db 
     * @param {UserKey} creator 数据库的创建者
     */
    static isLoaded(db, creator) {
        try {
            const entries = db.iterator({ limit: -1 }).collect()
            const isInitedByCreator = entries.some((entry) => {
                // @ts-ignore
                return entry.payload.op == "INIT" && entry.key == creator
            })
            return isInitedByCreator && db.replicationStatus.progress >= db.replicationStatus.max    
        } catch (err) {
            return false
        }
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
        // 数据库由当前用户创建
        if (key == creator) {
            return
        }

        // 数据库已经加载完全
        if (ZettaWikiDB.isLoaded(db, creator)) {
            return
        }

        // 等待数据库加载完全
        await new Promise((resolve) => {
            const listener = () => {
                if (ZettaWikiDB.isLoaded(db, creator)) {
                    db.events.removeListener("replicated", listener)
                    resolve()
                }
            }
            db.events.on("replicated", listener)
        })

    }

}

module.exports = ZettaWikiDB
