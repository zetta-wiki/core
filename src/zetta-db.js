// @ts-check

/** @type { (addr: string) => boolean } */
// @ts-ignore
const isValidAddress = require("orbit-db").isValidAddress

class ZettaWikiDB {

    /**
     * @param {OrbitDB} orbitdb OrbitDB 实例
     */
    constructor(orbitdb) {
        this.orbitdb = orbitdb
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
