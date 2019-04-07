// @ts-check

/** 评论 ID */
type CommentID = string;

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
    key: string;

    payload: {
        value: CommentPayload;
    };
}

interface CommentObj extends CommentPayload {
    /** 评论 ID (CommentEntry.cid) */
    id: CommentID;

    /** 作者的用户公钥 (CommentEntry.key) */
    author: string;

    children?: CommentObj[] | null;
}
