let previousValues: any[] = [];

export function statefulLog(...values: any[]) {
    if (areEqual(previousValues, values)) {
        return;
    }

    for (const v of values) {
        console.log(v);
    }

    previousValues = values;
}

function areEqual(a: any[], b: any[]): boolean {
    if (a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}
