// @ts-check

/// <reference path="../types/chat.ts" />

const { safeArray } = require("./util.js")

class Comments {

    /**
     * @param {CommentEntry[]} entries 
     * @param {UserKey[]} bannedUsers
     * @param {CommentID[]} deletedComments
     */
    constructor(entries, bannedUsers = [], deletedComments = []) {
        this._entries = safeArray(entries)
        this._bannedUsers = safeArray(bannedUsers)
        this._deletedComments = safeArray(deletedComments)

        this._parseEntries()

        /** @type {CommentObj[]} */
        this._commentsTree = null
    }

    /**
     * 解析、格式化评论数据
     */
    _parseEntries() {
        const isDeleted = this._isDeleted.bind(this)
        const isValid = Comments.isValidCommentEntry

        /** @type {CommentObj[]} */
        const parsedEntries = this._entries.filter(isValid).map((x) => {
            const clock = x.clock && x.clock.time
            return {
                id: x.cid,
                order: Number.isInteger(clock) ? clock : -1,
                author: x.key,
                ...x.payload.value,
                deleted: isDeleted(x) || undefined,
            }
        })

        Comments._sort(parsedEntries)

        this._parsedEntries = parsedEntries
        return parsedEntries
    }

    /**
     * 判断评论是否是已删除状态
     * @param {CommentEntry} entry 
     */
    _isDeleted(entry) {
        const id = entry.cid
        const author = entry.key
        return this._bannedUsers.includes(author)
            || this._deletedComments.includes(id)
    }

    toTree() {
        if (this._commentsTree) {
            return this._commentsTree
        }

        const parsedEntries = this._parsedEntries

        const entriesMap = new Map(
            parsedEntries.map((x) => {
                return [x.id, x]
            })
        )

        for (const entry of parsedEntries) {
            const parent = entry.parent && entriesMap.get(entry.parent)
            if (parent) {
                if (!parent.children) {
                    parent.children = []
                }
                parent.children.push(entry)
            }
        }

        /** @type {CommentObj[]} */
        const entriesTree = []
        entriesMap.forEach((entry) => {
            const parent = entry.parent
            if (!parent || !entriesMap.get(parent)) {
                entry.parent = null
                return entriesTree.push(entry)
            }
        })

        const tree = Comments._sort(entriesTree).reverse()

        this._commentsTree = tree
        return tree
    }

    /**
     * @param {string | number} space 
     */
    toJSON(space = 0) {
        if (!this._commentsTree) {
            this._commentsTree = this.toTree()
        }

        const tree = this._commentsTree.concat()
        tree.toString = () => {
            return JSON.stringify(tree, null, space)
        }

        return tree
    }

    /**
     * 排序 CommentObj[]
     * @param {CommentObj[]} array 
     */
    static _sort(array) {
        return array.sort((a, b) => {
            if (a.order == b.order) {
                return +new Date(a.date) - +new Date(b.date)
            } else {
                return a.order - b.order
            }
        })
    }

    /**
     * @param {CommentEntry} entry 
     */
    static isValidCommentEntry(entry) {
        const payload = entry.payload.value
        const keys = [
            "date",
            "parent",
            "content",
        ]

        return keys.every(key => payload.hasOwnProperty(key))
            && !isNaN(Date.parse(payload.date))
            && typeof payload.content === "string"
            && (payload.parent === null || typeof payload.parent === "string")
    }

}

module.exports = Comments

const _UNIT_TEST = () => {
    const entries = [
        {
            cid: "a",
            key: "banned",
            clock: { time: 1 },
            payload: {
                value: {
                    date: "2019-04-07T04:09:57.603Z",
                    parent: "root",
                    content: ""
                }
            }
        },
        {
            cid: "b",
            key: "",
            clock: { time: 2 },
            payload: {
                value: {
                    date: "2019-04-07T04:09:57.603Z",
                    parent: "a",
                    content: ""
                }
            }
        },
        {
            cid: "c",
            key: "",
            clock: { time: 3 },
            payload: {
                value: {
                    date: "2019-04-07T04:10:57.603Z",
                    parent: "a",
                    content: ""
                }
            }
        },
        {
            cid: "d",
            key: "",
            clock: { time: 4 },
            payload: {
                value: {
                    date: "2019-04-07T04:09:57.603Z",
                    parent: "b",
                    content: ""
                }
            }
        },
        {
            cid: "e",
            key: "",
            clock: { time: 5 },
            payload: {
                value: {
                    date: "2019-04-07T05:09:57.603Z",
                    parent: null,
                    content: ""
                }
            }
        },
    ]
    const comments = new Comments(entries, ["banned"])
    const tree = comments.toTree()
    console.log(JSON.stringify(tree, null, 4))
    // console.log(JSON.stringify(comments, null, 4))
    // require("fs").writeFileSync("1.json", comments.toJSON())
}

_UNIT_TEST()
