// @ts-check

/// <reference path="../types/core.ts" />

const IPFS = require("ipfs")
const { isDefined } = require("./util.js")
const Admin = require("./admin.js")
const Pages = require("./pages.js")
const ZettaWikiDB = require("./zetta-db.js")

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
        const { mainDB, adminDB, administrators } = this.options

        const admin = await Admin.createInstance(orbitdb, adminDB, administrators)
        const pages = await Pages.createInstance(orbitdb, admin, mainDB)

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

        // 创建 OrbitDB 实例
        const errCallback = (options && options.errCallback) || defaultOptions.errCallback
        const orbitdb = await InitOrbitDB(ipfs, errCallback)

        const zettaWiki = new ZettaWiki(orbitdb, options)
        await zettaWiki.InitDB()

        return zettaWiki
    }

}

module.exports = ZettaWiki
