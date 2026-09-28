export const GRID_ROWS = ['GGGGGGG', '..#..#.', '..#..#.', '.......', '#.###.#', '..#....', '.#..#.#', '...#...', '.#...#.', '..S#...'];
export const COLS = GRID_ROWS[0].length;
export const ROWS = GRID_ROWS.length;
export const FLOOD_SOURCES = [{
  r: 9,
  c: 5
}, {
  r: 9,
  c: 6
}];
function cellAt(r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return '#';
  return GRID_ROWS[r][c];
}
export function findCell(char) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (GRID_ROWS[r][c] === char) return {
        r,
        c
      };
    }
  }
  return null;
}
export const START = findCell('S');
export function computeFloodOrder() {
  const visited = new Set();
  const order = [];
  let frontier = FLOOD_SOURCES.map(s => ({
    ...s
  }));
  frontier.forEach(f => visited.add(`${f.r}-${f.c}`));
  order.push(...frontier);
  while (frontier.length > 0) {
    const next = [];
    for (const {
      r,
      c
    } of frontier) {
      const neighbors = [{
        r: r - 1,
        c
      }, {
        r: r + 1,
        c
      }, {
        r,
        c: c - 1
      }, {
        r,
        c: c + 1
      }];
      for (const n of neighbors) {
        const key = `${n.r}-${n.c}`;
        if (visited.has(key)) continue;
        const type = cellAt(n.r, n.c);
        if (type === '#' || type === 'G') continue;
        visited.add(key);
        next.push(n);
      }
    }
    order.push(...next);
    frontier = next;
  }
  return order;
}
export function isWalkable(r, c) {
  const type = cellAt(r, c);
  return type === '.' || type === 'S' || type === 'G';
}
export function isGoal(r, c) {
  return cellAt(r, c) === 'G';
}
