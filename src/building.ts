import * as paper from 'paper'
import * as math from 'mathjs'
import * as patterns from './patterns'
import chroma from 'chroma-js'

export interface Palette {
  strokeColor: string
  tileColor: string
  windowColor: string
}

export interface BuildingSettings extends Palette {
  buildingHeightMaxFactor: number,
  buildingHeightMinFactor: number,
  buildingWidthMinFactor: number,
  buildingWidthMaxFactor: number,
  buildingWidthFactorThreshold: number,
  buildingWidthMinimumFactor: number,
  buildingCount: number,
  windowRadius: number,
  windowFrameOffsetFactor: number,
  windowMinFrameOffset: number,
  windowGridOffsetFactor: number,
  windowGridCols: number
}

export interface BuildingTile extends patterns.Tile {
  currentColor: string
  nextColor: string
}

export interface BuildingWindow {
  group: paper.Group
  frame: paper.Path
  glass: paper.Path,
  division: paper.Path
}

export interface Building {
  group: paper.Group 
  body: paper.Path
  tiles: Array<BuildingTile>
  windows: Array<BuildingWindow>
}

export const drawTiles = (point: paper.Point, size: paper.Size, settings: BuildingSettings): Array<BuildingTile> => {
  const tileCount = math.randomInt(5, 8)
  const tileSize = size.width / tileCount

  const cols = Math.ceil(size.width / tileSize)
  const rows = Math.ceil(size.height / tileSize)

  const grid = patterns.drawGrid(rows, cols, point, size)
  const tiles: Array<BuildingTile> = []

  grid.tiles.forEach((tile) => {
      const currentColor = chroma(settings.tileColor).brighten(math.random(0.0, 0.5))
      const nextColor = chroma(currentColor).saturate(math.random(1.0, 10.0))

      tile.path.fillColor = new paper.Color(currentColor.hex())

      tiles.push({
        ...tile,
        currentColor: currentColor.hex(),
        nextColor: nextColor.hex()
      })
  })

  return tiles
}

export const drawWindow = (point: paper.Point, size: paper.Size, settings: BuildingSettings): BuildingWindow => {
  const frame = new paper.Path.Rectangle({
    point: point,
    size: size,
    strokeWidth: 1.5,
    strokeColor: settings.strokeColor,
    fillColor: 'white',
    radius: settings.windowRadius
  })
  
  let glassOffset = size.width * settings.windowFrameOffsetFactor
  glassOffset = math.max((1.25 / size.width * settings.windowFrameOffsetFactor) * 190.0, glassOffset)
  glassOffset = math.max(glassOffset, settings.windowMinFrameOffset)

  const glassPoint = point.add(glassOffset)
  const glassSize = size.subtract(glassOffset * 2.0)

  const glass = new paper.Path.Rectangle({
    point: glassPoint,
    size: glassSize,
    strokeWidth: 1.5,
    strokeColor: settings.strokeColor,
    fillColor: settings.windowColor,
    radius: settings.windowRadius
  })

  const division = new paper.Path([
    glassPoint.add(new paper.Point(glassSize.width * 0.5, 0.0)),
    glassPoint.add(new paper.Point(glassSize.width * 0.5, glassSize.height)),
  ])

  division.strokeColor = new paper.Color(settings.strokeColor)

  return {
    group: new paper.Group([frame, glass, division]),
    frame,
    glass,
    division
  }
}

export const drawWindowGrid = (start: paper.Point, size: paper.Size, settings: BuildingSettings) => {
  const windowsOffset = size.width * settings.windowGridOffsetFactor
  const spaceSize = (size.width - (windowsOffset * 2.0)) / settings.windowGridCols
  const rows = Math.floor(size.height / spaceSize)
  const windows: Array<BuildingWindow> = []

  for (let col = 0; col < settings.windowGridCols; col++) {
    for (let row = 0; row < rows; row++) {
      const spaceOffset = spaceSize * 0.175

      const windowSize = new paper.Size(
        spaceSize - spaceOffset * 2.0,
        spaceSize - spaceOffset * 2.0,
      )

      const windowPoint = new paper.Point(col * spaceSize, row * spaceSize)
        .add(start)
        .add(windowsOffset)
        .add(spaceOffset)


      const addWindow = math.pickRandom([true, true, false])
      
      if (addWindow)
        windows.push(drawWindow(windowPoint, windowSize, settings))
    }
  }

  return windows
}

export const drawBuilding = (point: paper.Point, size: paper.Size, settings: BuildingSettings): Building => {
  const tiles = drawTiles(point, size, settings)

  const body = new paper.Path.Rectangle({
    point,
    size,
    strokeColor: settings.strokeColor
  })

  const windows = drawWindowGrid(point, size, settings)
  const group = new paper.Group()
  group.addChildren(tiles.map(t => t.path))
  group.addChild(body)
  group.addChildren(windows.map(w => w.group))


  return {
    group,
    body,
    tiles,
    windows
  }
}

export const drawTajimi = (size: paper.Size, settings: BuildingSettings) => {
  const buildings = []
  const minimumBuildingWidth = settings.buildingWidthMinimumFactor * paper.view.size.width
  const minimumAvailableSpace = settings.buildingWidthFactorThreshold * paper.view.size.width
  let availableWidth = size.width + size.width * 0.2
  let currentX = -size.width * 0.2 * 0.5

  while(availableWidth > minimumAvailableSpace) {
    const buildingHeight = math.random(
      settings.buildingHeightMinFactor * size.height,
      settings.buildingHeightMaxFactor * size.height
    )

    let buildingWidth = Math.ceil(math.random(
      buildingHeight * settings.buildingWidthMinFactor,
      buildingHeight * settings.buildingWidthMaxFactor
    ))

    buildingWidth = availableWidth - buildingWidth < minimumBuildingWidth ?
      buildingWidth * 0.65 :
      buildingWidth

    const buildingOffset = math.random(-20, 20)
    const buildingX = currentX + buildingOffset

    const buildingPoint = new paper.Point(buildingX, size.height - buildingHeight)
    const buildingSize = new paper.Size(buildingWidth, buildingHeight)

    const building = drawBuilding(buildingPoint, buildingSize, settings)

    buildings.push(building)
    availableWidth -= building.body.bounds.width
    currentX += building.body.bounds.width
  }

  const buildingHeight = math.random(
    settings.buildingHeightMinFactor * size.height,
    settings.buildingHeightMaxFactor * size.height
  )
  const buildingPoint = new paper.Point(currentX, size.height - buildingHeight)
  const buildingSize = new paper.Size(availableWidth, buildingHeight)
  const lastBuilding = drawBuilding(buildingPoint, buildingSize, settings)
  buildings.push(lastBuilding)

  buildings.sort((a, b) => b.body.bounds.area - a.body.bounds.area)
  buildings.forEach(b => b.group.sendToBack())

  return buildings
}