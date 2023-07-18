import './style.css'
import * as paper from 'paper'
import * as math from 'mathjs'
import chroma from 'chroma-js'
import * as building from './building'
import GUI from 'lil-gui'

/**
 * Postal Settings
 */
const palette = {
  frameColor: 'white',
  backgroundColor: '#FDEBED',
  strokeColor: '#D9ACF5',
  tileColorA: '#FFCEFE',
  tileColorB: '#AAE3E2',
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
  delayOffset: 0.5,
  updateTajimi: () => {
    if(postal) {
      postal.group.remove()
      postal = drawTajimiPostal(paper.view, settings)
    }
  },
  ...palette
}

const gui = new GUI()
gui.addColor(settings, 'backgroundColor')
gui.addColor(settings, 'windowColor')
gui.addColor(settings, 'strokeColor')
gui.addColor(settings, 'tileColorA').onChange(() => {
  if(postal) {
    updateTileColors(postal)
  }
})

gui.addColor(settings, 'tileColorB').onChange(() => {
  if(postal) {
    updateTileColors(postal)
  }
})

gui.add(settings, 'delayOffset').min(0).max(10.0).step(0.01)
gui.add(settings, 'updateTajimi')

const updateTileColors = (postal: TajimiPostal) => {
  postal.tajimi.buildings.forEach(b => b.tiles.forEach(tile =>{

    const currentColor = chroma(settings.tileColorA).brighten(math.random(-0.1, 0.1))
    const nextColor = chroma(settings.tileColorB).brighten(math.random(-0.1, 0.1))

    tile.path.fillColor = new paper.Color(currentColor.hex())
    tile.path.strokeColor = new paper.Color(currentColor.hex())

    tile.currentColor = currentColor.hex()
    tile.nextColor = nextColor.hex()
  }))
}


export interface TajimiPostal {
  group: paper.Group
  background: paper.Path,
  frame: paper.Path,
  tajimi: building.Tajimi
}

const scale =  (number: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
  return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

const drawTajimiPostal = (view: paper.View, settings: any): TajimiPostal => {
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

  const group = new paper.Group()
  group.addChild(background)
  group.addChild(postalFrame)
  group.addChild(tajimi.group)

  return {
    group,
    background,
    frame: postalFrame,
    tajimi
  }
}

/**
 * Main Animation
 */

let postal: TajimiPostal | undefined = undefined

window.onload = () => {
  const canvas: HTMLCanvasElement = document.getElementById('painting')
  paper.setup(canvas)

  postal = drawTajimiPostal(paper.view, settings)

  paper.view.onFrame = (event: any) => {
    let globalFrame = event.count

    updateSettings(postal, settings)
    animateTiles(globalFrame, postal.tajimi.buildings)
  }
}


const updateSettings = (postal: TajimiPostal, settings: any) => {
  const container = document.getElementById('container')
  container!.style.backgroundColor = settings.backgroundColor
  postal.background.fillColor = settings.backgroundColor
  postal.tajimi.background.fillColor = settings.backgroundColor
  postal.tajimi.buildings.forEach(b => b.windows.forEach((w) => w.glass.fillColor = settings.windowColor ))

  postal.frame.strokeColor = settings.strokeColor
  postal.tajimi.strokeBackground.strokeColor = settings.strokeColor
  postal.tajimi.buildings.forEach(b => b.body.strokeColor = settings.strokeColor)
  postal.tajimi.buildings.forEach(b => b.windows.forEach((w) => {
    w.frame.strokeColor = settings.strokeColor
    w.glass.strokeColor = settings.strokeColor
    w.division.strokeColor = settings.strokeColor
  }))
}

const animateTiles = (globalFrame: number, buildings: Array<building.Building>) => {
  buildings.forEach(building => {
    building.tiles.forEach((tile, index) => {

      let delay = tile.path.bounds.center.getDistance(new paper.Point(building.body.position.x, building.body.position.y)) * settings.delayOffset
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