// @ts-check

/**
 * @typedef {import("orbit-db").OrbitDB} OrbitDB
 */

/**
 * determine if the provided address is a valid ZettaWiki database address
 * @param {string} addr 
 * @param {OrbitDB} orbitdb the OrbitDB instance
 * @returns {Promise<boolean>}
 */
const isValid = async (addr, orbitdb) => {

    // @ts-ignore
    const { isValidAddress } = require('orbit-db')

    if (isValidAddress(addr)) {
        const db = await orbitdb.open(addr)
        await db.close()

        /** @type {string[]} */
        // @ts-ignore
        const writeAccess = db.access._write
        return writeAccess && writeAccess.includes("*")
    }

    return false
}

/**
 * @param {any} x 
 */
const isDefined = (x) => {
    return typeof x !== "undefined"
}

module.exports = {
    isValid,
    isDefined,
}
