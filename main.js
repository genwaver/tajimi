import './style.css'
import * as paper from 'paper'
import * as math from 'mathjs'

const settings = {
  heightMaxFactor: 0.85,
  heightMinFactor: 0.35,
  buildingCount: 10
}

const palette = {
  background: '#B9F3E4',
  stroke: '#0000ee',
  tile1: '#EA8FEA',
  tile2: '#FFAACF',
  tile3: '#F6E6C2',
}

const generateBackground = (view) => {
  const background = new paper.Path.Rectangle({
    point: [0, 0],
    size: view.size.clone(),
    fillColor: palette.background,
  })
}

const generateBuilding = (view, x) => {
  // Generate body
  const buildingHeight = math.random(
    settings.heightMinFactor * view.size.height,
    settings.heightMaxFactor * view.size.height
  )

  const buildingWidth = math.random(
    buildingHeight * 0.25,
    buildingHeight * 0.5,
  )

  const bodySize = new paper.Size(buildingWidth, buildingHeight)
  const bodyCorner = new paper.Point(x, 0)
    .add([0, view.size.height])
    .subtract([0, buildingHeight])

  const path = new paper.Path.Rectangle({
    point: bodyCorner,
    size: bodySize,
    fillColor: palette.buildingBody,
    strokeColor: palette.stroke
  })

  // Generate tiles
  const cols = math.randomInt(5, 15)
  const rows = math.randomInt(10, 25)

  const rowSize = bodySize.height / rows
  const colSize = bodySize.width / cols

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const xTile = col * colSize
      const yTile = row * rowSize
      const tilePoint = new paper.Point(xTile, yTile).add(bodyCorner)
      
      const tile = new paper.Path.Rectangle({
        point: tilePoint,
        size: [colSize, rowSize],
        strokeColor: palette.stroke,
        fillColor: math.pickRandom([palette.tile1, palette.tile2, palette.tile3])
      })
    }
  }

}

window.onload = () => {
  let canvas = document.getElementById('painting')
  paper.setup(canvas)

  generateBackground(paper.view)

  for (let i = 0; i < settings.buildingCount; i++) {
    const buildingXSpace = paper.view.size.width / settings.buildingCount
    const xBuilding = i * buildingXSpace
    const xOffset = math.random(paper.view.size.width * -0.05, paper.view.size.width * 0.05)

    generateBuilding(paper.view, xBuilding + xOffset)
  }
  

  paper.view.draw()
  paper.view.onFrame = () => {
  }
}