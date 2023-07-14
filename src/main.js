import './style.css'
import * as paper from 'paper'
import * as math from 'mathjs'
import chroma from 'chroma-js'
import { Point } from 'paper/dist/paper-core'

const settings = {
  heightMaxFactor: 0.85,
  heightMinFactor: 0.35,
  buildingWidthFactorThreshold: 0.25,
  buildingWidthMinimumFactor: 0.15,
  buildingCount:5,
  tileAnimation: 80
}

const palette = {
  background: 'white',
  stroke: '#382B80',
  tile1: '#B2A4FF',
  tile2: '#B2A4FF',
  window: '#FDF7C3'
}

const generateBackground = (view) => {
  const background = new paper.Path.Rectangle({
    point: [0, 0],
    size: view.size.clone(),
    fillColor: palette.background,
  })
}

const generateTiles = (start, size) => {
  const tileCount = math.randomInt(5, 8)
  const tileSize = size.width / tileCount

  const cols = Math.ceil(size.width / tileSize)
  const rows = Math.ceil(size.height / tileSize)

  const rowSize = tileSize
  const colSize = tileSize
  const tiles = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const xTile = col * colSize
      const yTile = row * rowSize
      const tilePoint = new paper.Point(xTile, yTile).add(start)
      const color1 = chroma(palette.tile1).brighten(math.random(0.0, 0.5))
      const color2 = chroma(color1).saturate(math.random(1.0, 10.0)).hex()

      const tile = new paper.Path.Rectangle({
        point: tilePoint,
        size: [colSize, rowSize],
        strokeColor: palette.stroke,
        fillColor: color1
      })

      tiles.push({
        rectangle: tile,
        currentColor: color1,
        nextColor: color2,
      })
    }
  }

  return tiles
}

const generateWindows = (start, size) => {
  const windowsOffset = size.width * 0.1

  const cols = 2
  const colSize = (size.width - (windowsOffset * 2.0)) / cols
  const rows = Math.floor(size.height / colSize)
  const windows = []

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const xSpace = col * colSize
      const ySpace = row * colSize
      const spaceOffset = colSize * 0.175
      const addWindow = math.pickRandom([true, false])
      
      if (addWindow) {
        const windowFrameCorner = new paper.Point(xSpace, ySpace)
          .add(start)
          .add(windowsOffset)
          .add(spaceOffset)
        
        const windowFrameSize = new paper.Size(
          colSize - spaceOffset * 2.0,
          colSize - spaceOffset * 2.0,
        )

        const frame = new paper.Path.Rectangle({
          point: windowFrameCorner,
          size: windowFrameSize,
          strokeWidth: 1.5,
          strokeColor: palette.stroke,
          fillColor: 'white',
          radius: 2
        })

        const windowCorner = windowFrameCorner.clone()
          .add(windowFrameSize.width * 0.15)

        const windowSize = windowFrameSize.clone()
          .subtract(windowFrameSize.width * 0.15 * 2.0)

        const glass = new paper.Path.Rectangle({
          point: windowCorner,
          size: windowSize,
          strokeWidth: 1.5,
          strokeColor: palette.stroke,
          fillColor: palette.window,
          radius: 2
        })

        const division = new paper.Path()
        division.strokeColor = palette.stroke
        division.add(new Point(windowCorner)
          .add(new Point(windowSize.width * 0.5, 0.0)) 
        )

        division.add(new Point(windowCorner)
          .add(new Point(windowSize.width * 0.5, windowSize.height)) 
        )

        windows.push({
          frame,
          glass
        })
      }
    }
  }

  return windows
}

const generateBuilding = (view, x, availableWidth, minimumAvailableSpace, constantWidth = undefined) => {
  // Generate body
  const buildingHeight = math.random(
    settings.heightMinFactor * view.size.height,
    settings.heightMaxFactor * view.size.height
  )

  let buildingWidth = 0

  if (constantWidth) {
    buildingWidth = constantWidth
  } else {
    const temporalBuildingWidth = Math.ceil(math.random(
      buildingHeight * 0.2,
      buildingHeight * 0.35,
    ))

    // Prevent to generate a really small building
    buildingWidth = availableWidth - temporalBuildingWidth < minimumAvailableSpace ?
      temporalBuildingWidth * 0.65 :
      temporalBuildingWidth
  }

  const bodySize = new paper.Size(buildingWidth, buildingHeight)
  const bodyCorner = new paper.Point(x, 0)
    .add([0, view.size.height])
    .subtract([0, buildingHeight])

  const body = new paper.Path.Rectangle({
    point: bodyCorner,
    size: bodySize,
    fillColor: palette.buildingBody,
    strokeColor: palette.stroke
  })

  // Generate tiles
  const tiles = generateTiles(bodyCorner, bodySize)

  // Generate windows
  const windows = generateWindows(bodyCorner, bodySize)

  // Generate Windows

  return {
    body,
    tiles,
    windows
  }
}

const generateTajimi = (view) => {
  const buildings = []
  const minimumBuildingWidth = settings.buildingWidthMinimumFactor * paper.view.size.width
  const minimumAvailableSpace = settings.buildingWidthFactorThreshold * paper.view.size.width
  let availableWidth = view.size.width
  let currentX = 0


  while(availableWidth > minimumAvailableSpace) {
    const building = generateBuilding(paper.view, currentX, availableWidth, minimumBuildingWidth)
    buildings.push(building)
    availableWidth -= building.body.bounds.width
    currentX += building.body.bounds.width
  }

  const lastBuilding = generateBuilding(paper.view, currentX, availableWidth, minimumBuildingWidth, availableWidth)
  buildings.push(lastBuilding)
  console.log(minimumBuildingWidth, lastBuilding.body.bounds.width)

  return buildings
}

const scale =  (number, inMin, inMax, outMin, outMax) => {
  return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function easeInOutCubic(x) {
  return x * x * x
}

window.onload = () => {
  let canvas = document.getElementById('painting')
  paper.setup(canvas)

  generateBackground(paper.view)

  const buildings = generateTajimi(paper.view)

  paper.view.draw()
  paper.view.onFrame = (event) => {
    let globalFrame = event.count

    buildings.forEach(building => {
      building.tiles.forEach((tile, index) => {

        let delay = index * 7.5
        let animationFrame = (globalFrame + delay) % settings.tileAnimation
        let progress = scale(animationFrame, 0.0, settings.tileAnimation, 0.0, 1.0)

        const color = chroma.mix(tile.currentColor, tile.nextColor, progress)
        tile.rectangle.fillColor = color.hex()

        if (animationFrame >= settings.tileAnimation - 1) {
          const nextColor = tile.currentColor
          tile.currentColor = tile.nextColor
          tile.nextColor = nextColor
        }
      })
    })
  }
}