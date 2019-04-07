// @ts-check

/** 用户公钥 */
type UserKey = string;

/** 评论 ID */
type CommentID = string;

/** 页面元数据数据库的hash */
type PageHash = string;

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
