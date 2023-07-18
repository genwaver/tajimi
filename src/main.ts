import './style.css'
import * as paper from 'paper'
import chroma from 'chroma-js'
import * as building from './building'

const palette = {
  frameColor: 'white',
  backgroundColor: '#FDF7C3',
  strokeColor: '#382B80',
  tileColor: '#B2A4FF',
  windowColor: '#FDF7C3'
}

const settings = {
  postalWidth: 540,
  postalHeight: 540,
  postalFrameOffsetFactor: 0.9,
  postalFrameSizeFactor: 0.1,
  postalFrameRadius: 4.0,
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
  strokeWidth: 1.5,
  ...palette
}

export interface TajimiPostal {
  background: paper.Path,
  frame: paper.Path,
  tajimi: building.Tajimi
}

const scale =  (number: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
  return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

const drawTajimiPostal = (view: paper.View, settings: any) => {
  const background = new paper.Path.Rectangle({
    point: [0, 0],
    size: view.size.clone(),
    fillColor: settings.backgroundColor,
  })

  const postalFrameOffset = (view.size.width - view.size.width * settings.postalFrameOffsetFactor) * 0.5
  const postalFrameSize = view.size.subtract(postalFrameOffset * 2.0)
  const postalFramePoint = new paper.Point(postalFrameOffset, postalFrameOffset)

  const postalFrame = new paper.Path.Rectangle({
    point: postalFramePoint,
    size: postalFrameSize,
    strokeColor: settings.strokeColor,
    strokeWidth: settings.strokeWidth,
    fillColor: settings.frameColor,
    radius: settings.postalFrameRadius
  })

  const canvasOffset = postalFrameSize.width * settings.postalFrameSizeFactor * 0.5
  const canvasPoint = postalFramePoint.add(canvasOffset)
  const canvasSize = postalFrameSize.subtract(canvasOffset * 2.0)

  const tajimi = building.drawTajimi(canvasPoint, canvasSize, settings)

  background.sendToBack()

  return {
    background,
    frame: postalFrame,
    tajimi
  }
}


window.onload = () => {
  const canvas: HTMLCanvasElement = document.getElementById('painting')
  const container = document.getElementById('container')
  paper.setup(canvas)

  const postal = drawTajimiPostal(paper.view, settings)
  container!.style.backgroundColor = settings.backgroundColor

  paper.view.onFrame = (event: any) => {
    let globalFrame = event.count
    animateTiles(globalFrame, postal.tajimi.buildings)
  }
}

const animateTiles = (globalFrame: number, buildings: Array<building.Building>) => {
  buildings.forEach(building => {
    building.tiles.forEach((tile, index) => {

      let delay = index * 7.5
      let animationFrame = (globalFrame + delay) % settings.tileAnimation
      let progress = scale(animationFrame, 0.0, settings.tileAnimation, 0.0, 1.0)

      const color = chroma.mix(tile.currentColor, tile.nextColor, progress).hex()
      tile.path.fillColor = new paper.Color(color)

      if (animationFrame >= settings.tileAnimation - 1) {
        const nextColor = tile.currentColor
        tile.currentColor = tile.nextColor
        tile.nextColor = nextColor
      }
    })
  })
}