import './style.css'
import * as paper from 'paper'
import * as math from 'mathjs'
import chroma from 'chroma-js'
import { Point } from 'paper/dist/paper-core'
import * as patterns from './patterns'
import * as building from './building'

const palette = {
  backgroundColor: 'white',
  strokeColor: '#382B80',
  tileColor: '#B2A4FF',
  windowColor: '#FDF7C3'
}


const settings = {
  buildingHeightMinFactor: 0.35,
  buildingHeightMaxFactor: 0.7,
  buildingWidthMinFactor: 0.225,
  buildingWidthMaxFactor: 0.375,
  buildingWidthFactorThreshold: 0.25,
  buildingWidthMinimumFactor: 0.15,
  buildingCount: 8,
  windowRadius: 1.5,
  windowFrameOffsetFactor: 0.135,
  windowGridOffsetFactor: 0.1,
  windowGridCols: 2,
  windowMinFrameOffset: 3.0,
  tileAnimation: 80.0,
  ...palette
}

const generateBackground = (view) => {
 new paper.Path.Rectangle({
    point: [0, 0],
    size: view.size.clone(),
    fillColor: palette.background,
  })
}


const scale =  (number, inMin, inMax, outMin, outMax) => {
  return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}


window.onload = () => {
  let canvas = document.getElementById('painting')
  paper.setup(canvas)

  generateBackground(paper.view)

  const buildings = building.drawTajimi(paper.view.size, settings)

  paper.view.draw()
  paper.view.onFrame = (event) => {
    let globalFrame = event.count
    animateTiles(globalFrame, buildings)
  }
}

const animateTiles = (globalFrame, buildings) => {
  buildings.forEach(building => {
    building.tiles.forEach((tile, index) => {

      let delay = index * 7.5
      let animationFrame = (globalFrame + delay) % settings.tileAnimation
      let progress = scale(animationFrame, 0.0, settings.tileAnimation, 0.0, 1.0)

      const color = chroma.mix(tile.currentColor, tile.nextColor, progress).hex()
      tile.path.fillColor = color

      if (animationFrame >= settings.tileAnimation - 1) {
        const nextColor = tile.currentColor
        tile.currentColor = tile.nextColor
        tile.nextColor = nextColor
      }
    })
  })
}