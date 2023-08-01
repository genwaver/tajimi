import * as paper from 'paper'
import * as math from 'mathjs'
import * as patterns from './patterns'
import chroma from 'chroma-js'

export interface AnimationItem {
  animationData?: any
}

export interface Palette {
  backgroundColor: string,
  strokeColor: string
  tileColorA: string
  tileColorB: string
  windowColor: string
  windowShineColor: string
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

export interface BuildingTile extends patterns.Tile, AnimationItem {
  currentColor: string
  nextColor: string
}

export interface BuildingWindow extends AnimationItem {
  group: paper.Group
  frame: paper.Shape.Rectangle
  glass: paper.Shape.Rectangle,
  shines: Array<paper.Path>
  division: paper.Path,
  person: paper.Group,
  glassFrame: paper.Shape.Rectangle
}

export interface Building  extends AnimationItem{
  group: paper.Group 
  point: paper.Point
  size: paper.Size
  body: paper.Shape.Rectangle
  bodyShadow: paper.Shape.Rectangle
  tiles: Array<BuildingTile>
  windows: Array<BuildingWindow>
}

export interface Tajimi {
  group: paper.Group
  point: paper.Point,
  size: paper.Size
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
      const currentColor = chroma(settings.tileColorA).brighten(math.random(-0.3, 0.3))
      const nextColor = chroma(settings.tileColorB).brighten(math.random(-0.3, 0.3))

      tile.path.fillColor = new paper.Color(currentColor.hex())
      tile.path.strokeColor = settings.strokeColor
      tile.path.strokeWidth = settings.strokeWidth

      tiles.push({
        ...tile,
        currentColor: currentColor.hex(),
        nextColor: nextColor.hex(),
        animationData: {
          prevScale: 0.0
        }
      })
  })

  return tiles
}

const drawRandomShine = (point: paper.Point, size: paper.Size, palette: Palette) => {
  const segments = math.randomInt(2, 4)
  const hip = new paper.Point(size.multiply(2.0))
  const right = new paper.Point(size.width, 0.0)
  const bottom = new paper.Point(0.0, size.height)

  const shines = []
  let currentPosition = 0.0

  for (let index = 0; index < segments; index++) {
    const dimension = math.random(0.1, 0.3)
    const offset = math.random(0.05, 0.3)

    const start = hip.multiply(currentPosition + offset)
    const end = hip.multiply(currentPosition + offset + dimension)

    const shine = new paper.Path([
      point.add(start.project(right)),
      point.add(end.project(right)),
      point.add(end.project(bottom)),
      point.add(start.project(bottom)),
    ])

    shine.closed = true
    shine.fillColor = chroma(palette.windowShineColor).brighten(1.5).hex()
    shines.push(shine)
    currentPosition += offset + dimension
  }

  return shines
}

export const drawWindow = (point: paper.Point, size: paper.Size, settings: BuildingSettings, options: { divisor: boolean, shine: boolean, person: boolean }): BuildingWindow => {
  const frame = new paper.Shape.Rectangle({
    point: point,
    size: size,
    strokeWidth: settings.strokeWidth,
    strokeColor: settings.strokeColor,
    fillColor: 'white',
    radius: settings.windowRadius,
    shadowColor: settings.strokeColor,
    shadowBlur: 8.0,
    shadowOffset: new paper.Point(0.0, 8.0)
  })
  
  let glassOffset = size.width * settings.windowFrameOffsetFactor
  glassOffset = math.max((1.25 / size.width * settings.windowFrameOffsetFactor) * 190.0, glassOffset)
  glassOffset = math.max(glassOffset, settings.windowMinFrameOffset)

  const glassPoint = point.add(glassOffset)
  const glassSize = size.subtract(glassOffset * 2.0)

  const glassGroup = new paper.Group()

  const glassMask = new paper.Shape.Rectangle({
    point: glassPoint,
    size: glassSize.multiply(0.98),
  })

  glassMask.clipMask = true

  const glass = new paper.Shape.Rectangle({
    point: glassPoint,
    size: glassSize,
    fillColor: settings.windowColor,
    radius: settings.windowRadius
  })

  const glassFrame = new paper.Shape.Rectangle({
    point: glassPoint,
    size: glassSize,
    strokeWidth: settings.strokeWidth,
    strokeColor: settings.strokeColor,
    radius: settings.windowRadius
  })

  const division = new paper.Path([
    glassPoint.add(new paper.Point(glassSize.width * 0.5, 0.0)),
    glassPoint.add(new paper.Point(glassSize.width * 0.5, glassSize.height)),
  ])

  division.strokeColor = new paper.Color(settings.strokeColor)
  division.strokeWidth = options.divisor ? settings.strokeWidth : 0.0

  const shines = drawRandomShine(glassPoint, glassSize, settings)
  const person = new paper.Group()

  const head = new paper.Path.Circle({
    center: glassPoint.add(glassSize.multiply(0.5)),
    radius: glassSize.width * 0.2,
    fillColor: settings.strokeColor
  })

  const bodyStart = glassPoint.add([glassSize.width * 0.2, glassSize.height])
  const bodyThrough = glassPoint.add([glassSize.width * 0.5, glassSize.height * 0.6])
  const bodyEnd = glassPoint.add([glassSize.width * 0.8, glassSize.height])

  const body = new paper.Path.Arc({
    from: bodyStart,
    through: bodyThrough,
    to: bodyEnd,
    fillColor: settings.strokeColor
  })

  body.closed = true

  person.addChild(head)
  person.addChild(body)

  glassGroup.addChild(glassMask)
  glassGroup.addChild(glass)
  if (!options.person) glassGroup.addChildren(shines)
  if (options.person) glassGroup.addChild(person)
  glassGroup.addChild(division)
  glassGroup.addChild(glassFrame)



  const group = new paper.Group()
  group.addChild(frame)
  group.addChild(glassGroup)

  return {
    group,
    frame,
    glass,
    shines,
    division,
    person,
    glassFrame
  }
}

