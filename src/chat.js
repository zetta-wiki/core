// @ts-check

/**
 * @param {CommentEntry} entry 
 */
const isValidComment = (entry) => {
    const payload = entry.payload.value
    const keys = [
        "date",
        "parent",
        "content",
    ]

    return keys.every(key => payload.hasOwnProperty(key))
        && !isNaN(Date.parse(payload.date))
        && typeof payload.content === "string"
        && (payload.date === null || typeof payload.date === "string")
}

/**
 * @param {CommentEntry[]} entries 
 */
const toTree = (entries) => {

    /** @type {CommentObj[]} */
    const parsedEntries = entries.filter(isValidComment).map((x) => {
        return {
            id: x.cid,
            author: x.key,
            ...x.payload.value
        }
    })

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

    return entriesTree.sort((a, b) => {
        return +new Date(b.date) - +new Date(a.date)
    })

}

const _UNIT_TEST = () => {
    const tree = toTree([
        {
            cid: "a",
            key: "",
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
            payload: {
                value: {
                    date: "2019-04-07T04:09:57.603Z",
                    parent: "a",
                    content: ""
                }
            }
        },
        {
            cid: "d",
            key: "",
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
            payload: {
                value: {
                    date: "2019-04-07T05:09:57.603Z",
                    parent: null,
                    content: ""
                }
            }
        },
    ])
    console.log(JSON.stringify(tree, null, 4))
}

_UNIT_TEST()
