// @ts-check

/** 评论 ID */
type CommentID = string;

/** 用户公钥 */
type UserKey = string;

interface CommentPayload {
    /** 创建时间 */
    date: string;

    /** 父评论的ID */
    parent?: string | null;

    /** 评论内容 */
    content: string;
}

interface CommentEntry {
    /** 评论 ID */
    cid: CommentID;

    /** 作者的用户公钥 */
    key: UserKey;

    payload: {
        value: CommentPayload;
    };
}

interface CommentObj extends CommentPayload {
    /** 评论 ID (CommentEntry.cid) */
    id: CommentID;

    /** 作者的用户公钥 (CommentEntry.key) */
    author: UserKey;

    children?: CommentObj[] | null;

    /** 评论是否已删除 */
    deleted?: boolean;
}
