// @ts-check
// 主数据库

/// <reference path="../types/pages.ts" />

const ZettaWikiDB = require("./zetta-db.js")

class Pages {

    /**
     * @param {EventStore<any>} db 主数据库实例 (已加载状态)
     * @param {Admin} admin Admin (admin.js) 实例 
     * @param {ZettaWikiDB} zettaDB ZettaWikiDB (zetta-db.js) 实例
     */
    constructor(db, admin, zettaDB) {
        this.db = db
        this.admin = admin
        this.zettaDB = zettaDB
    }

    /**
     * @returns {EntryIterator<PageEntry>}
     */
    _getEntriesIterator() {
        // @ts-ignore
        return this.db.iterator({ limit: -1 })
    }

    /**
     * @param {PageEntry} entry 
     * @param {boolean} checkUserBanned 检查是否是被封禁用户创建的页面
     * @param {boolean} checkDeleted 检查页面是否已删除
     */
    _isValidPageEntry(entry, checkUserBanned = true, checkDeleted = true) {
        const payload = entry.payload.value
        const keys = [
            "name",
            "date",
            "metadataDB",
            "contentDB",
            "chatDB",
        ]

        return keys.every(key => payload.hasOwnProperty(key))
            && keys.every(key => typeof payload[key] === "string")
            && !isNaN(Date.parse(payload.date))
            && payload.name == payload.name.trim()
            && checkUserBanned ? !this.admin.isBanned(entry.key) : true
    }

    /**
     * @param {PageObj} pageObj 
     */
    async _isValidPageObj(pageObj) {
        const keys = [
            "name",
            "date",
            "metadataDB",
            "contentDB",
            "chatDB",
            "creator"
        ]

        if (!keys.every(key => pageObj.hasOwnProperty(key))) {
            return false
        }

        const { contentDB, metadataDB, chatDB } = pageObj
        const dbAddrs = [contentDB, metadataDB, chatDB]

        const isValidList = await Promise.all(
            dbAddrs.map((addr) => {
                return this.zettaDB.isValidDB(addr)
            })
        )

        const isAllValid = isValidList.every(x => !!x)
        return isAllValid
    }

    /**
     * 解析 PageEntry
     * @param {PageEntry} entry 
     * @returns {PageObj}
     */
    _parsePageEntry(entry) {
        const payload = entry.payload.value
        const creator = entry.key
        return Object.assign({}, payload, { creator })
    }

    /**
     * @param {string} name 页面名称
     * @alias getPageByName
     */
    async getPageObj(name) {
        const iterator = this._getEntriesIterator()

        for (const entry of iterator) {
            if (!this._isValidPageEntry(entry)) {
                continue
            }

            const pageObj = this._parsePageEntry(entry)

            if (pageObj.name.trim() == name.trim()) {
                const isValid = await this._isValidPageObj(pageObj)
                if (isValid) {
                    return pageObj
                }
            }
        }

        return null
    }

    /**
     * @param {string} name 页面名称
     */
    getPageObjByName(name) {
        return this.getPageObj(name)
    }

    /**
     * @param {PageHash} hash 页面在主数据库中的hash
     */
    getPageObjByHash(hash) {
        /** @type {PageEntry} */
        const entry = this.db.get(hash)

        if (!this._isValidPageEntry(entry, false, false)) {
            return null
        }

        return this._parsePageEntry(entry)
    }

    addPage() {

        /** 当前用户公钥 */
        const publicKey = this.admin.getPublicKey()
        if (this.admin.isBanned(publicKey)) {
            return
        }

        const name = o.name.trim()

    }

    /**
     * @typedef {import("./admin.js")} Admin
     * @param {OrbitDB} orbitdb OrbitDB 实例
     * @param {Admin} admin Admin (admin.js) 实例 
     * @param {string} mainDBAddr 主数据库 hash 地址
     */
    static async createInstance(orbitdb, admin, mainDBAddr) {
        // 打开数据库
        // @ts-ignore
        const db = await orbitdb.log(mainDBAddr, { create: false })
        await db.load()

        const zettaDB = new ZettaWikiDB(orbitdb)

        return new Pages(db, admin, zettaDB)
    }

}

module.exports = Pages
