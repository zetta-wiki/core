// @ts-check

/// <reference path="../types/entry.ts" />

interface CommentPayload {
    /** 创建时间 */
    date: string;

    /** 父评论的ID */
    parent?: CommentID | null;

    /** 评论内容 */
    content: string;
}

interface CommentEntry extends Entry {
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

    /** 顺序 (基于 Lamport Clock) */
    order: number;

    /** 作者的用户公钥 (CommentEntry.key) */
    author: UserKey;

    children?: CommentObj[] | null;

    /** 评论是否已删除 */
    deleted?: boolean;
}
