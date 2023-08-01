import * as paper from 'paper'

export interface Tile {
  point: paper.Point
  size: paper.Size
  path: paper.Shape.Rectangle
}

export interface Grid {
  point: paper.Point
  size: paper.Size
  tiles: Array<Tile>
}

export const drawGrid = (rows: number, cols: number, point: paper.Point, size: paper.Size): Grid => {
  const rowSize = size.height / rows
  const colSize = size.width / cols

  const tiles = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tilePoint = new paper.Point(col * colSize, row * rowSize).add(point)
      const tileSize = new paper.Size(colSize, rowSize)

      tiles.push({
        point: tilePoint,
        size: tileSize,
        path: new paper.Shape.Rectangle({
            point: tilePoint,
            size: tileSize,
        })
      })
    }
  }

  return {
    point,
    size,
    tiles
  }
}