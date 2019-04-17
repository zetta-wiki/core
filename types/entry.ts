// @ts-check

/** 用户公钥 */
type UserKey = string;

/** 评论 ID */
type CommentID = string;

/** 页面元数据数据库的hash */
type PageMetadataDBHash = string;

/** 页面在主数据库中的hash */
type PageHash = string;

/** 内容数据库中的 entry 的 hash */
type ContentEntryHash = string;

/** 完整页面内容的 sha256 哈希值 */
type ContentSHA256 = string;

interface Entry {
    /** ID */
    cid: string;

    /** 用户公钥 */
    key: UserKey;

    /** Lamport Clock */
    clock: {
        time: number;
    }

    payload: {
        value: Object;
    };
}

type EventStore<T> = import("orbit-db-eventstore").EventStore<T>

type EntryIterator<T> = IterableIterator<T> & {
    collect(): T[]
}
