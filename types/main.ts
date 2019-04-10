// @ts-check

/// <reference types="ipfs" />

type OrbitDB = import("orbit-db").OrbitDB

interface InitOptions {

    /** Wiki 名称 */
    name: string;

    /** 主数据库 hash */
    mainDB: string;

    /** 管理员数据库 hash */
    adminDB: string;

    /** 
     * 管理员  
     * 默认为 ["*"] (所有人)
     */
    administrators?: string[];

    /** 
     * 使用的ipfs实例  
     * 需要设置 `EXPERIMENTAL: { pubsub: true }` 和 `start: false`
     */
    ipfs?: ipfs;

    /** 出错时的回调函数 */
    errCallback?: (err: Error) => any;

}
