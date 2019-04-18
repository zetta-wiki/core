// @ts-check

/// <reference path="../types/core.ts" />

const IPFS = require("ipfs")
const { isDefined } = require("./util.js")
const Admin = require("./admin.js")
const Pages = require("./pages.js")

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
     * @param {InitOptions} options 
     */
    static async createInstance(options = defaultOptions) {

        const ipfs = options.ipfs || defaultIPFS
        ipfs.on("error", (e) => console.error(e))

        // 等待ipfs初始化完成
        await new Promise((resolve) => {
            ipfs.on("ready", () => {
                resolve()
            })
            ipfs.start()
        })

        // 创建 OrbitDB 实例
        const orbitdb = await OrbitDB.createInstance(ipfs)

        const zettaWiki = new ZettaWiki(orbitdb, options)
        await zettaWiki.InitDB()

        return zettaWiki
    }

}

module.exports = ZettaWiki
