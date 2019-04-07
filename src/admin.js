// @ts-check

/// <reference path="../types/admin.ts" />

const { safeArray } = require("./util.js")

class Admin {

    /**
     * @param {AdminEntry[]} entries
     * @param {UserKey[]} administrators Wiki的管理员
     */
    constructor(entries, administrators = ["*"]) {
        this._admins = safeArray(administrators)

        this._entries = safeArray(entries)
            .filter(x => this._isValidAdminEntry(x))
            .sort(Admin._sortFn)

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
        return array.sort(Admin._sortFn)
    }

}

module.exports = Admin

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
    const admin = new Admin(entries)
    console.log(admin.getBannedUsers())
    console.log(admin.getDeletedComments())
}

_UNIT_TEST()