const generateWindow = (point: paper.Point, size: paper.Size, settings: BuildingSettings) => {
  const person = math.pickRandom([true, true, false])
  const windowSettings = math.pickRandom([
    {scale: {x: 1.0, y: 0.75}, divisor: true, shine: true, person: false}, 
    {scale: {x: 1.0, y: 1.0}, divisor: true, shine: true, person: false}, 
    {scale: {x: 0.75, y: 0.75}, divisor: false, shine: !person, person}, 
    {scale: {x: 0.75, y: 1.0}, divisor: false, shine: !person, person}, 
  ])
  const adjustedSize = size.multiply(windowSettings.scale as paper.SizeLike)

  point = point
    .add([size.width * 0.5, size.height * 0.5])
    .subtract([adjustedSize.width * 0.5, adjustedSize.height * 0.5])

  return drawWindow(point, adjustedSize, settings, { divisor: windowSettings.divisor, shine: windowSettings.shine, person: windowSettings.person})
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


      const addWindow = math.pickRandom([true, true, true, false])
      
      if (addWindow)
        
        windows.push(generateWindow(windowPoint, windowSize, settings))
    }
  }

  return windows
}

export const drawBuilding = (point: paper.Point, size: paper.Size, settings: BuildingSettings): Building => {
  const tiles = drawTiles(point, size, settings)

  const bodyShadow = new paper.Shape.Rectangle({
    point,
    size,
    fillColor: settings.strokeColor,
    strokeColor: settings.strokeColor,
    strokeWidth: settings.strokeWidth,
    shadowColor: settings.strokeColor,
    shadowBlur: 12.0,
    shadowOffset: new paper.Point(0.0, 8.0)
  })

  const body = new paper.Shape.Rectangle({
    point,
    size,
    strokeColor: settings.strokeColor,
    strokeWidth: settings.strokeWidth,
  })

  const windows = drawWindowGrid(point, size, settings)
  const group = new paper.Group()
  group.addChild(bodyShadow)
  group.addChildren(tiles.map(t => t.path))
  group.addChild(body)
  group.addChildren(windows.map(w => w.group))


  return {
    group,
    point,
    size,
    bodyShadow,
    body,
    tiles,
    windows,
    animationData: {}
  }
}

export const drawTajimi = (point: paper.Point, size: paper.Size, settings: BuildingSettings) => {
  let buildings = []
  const minimumBuildingWidth = settings.buildingWidthMinimumFactor * paper.view.size.width
  const minimumAvailableSpace = settings.buildingWidthFactorThreshold * paper.view.size.width

  let availableWidth = size.width + size.width * 0.3
  let currentX = point.x - ((size.width * 0.3) * 0.5)
  const tajimiPoint = new paper.Point(currentX, point.y)
  const tajimiSize = new paper.Size(availableWidth, size.height)

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

  const visibleArea = new paper.Shape.Rectangle({
    point: point.add(settings.strokeWidth * 0.5),
    size: size.subtract(settings.strokeWidth * 2.0 * 0.5),
    strokeWidth: settings.strokeWidth,
    radius: 4.0
  })

  const background = new paper.Shape.Rectangle({
    point,
    size,
    fillColor: settings.backgroundColor,
    radius: 4.0
  })

  const strokeBackground = new paper.Shape.Rectangle({
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
    point: tajimiPoint,
    size: tajimiSize,
    background,
    strokeBackground,
    buildings
  }
}