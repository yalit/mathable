export function countItems<T extends string | number>(arr: T[], value: T): number {
    if (!arr.includes(value)) {
        return 0
    }
    let counts: { [k: string | number]: number } = {}

    arr.forEach((v: T) => {
        if (!(v in counts)) {
            counts[v] = 0
        }
        if (v === value) {
            counts[v] += 1
        }
    })

    return counts[value]
}
