// @ts-check

/// <reference path="../types/metadata.ts" />
/// <reference path="../types/content.ts" />

const Diff = require("@xmader/textdiff")
const { SHA256 } = require("./util.js")

class Content {

    /**
     * @param {EventStore<MetadataEntry>} metadatadb 页面内容数据库实例 (已加载状态)
     * @param {EventStore<ContentEntry>} contentdb 页面元数据数据库实例 (已加载状态)
     * @param {Admin} admin Admin (admin.js) 实例 
     */
    constructor(metadatadb, contentdb, admin) {
        this.metadatadb = metadatadb
        this.contentdb = contentdb
        this.admin = admin
    }

    /**
     * @template {Entry} T
     * @param {EventStore<T>} db 数据库实例
     * @returns {EntryIterator<T>}
     */
    _getEntriesIterator(db) {
        // @ts-ignore
        return db.iterator({ limit: -1 })
    }

    /**
     * @param {ContentEntry} entry 
     * @param {boolean} checkUserBanned 检查是否是被封禁用户编辑的页面
     * @param {boolean} checkDeleted 检查本次编辑是否已被删除
     */
    _isValidContentEntry(entry, checkUserBanned = true, checkDeleted = true) {
        const payload = entry.payload.value
        const keys = [
            "date",
            "content",
        ]

        return keys.every(key => payload.hasOwnProperty(key))
            && keys.every(key => typeof payload[key] === "string")
            && !isNaN(Date.parse(payload.date))
            && checkUserBanned ? !this.admin.isBanned(entry.key) : true
    }

    /**
     * 获取最新完整页面内容
     */
    getContent() {
        for (const entry of this._getEntriesIterator(this.contentdb)) {
            if (this._isValidContentEntry(entry)) {
                return entry.payload.value.content
            }
        }
    }

    /**
     * 编辑页面
     * @param {string | null} original 编辑前的页面内容
     * @param {string} revision 编辑后的页面内容
     */
    async edit(original, revision) {
        const date = new Date().toISOString()
        const originalSHA256 = original ? await SHA256(original) : null
        const revisionSHA256 = await SHA256(revision)

        const delta = Diff.create(original, revision)
        const added = Diff.getTotalInserted(delta)
        const deleted = Diff.getTotalDeleted(delta)

        /** @type {ContentPayload} */
        const contentPayload = {
            date,
            content: revision,
        }

        const entryHash = await this.contentdb.add(contentPayload)

        /** @type {MetadataPayload} */
        const metadataPayload = {
            date,
            entryHash,
            parent: originalSHA256,
            sha256: revisionSHA256,
            added,
            deleted,
            diff: delta,
        }

        return await this.metadatadb.add(metadataPayload)
    }

    /**
     * @typedef {import("./admin.js")} Admin
     * @param {OrbitDB} orbitdb OrbitDB 实例
     * @param {Admin} admin Admin (admin.js) 实例 
     * @param {string} metadataDBAddr 页面内容数据库地址
     * @param {string} contentDBAddr 页面元数据数据库地址
     */
    static async createInstance(orbitdb, admin, metadataDBAddr, contentDBAddr) {
        // 打开数据库
        // @ts-ignore
        const metadatadb = await orbitdb.log(metadataDBAddr, { create: false })
        await metadatadb.load()

        // @ts-ignore
        const contentdb = await orbitdb.log(contentDBAddr, { create: false })
        await contentdb.load()

        return new Content(metadatadb, contentdb, admin)
    }

}

module.exports = Content
