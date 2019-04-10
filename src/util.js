// @ts-check

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
const safeArray = (array) =>{
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

module.exports = {
    isDefined,
    safeArray,
    setTimeoutDo,
}
