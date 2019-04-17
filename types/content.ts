// @ts-check

/// <reference path="../types/entry.ts" />

interface ContentPayload {
    /** 修改时间，使用 ISO 8601 */
    date: string;

    /** 完整页面内容 */
    content: string;
}

interface ContentEntry extends Entry {
    /** 内容数据库中的 entry 的 hash */
    cid: ContentEntryHash;

    /** 编辑者的用户公钥 */
    key: UserKey;

    payload: {
        value: ContentPayload;
    };
}
