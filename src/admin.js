// @ts-check

/// <reference path="../types/admin.ts" />
/// <reference path="../types/core.ts" />

const { safeArray } = require("./util.js")
const ZettaWikiDB = require("./zetta-db.js")

class PermissionError extends Error {
    /**
     * @param {string} message 
     */
    constructor(message = "Current user is not an administrator.") {
        if (message) message = ": " + message
        super("Permission denied" + message)
        this.name = "PermissionError"
    }
}

class AdminInfo {

    /**
     * @param {AdminEntry[]} entries
     * @param {UserKey[]} administrators Wiki的管理员
     */
    constructor(entries, administrators = []) {
        this._admins = safeArray(administrators)

        this._entries = safeArray(entries)
            .filter(x => this._isValidAdminEntry(x))
            .sort(AdminInfo._sortFn)

        this._bannedUsers = null
        this._deletedComments = null
    }

    get bannedUsers() {
        if (this._bannedUsers) {
            return this._bannedUsers
        }

        const entries = this._entries

        /** @type {Set<UserKey>} */
        const bannedUsersSet = new Set()
        entries.forEach((entry) => {
            const payload = entry.payload.value
            const { target, command, targetID } = payload
            if (target == "user") {
                /* eslint-disable indent */
                switch (command) {
                    case "ban":
                        bannedUsersSet.add(targetID)
                        break

                    case "unban":
                        bannedUsersSet.delete(targetID)
                        break
                }
                /* eslint-enable */
            }
        })

        return (this._bannedUsers = [...bannedUsersSet])
    }

    get deletedComments() {
        if (this._deletedComments) {
            return this._deletedComments
        }

        const entries = this._entries

        /** @type {Set<CommentID>} */
        const deletedCommentsSet = new Set()
        entries.forEach((entry) => {
            const payload = entry.payload.value
            const { target, command, targetID } = payload
            if (target == "comment") {
                /* eslint-disable indent */
                switch (command) {
                    case "delete":
                        deletedCommentsSet.add(targetID)
                        break

                    case "undelete":
                        deletedCommentsSet.delete(targetID)
                        break
                }
                /* eslint-enable */
            }
        })

        return (this._deletedComments = [...deletedCommentsSet])
    }

    getBannedUsers() {
        return this.bannedUsers
    }

    getDeletedComments() {
        return this.deletedComments
    }

    /**
     * @param {AdminEntry} entry 
     */
    _isValidAdminEntry(entry) {
        const payload = entry.payload.value
        const keys = [
            "date",
            "target",
            "targetID",
            "command",
        ]

        return (this._admins.includes(entry.key) || this._admins.includes("*"))
            && keys.every(key => payload.hasOwnProperty(key))
            && keys.every(key => typeof payload[key] === "string")
            && !isNaN(Date.parse(payload.date))
    }

    /**
     * @param {AdminEntry} a
     * @param {AdminEntry} b
     */
    static _sortFn(a, b) {
        const aOrder = a.clock.time
        const bOrder = b.clock.time
        if (aOrder == bOrder) {
            const aDate = new Date(a.payload.value.date)
            const bDate = new Date(b.payload.value.date)
            return +aDate - +bDate
        } else {
            return aOrder - bOrder
        }
    }

    /**
     * 排序 AdminEntry[]
     * @param {AdminEntry[]} array 
     */
    static _sort(array) {
        return array.sort(AdminInfo._sortFn)
    }

}

class Admin {

    /**
     * @param {EventStore<any>} db 管理员数据库实例 (已加载状态)
     * @param {string[]} administrators 
     */
    constructor(db, administrators) {
        this.db = db
        this.administrators = administrators
    }

    _getEntries() {
        return this.db.iterator({ limit: -1 }).collect().concat()
    }

    _getAdminInfo() {
        // @ts-ignore
        return new AdminInfo(this._getEntries(), this.administrators)
    }

    getBannedUsers() {
        return this._getAdminInfo().getBannedUsers()
    }

