// @ts-check

/// <reference path="../types/core.ts" />

const IPFS = require("ipfs")
const { isDefined } = require("./util.js")
const Admin = require("./admin.js")
const Pages = require("./pages.js")
const ZettaWikiDB = require("./zetta-db.js")
const Chat = require("./chat.js")
const Content = require("./content.js")

/** @type {typeof import("orbit-db").default} */
// @ts-ignore
const OrbitDB = require("orbit-db")

/** 默认ipfs实例 */
const defaultIPFS = new IPFS({
    EXPERIMENTAL: {
        pubsub: true,
        ipnsPubsub: true,
    },
    start: false,
})

/** 
 * 默认设置
 * @type {InitOptions}
 */
const defaultOptions = {
    name: "ZettaWiki",
    creator: "",
    mainDB: null,
    adminDB: null,
    administrators: ["*"],
    ipfs: null,
    errCallback: (e) => console.error(e),

}

/**
 * 创建 OrbitDB 实例
 * @param {ipfs} ipfs IPFS 实例
 */
const InitOrbitDB = async (ipfs, errCallback = defaultOptions.errCallback) => {
    // 绑定 errCallback
    ipfs.on("error", errCallback)

    if (!ipfs.isOnline()) {
        // 等待ipfs初始化完成
        await new Promise((resolve) => {
            ipfs.on("ready", async () => {
                await ipfs.start()
                resolve()
            })
        })
    }

    // 创建 OrbitDB 实例
    const orbitdb = await OrbitDB.createInstance(ipfs)
    return orbitdb
}

class ZettaWiki {

    /**
     * @private
     * @param {OrbitDB} orbitdb 一个 OrbitDB 实例
     * @param {InitOptions} options 
     */
    constructor(orbitdb, options = defaultOptions) {
        if (!isDefined(orbitdb)) {
            throw new Error("OrbitDB is a required argument. See https://github.com/zetta-wiki/core/")
        }

        // 应用默认设置
        options = Object.assign(defaultOptions, options)

        this.options = options
        this.orbitdb = orbitdb
    }

    async InitDB() {
        const orbitdb = this.orbitdb
        const { mainDB, adminDB, administrators, creator } = this.options

        const admin = await Admin.createInstance(orbitdb, adminDB, administrators, creator)
        const pages = await Pages.createInstance(orbitdb, admin, mainDB, creator)

        this.admin = admin
        this.pages = pages
    }

    get swarm() {
        if (this.options.ipfs) {
            return this.options.ipfs.swarm
        } else {
            return null
        }
    }

    static get Chat() {
        return Chat
    }

    /**
     * 从 PageObj 创建 Chat 实例
     * @param {PageObj} pageObj 
     */
    _createChatInstance(pageObj) {
        return Chat.createInstance(this.orbitdb, this.admin, pageObj.chatDB, pageObj.creator)
    }

    static get Content() {
        return Content
    }

    /**
     * 从 PageObj 创建 Content 实例
     * @param {PageObj} pageObj 
     */
    _createContentInstance(pageObj) {
        const { metadataDB, contentDB, creator } = pageObj
        return Content.createInstance(this.orbitdb, this.admin, metadataDB, contentDB, creator)
    }

    /**
     * 根据页面名称创建 Content 实例
     * @param {string} pageName 
     */
    async _createContentInstanceByName(pageName) {
        const pageObj = await this.pages.getPageObjByName(pageName)
        return this._createContentInstance(pageObj)
    }

    /**
     * 新建页面
     * @param {string} name 页面名称
     * @param {string} content 页面内容
     * @returns {Promise<PageObj>}
     */
    async newPage(name, content) {
        const pageHash = await this.pages.addPage(name)
        const pageObj = await this.pages.getPageObjByHash(pageHash)
        const c = await this._createContentInstance(pageObj)
        await c.newPageContent(content)
        return pageObj
    }

    /**
     * 获取页面最新内容
     * @param {string} pageName 页面名称
     */
    async getPageContent(pageName) {
        const c = await this._createContentInstanceByName(pageName)
        const content = c.getContent()
        return content
    }

    /**
     * 获取页面编辑历史
     * @param {string} pageName 页面名称
     * @param {number} start 
     * @param {number} end 
     */
    async getPageHistory(pageName, start = 0, end = Infinity) {
        const c = await this._createContentInstanceByName(pageName)
        const o = [...c.getAllMetadataObjs()]
        return o.slice(start, end)
    }

    /**
     * 获取页面的历史内容
     * @param {string} pageName 页面名称
     * @param {ContentEntryHash} entryHash 指向内容数据库中的 entry 的 hash (MetadataObj.entryHash)
     */
    async getPageHistoryContent(pageName, entryHash) {
        const c = await this._createContentInstanceByName(pageName)
        return c.getContentByEntryHash(entryHash)
    }

    /**
     * 编辑页面
     * @param {string} pageName 页面名称
     * @param {string} revision 编辑后的页面内容
     */
    async editPage(pageName, revision) {
        const c = await this._createContentInstanceByName(pageName)
        const original = c.getContent()
        await c.edit(original, revision)
    }

    /**
     * 创建 ZettaWiki 站点
     * @param {string} name 站点名称
     * @param {ipfs} ipfs IPFS 实例
     * @param {OrbitDB} orbitdb OrbitDB 实例
     * @returns {Promise<InitOptions>}
     */
    static async createWiki(name, ipfs = defaultIPFS, orbitdb = null) {
        if (!orbitdb && ipfs) {
            orbitdb = await InitOrbitDB(ipfs)
        }

        const zettaWikiDB = new ZettaWikiDB(orbitdb)

        // @ts-ignore
        const key = orbitdb.identity.publicKey

        const mainDBAddr = await zettaWikiDB.newWikiDB()
        const adminDBAddr = await zettaWikiDB.newWikiDB()

        return {
            name,
            creator: key,
            mainDB: mainDBAddr,
            adminDB: adminDBAddr,
            administrators: [key],
        }
    }

    /**
     * @param {InitOptions} options 
     */
    static async createInstance(options = defaultOptions) {

        const ipfs = options.ipfs || defaultIPFS
        options.ipfs = ipfs

        // 创建 OrbitDB 实例
        const errCallback = (options && options.errCallback) || defaultOptions.errCallback
        const orbitdb = await InitOrbitDB(ipfs, errCallback)

        const zettaWiki = new ZettaWiki(orbitdb, options)
        await zettaWiki.InitDB()

        return zettaWiki
    }

}

module.exports = ZettaWiki
