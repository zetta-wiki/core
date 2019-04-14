// @ts-check

/// <reference path="../types/entry.ts" />

interface PagePayload {
    /** 页面名称 */
    name: string;

    /** 创建时间，使用 ISO 8601 */
    date: string;

    /** 页面元数据数据库 hash 地址 */
    metadataDB: PageMetadataDBHash;

    /** 页面内容数据库 hash 地址 */
    contentDB: string;

    /** 页面评论数据库 hash 地址 */
    chatDB: string;
}

interface PageEntry extends Entry {
    cid: PageHash;

    /** 页面创建者的用户公钥 */
    key: UserKey;

    payload: {
        value: PagePayload;
    };
}

interface PageObj extends PagePayload {
    /** 页面创建者的用户公钥 (PageEntry.key) */
    creator: UserKey;
}
