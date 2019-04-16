// @ts-check

enum Operation {
    INSERT = 1,
    EQUAL = 0,
    DELETE = -1,
}

interface DiffItem extends Array<string | number> {
    /** 差异操作 */
    [0]: Operation,

    /** 该项差异操作应用的字符数 */
    [1]: number,

    /** 该项差异操作增加/删除的字符串 */
    [2]?: string,
}

type Delta = DiffItem[]
