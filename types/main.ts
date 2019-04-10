// @ts-check

/// <reference types="ipfs" />

type OrbitDB = import("orbit-db").default

interface InitOptions {

    /** 
     * 使用的ipfs实例  
     * 需要设置 `EXPERIMENTAL: { pubsub: true }` 和 `start: false`
     */
    ipfs?: ipfs;

    /** 出错时的回调函数 */
    errCallback?: (err: Error) => any;

}