    getDeletedComments() {
        return this._getAdminInfo().getDeletedComments()
    }

    /**
     * 获取当前用户公钥
     * @returns {string}
     */
    getPublicKey() {
        // @ts-ignore
        return this.db.identity.publicKey
    }

    /**
     * 判断当前用户是否是管理员
     */
    isAdmin() {
        const { administrators } = this

        /** 当前用户公钥 */
        const key = this.getPublicKey()

        return administrators.includes(key) || administrators.includes("*")
    }

    /**
     * 判断用户是否被封禁
     * @param {UserKey} key 用户公钥
     */
    isBanned(key = this.getPublicKey()) {
        return this.getBannedUsers().includes(key)
    }

    /**
     * @private
     * 添加管理记录
     * @param {AdminTarget} target 
     * @param {string} targetID 
     * @param {AdminCommandText} command 
     */
    _add(target, targetID, command) {
        if (!this.isAdmin()) {
            throw new PermissionError()
        }

        /** @type {AdminPayload} */
        const payload = {
            date: new Date().toISOString(),
            target,
            targetID,
            command,
        }

        return this.db.add(payload)
    }

    /**
     * @param {UserKey} userKey 管理对象的用户公钥
     * @returns {Promise<string>} 此条管理记录的 hash
     */
    banUser(userKey) {
        return this._add("user", userKey, "ban")
    }

    /**
     * @param {UserKey} userKey 管理对象的用户公钥
     * @returns {Promise<string>} 此条管理记录的 hash
     */
    unbanUser(userKey) {
        return this._add("user", userKey, "unban")
    }

    /**
     * @param {CommentID} commentID 评论ID
     * @returns {Promise<string>} 此条管理记录的 hash
     */
    deleteComment(commentID) {
        return this._add("comment", commentID, "delete")
    }

    /**
     * @param {CommentID} commentID 评论ID
     * @returns {Promise<string>} 此条管理记录的 hash
     */
    undeleteComment(commentID) {
        return this._add("comment", commentID, "undelete")
    }

    /**
     * @param {OrbitDB} orbitdb 
     * @param {string} adminDBAddr 
     * @param {string[]} administrators 
     * @param {UserKey} wikiCreator Wiki 的创建者的用户公钥
     */
    static async createInstance(orbitdb, adminDBAddr, administrators, wikiCreator) {
        // 打开数据库
        // @ts-ignore
        const db = await orbitdb.log(adminDBAddr, { create: false })
        await ZettaWikiDB.loadDB(db, wikiCreator)

        return new Admin(db, administrators)
    }

}

module.exports = Admin

/* eslint-disable-next-line no-unused-vars */
const _UNIT_TEST = () => {
    /** @type {AdminEntry[]} */
    const entries = [
        {
            cid: "",
            key: "",
            clock: { time: 1 },
            payload: {
                value: {
                    date: "2019-04-07T04:09:57.603Z",
                    target: "user",
                    targetID: "u1",
                    command: "ban"
                }
            }
        },
        {
            cid: "",
            key: "",
            clock: { time: 2 },
            payload: {
                value: {
                    date: "2019-04-07T04:09:57.603Z",
                    target: "user",
                    targetID: "u1",
                    command: "unban"
                }
            }
        },
        {
            cid: "",
            key: "",
            clock: { time: 3 },
            payload: {
                value: {
                    date: "2019-04-07T04:09:57.603Z",
                    target: "user",
                    targetID: "u2",
                    command: "ban"
                }
            }
        },
        {
            cid: "",
            key: "",
            clock: { time: 4 },
            payload: {
                value: {
                    date: "2019-04-07T04:09:57.603Z",
                    target: "comment",
                    targetID: "c1",
                    command: "delete"
                }
            }
        },
    ]
    const admin = new AdminInfo(entries)
    console.log(admin.getBannedUsers())
    console.log(admin.getDeletedComments())
}

