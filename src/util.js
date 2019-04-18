// @ts-check

const _TextEncoder = typeof TextEncoder !== "undefined"
    ? TextEncoder
    : require("util").TextEncoder

/**
 * @param {any} x 
 */
const isDefined = (x) => {
    return typeof x !== "undefined" && x !== null
}

/**
 * @template T
 * @param {Array<T>} array 
 */
const safeArray = (array) => {
    return Array.isArray(array) ? array.concat() : []
}

/**
 * @template T
 * @param {Promise<T>} promise 
 * @param {number} ms 
 * @returns {Promise< T | null >}
 */
const setTimeoutDo = (promise, ms) => {
    /** @type {Promise<null>} */
    const t = new Promise((resolve) => {
        setTimeout(() => resolve(null), ms)
    })
    return Promise.race([promise, t])
}

/**
 * @param {NodeJS.TypedArray | DataView} buffer 
 */
const getRandomValues = (buffer) => {
    if (typeof top !== "undefined" && top.crypto) {
        return top.crypto.getRandomValues(buffer)
    } else {
        const nodeCrypto = require("crypto")
        nodeCrypto.randomFillSync(buffer)
    }
}

/**
 * 获取密码级的随机整数 (uint32)
 */
const getRandomInt = () => {
    const buffer = new Uint32Array(1)
    getRandomValues(buffer)
    return buffer[0]
}

/**
 * @param {number} length 长度 (字节)
 * @returns {ArrayBuffer}
 */
const getRandomData = (length) => {
    const buffer = new Uint8Array(length)
    getRandomValues(buffer)
    return buffer.buffer
}

/**
 * TypedArray 转为十六进制字符串表示法
 * @param { NodeJS.TypedArray | ArrayBuffer } buffer 
 */
const toHex = (buffer) => {
    // 将 TypedArray 转为 ArrayBuffer
    if (ArrayBuffer.isView(buffer)) {
        buffer = buffer.buffer
    }

    const byteArray = new Uint8Array(buffer)

    return [...byteArray].map(value => {
        const hexCode = value.toString(16)
        return hexCode.padStart(2, "0")
    }).join("")
}

/**
 * @param {string} text 
 */
const SHA256 = async (text) => {
    const encoder = new _TextEncoder()
    const data = encoder.encode(text)

    if (typeof top !== "undefined" && top.crypto) {
        const b = await top.crypto.subtle.digest("SHA-256", data)
        return toHex(b)
    } else {
        const crypto = require("crypto")
        const hash = crypto.createHash("sha256")
        hash.update(data)
        return hash.digest("hex")
    }
}

const getRandomSHA256 = () => {
    const data = getRandomData(32)
    return SHA256(toHex(data))
}

module.exports = {
    isDefined,
    safeArray,
    setTimeoutDo,
    getRandomValues,
    getRandomData,
    getRandomInt,
    getRandomSHA256,
    toHex,
    SHA256,
}
