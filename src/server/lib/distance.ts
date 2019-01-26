function distance(p1: any, p2: {x: number, y: number}): number {
    let d1 = p1.x - p2.x;
    let d2 = p1.y - p2.y;
    return d1 * d1 + d2 * d2;
}

export default distance;
