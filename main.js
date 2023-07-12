import './style.css'
import * as paper from 'paper'
import * as math from 'mathjs'

const settings = {
  heightMaxFactor: 0.85,
  heightMinFactor: 0.35,

}

const palette = {
  background: '#B9F3E4',
  stroke: '#0000ee',
  buildingBody: '#EA8FEA'
}

const generateBackground = (view) => {
  const background = new paper.Path.Rectangle({
    point: [0, 0],
    size: view.size.clone(),
    fillColor: palette.background,
  })
}

const generateBuilding = (view) => {
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
  const point = view.center.clone().subtract(bodySize.multiply(0.5))

  const path = new paper.Path.Rectangle({
    point: point,
    size: bodySize,
    fillColor: palette.buildingBody,
    strokeColor: palette.stroke
  })
}

window.onload = () => {
  let canvas = document.getElementById('painting')
  paper.setup(canvas)

  generateBackground(paper.view)
  generateBuilding(paper.view)

  paper.view.draw()
  paper.view.onFrame = () => {
  }
}