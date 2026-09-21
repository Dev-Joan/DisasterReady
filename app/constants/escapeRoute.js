// Floor plan for the Flood "Escape Route Architect" mini-game.
// '#' wall (blocks both the player and the flood), '.' open floor,
// 'S' start (bedroom), 'G' safe high ground (goal row — never floods).
// Water pours in from the right side of the house (FLOOD_SOURCES) and
// the only quick lateral route (row 9) is walled off, so the flood has to
// take the long way around through row 3 — giving a real, learnable
// window of time to find the safer left-hand route.
export const GRID_ROWS = [
  'GGGGGGG',
  '..#..#.',
  '..#..#.',
  '.......',
  '#.###.#',
  '..#....',
  '.#..#.#',
  '...#...',
  '.#...#.',
  '..S#...'
];

export const COLS = GRID_ROWS[0].length;
export const ROWS = GRID_ROWS.length;

export const FLOOD_SOURCES = [{ r: 9, c: 5 }, { r: 9, c: 6 }];

function cellAt(r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return '#';
  return GRID_ROWS[r][c];
}

export function findCell(char) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (GRID_ROWS[r][c] === char) return { r, c };
    }
  }
  return null;
}

export const START = findCell('S');

// Breadth-first flood fill from the sources, skipping walls and the goal
// row (high ground is never underwater). Returns cells in the order the
// water reaches them, so the game can reveal one batch at a time.
export function computeFloodOrder() {
  const visited = new Set();
  const order = [];
  let frontier = FLOOD_SOURCES.map((s) => ({ ...s }));
  frontier.forEach((f) => visited.add(`${f.r}-${f.c}`));
  order.push(...frontier);

  while (frontier.length > 0) {
    const next = [];
    for (const { r, c } of frontier) {
      const neighbors = [{ r: r - 1, c }, { r: r + 1, c }, { r, c: c - 1 }, { r, c: c + 1 }];
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
