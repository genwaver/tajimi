import * as paper from 'paper'
import * as math from 'mathjs'
import * as patterns from './patterns'
import chroma from 'chroma-js'

export interface Palette {
  backgroundColor: string,
  strokeColor: string
  tileColorA: string
  tileColorB: string
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
  windowGridCols: number,
  postalFrameRadius: number,
  postalStrokeWidth: number,
  strokeWidth: number
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

export interface Tajimi {
  group: paper.Group
  background: paper.Path
  strokeBackground: paper.Path
  buildings: Array<Building>
}

export const drawTiles = (point: paper.Point, size: paper.Size, settings: BuildingSettings): Array<BuildingTile> => {
  const tileCount = math.randomInt(8, 12)
  const tileSize = size.width / tileCount

  const cols = Math.ceil(size.width / tileSize)
  const rows = Math.ceil(size.height / tileSize)

  const grid = patterns.drawGrid(rows, cols, point, size)
  const tiles: Array<BuildingTile> = []

  grid.tiles.forEach((tile) => {
      const currentColor = chroma(settings.tileColorA).brighten(math.random(0.0, 0.5))
      const nextColor = chroma(settings.tileColorB).brighten(math.random(0.0, 0.5))

      tile.path.fillColor = new paper.Color(currentColor.hex())
      tile.path.strokeColor = settings.strokeColor

      tiles.push({
        ...tile,
        currentColor: currentColor.hex(),
        nextColor: nextColor.hex()
      })
  })

  return tiles
}

export const drawWindow = (point: paper.Point, size: paper.Size, settings: BuildingSettings, addDivisor = true): BuildingWindow => {
  const frame = new paper.Path.Rectangle({
    point: point,
    size: size,
    strokeWidth: settings.strokeWidth,
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
    strokeWidth: settings.strokeWidth,
    strokeColor: settings.strokeColor,
    fillColor: settings.windowColor,
    radius: settings.windowRadius
  })

  const division = new paper.Path([
    glassPoint.add(new paper.Point(glassSize.width * 0.5, 0.0)),
    glassPoint.add(new paper.Point(glassSize.width * 0.5, glassSize.height)),
  ])

  division.strokeColor = new paper.Color(settings.strokeColor)
  division.strokeWidth = addDivisor ? settings.strokeWidth : 0.0

  return {
    group: new paper.Group([frame, glass, division]),
    frame,
    glass,
    division
  }
}

const generateWindow = (point: paper.Point, size: paper.Size, settings: BuildingSettings) => {
  const windowSettings = math.pickRandom([
    {scale: {x: 1.0, y: 0.75}, divisor: true}, 
    {scale: {x: 1.0, y: 1.0}, divisor: true}, 
    {scale: {x: 0.75, y: 0.75}, divisor: false}, 
    {scale: {x: 0.75, y: 1.0}, divisor: false}, 
  ])
  const adjustedSize = size.multiply(windowSettings.scale as paper.SizeLike)

  point = point
    .add([size.width * 0.5, size.height * 0.5])
    .subtract([adjustedSize.width * 0.5, adjustedSize.height * 0.5])

  return drawWindow(point, adjustedSize, settings, windowSettings.divisor)
}


export const drawWindowGrid = (start: paper.Point, size: paper.Size, settings: BuildingSettings) => {
  const windowsOffset = size.width * settings.windowGridOffsetFactor
  const spaceSize = (size.width - (windowsOffset * 2.0)) / settings.windowGridCols
  const rows = Math.floor(size.height / spaceSize)
  const windows: Array<BuildingWindow> = []

  for (let col = 0; col < settings.windowGridCols; col++) {
    for (let row = 0; row < rows; row++) {
      const spaceOffset = spaceSize * 0.175

      let windowSize = new paper.Size(
        spaceSize - spaceOffset * 2.0,
        spaceSize - spaceOffset * 2.0,
      )

      const windowPoint = new paper.Point(col * spaceSize, row * spaceSize)
        .add(start)
        .add(windowsOffset)
        .add(spaceOffset)


      const addWindow = math.pickRandom([true, true, false])
      
      if (addWindow)
        
        windows.push(generateWindow(windowPoint, windowSize, settings))
    }
  }

  return windows
}

export const drawBuilding = (point: paper.Point, size: paper.Size, settings: BuildingSettings): Building => {
  const tiles = drawTiles(point, size, settings)

  const body = new paper.Path.Rectangle({
    point,
    size,
    strokeColor: settings.strokeColor,
    strokeWidth: settings.strokeWidth
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

export const drawTajimi = (point: paper.Point, size: paper.Size, settings: BuildingSettings) => {
  let buildings = []
  const minimumBuildingWidth = settings.buildingWidthMinimumFactor * paper.view.size.width
  const minimumAvailableSpace = settings.buildingWidthFactorThreshold * paper.view.size.width

  let availableWidth = size.width + size.width * 0.2
  let currentX = point.x -size.width * 0.2 * 0.5

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

    const buildingPoint = new paper.Point(buildingX, point.y + (size.height - buildingHeight))
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
  const buildingPoint = new paper.Point(currentX, point.y + (size.height - buildingHeight))
  const buildingSize = new paper.Size(availableWidth, buildingHeight)
  const lastBuilding = drawBuilding(buildingPoint, buildingSize, settings)
  buildings.push(lastBuilding)

  buildings = buildings.sort((a, b) => a.body.bounds.area - b.body.bounds.area)

  const visibleArea = new paper.Path.Rectangle({
    point: point.add(settings.strokeWidth * 0.5),
    size: size.subtract(settings.strokeWidth * 2.0 * 0.5),
    strokeWidth: settings.strokeWidth,
    radius: 4.0
  })

  const background = new paper.Path.Rectangle({
    point,
    size,
    fillColor: settings.backgroundColor,
    radius: 4.0
  })

  const strokeBackground = new paper.Path.Rectangle({
    point: point.add(settings.strokeWidth),
    size: size.subtract(settings.strokeWidth * 2.0),
    strokeColor: settings.strokeColor,
    strokeWidth: settings.strokeWidth,
    radius: 4.0
  })

  const tajimi = new paper.Group()
  visibleArea.clipMask = true
  tajimi.addChild(visibleArea)
  tajimi.addChild(background)
  buildings.forEach(b => tajimi.addChild(b.group))
  tajimi.addChild(strokeBackground)

  return {
    group: tajimi,
    background,
    strokeBackground,
    buildings
  }
}