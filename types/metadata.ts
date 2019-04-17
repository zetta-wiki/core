// @ts-check

/// <reference path="../types/entry.ts" />

type Delta = import("@xmader/textdiff").Delta

interface MetadataPayload {
    /** 修改时间，使用 ISO 8601 */
    date: string;

    /** 指向内容数据库中的 entry 的hash */
    entryHash: ContentEntryHash;

    /** 上一个版本的完整页面内容的 sha256 哈希值。如果是新建页面，则为 null */
    parent: ContentSHA256 | null;

    /** 完整页面内容的 sha256 哈希值 */
    sha256: ContentSHA256;

    /** 增加的字符数 */
    add: number;

    /** 删除的字符数 */
    deleted: number;

    /** 与上一个版本的差异，使用 @xmader/textdiff */
    diff: Delta;
}

interface MetadataEntry extends Entry {
    cid: string;

    /** 编辑者的用户公钥 */
    key: UserKey;

    payload: {
        value: MetadataPayload;
    };
}
