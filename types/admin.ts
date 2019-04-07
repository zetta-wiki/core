// @ts-check

/// <reference path="../types/entry.ts" />

interface AdminCommand {
    /** 封禁用户 */
    ban: boolean;
    /** 解封用户 */
    unban: boolean;

    /** 锁定页面更改 (保护页面) */
    lock: boolean;
    /** 解除页面保护 */
    unlock: boolean;

    /** 删除评论 */
    delete: boolean;
    /** 撤销删除评论 */
    undelete: boolean;
}

type AdminCommandText = keyof AdminCommand;

interface AdminPayload {
    /** 创建时间 */
    date: string;

    /** 管理的目标 */
    target: "page" | "comment" | "user";

    targetID: PageHash | CommentID | UserKey;

    command: AdminCommandText;
}

interface AdminEntry extends Entry {
    payload: {
        value: AdminPayload;
    };
}
