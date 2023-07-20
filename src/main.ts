import './style.css'
import * as paper from 'paper'
import * as math from 'mathjs'
import chroma from 'chroma-js'
import * as building from './building'
import GUI from 'lil-gui'
import { CanvasCapture } from 'canvas-capture'

interface Painting {
  canvas: HTMLCanvasElement,
  preview: HTMLCanvasElement
}

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
  previewWidth: 540,
  previewHeight: 540,
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
  exportScale: 2.0,
  updateTajimi: () => {
    if(postal) {
      postal.group.remove()
      postal = drawTajimiPostal(paper.view, settings)
    }
  },
  exportSvg: () => {
    const svg = paper.project.exportSVG({asString: true})
    const link = document.createElement('a')
    const url = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg as string)

    link.href = url
    link.download = 'tajimi.svg'
    link.click()
  },
  record: () => {
    recordingRequested = true
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

gui.add(settings, 'delayOffset').min(0).max(100.0).step(0.01)
gui.add(settings, 'exportScale').min(1.0).max(4.0).step(1.0).onChange(() => {
  if (painting && postal) {
    const canvasWidth = settings.postalWidth * settings.exportScale
    const canvasHeight = settings.postalHeight * settings.exportScale
    paper.view.viewSize = new paper.Size(canvasWidth, canvasHeight)

    postal.group.remove()
    postal = drawTajimiPostal(paper.view, settings)

    painting.canvas.style.width = `${canvasWidth}px`
    painting.canvas.style.height = `${canvasHeight}px`
    painting.canvas.width = canvasWidth
    painting.canvas.height = canvasHeight
  }
})

gui.add(settings, 'updateTajimi')
gui.add(settings, 'exportSvg')
gui.add(settings, 'record')

const updateTileColors = (postal: TajimiPostal) => {
  postal.tajimi.buildings.forEach(b => b.tiles.forEach(tile =>{

    const currentColor = chroma(settings.tileColorA).brighten(math.random(-0.2, 0.2))
    const nextColor = chroma(settings.tileColorB).brighten(math.random(-0.2, 0.2))

    tile.path.fillColor = new paper.Color(currentColor.hex())

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
let painting: Painting | undefined = undefined

window.onload = () => {

  painting = setupPainting(settings)
  postal = drawTajimiPostal(paper.view, settings)

  paper.view.onFrame = (event: any) => {
    let globalFrame = event.count

    updateSettings(postal!, settings)
    animateTiles(globalFrame, postal!.tajimi.buildings)
    drawPreview(painting!, settings)

    checkRecording(painting!.canvas, globalFrame)
  }
}

const setupPainting = (settings: any) : Painting => {
  const preview: HTMLCanvasElement = document.getElementById('preview')
  preview.style.width = `${settings.previewWidth}px`
  preview.style.height = `${settings.previewHeight}px`
  preview.width = settings.previewWidth
  preview.height = settings.previewHeight

  const canvasWidth = settings.postalWidth * settings.exportScale
  const canvasHeight = settings.postalHeight * settings.exportScale

  const canvas: HTMLCanvasElement = document.getElementById('painting')
  canvas.style.width = `${canvasWidth}px`
  canvas.style.height = `${canvasHeight}px`
  canvas.width = canvasWidth
  canvas.height = canvasHeight

  paper.setup(canvas)

  return {
    preview,
    canvas
  }
}

const drawPreview = ({preview, canvas}: Painting, settings: any) => {
  const ctx = preview.getContext('2d')
  const canvasWidth = settings.postalWidth * settings.exportScale
  const canvasHeight = settings.postalHeight * settings.exportScale
  ctx?.drawImage(canvas, 0, 0, canvasWidth, canvasHeight, 0, 0, settings.previewWidth, settings.previewHeight)
}



/**
 * Recording logic
 */
let recordingRequested = false
let isRecording = false

const checkRecording = (canvas: HTMLCanvasElement, frame: number) => {
  const animationFrame = frame % settings.tileAnimation

  if (recordingRequested) {
    isRecording = animationFrame === 0
    recordingRequested = !isRecording
  }

  if(isRecording) {
    if (animationFrame === 0) {
      CanvasCapture.init(canvas)
      CanvasCapture.setVerbose(true)
      CanvasCapture.beginGIFRecord()
    }
    
    if (animationFrame < settings.tileAnimation) {
      CanvasCapture.recordFrame()
    }
    
    if (animationFrame === settings.tileAnimation - 1) {
      CanvasCapture.stopRecord()
    }


    isRecording = animationFrame < settings.tileAnimation - 1
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
  postal.tajimi.buildings.forEach(b => b.tiles.forEach(t => t.path.strokeColor = settings.strokeColor))
  postal.tajimi.buildings.forEach(b => b.windows.forEach((w) => {
    w.frame.strokeColor = settings.strokeColor
    w.glass.strokeColor = settings.strokeColor
    w.division.strokeColor = settings.strokeColor
  }))
}

const animateTiles = (globalFrame: number, buildings: Array<building.Building>) => {
  buildings.forEach(building => {
    building.tiles.forEach((tile, index) => {

      let buildingPoint = new paper.Point(
        scale(tile.point.x, building.body.bounds.topLeft.x, building.body.bounds.topRight.x, -0.5, 0.5),
        scale(tile.point.y, building.body.bounds.topLeft.y, building.body.bounds.bottomLeft.y, -0.5, 0.5)
      )


      let delay = Math.sin((buildingPoint.x + buildingPoint.y) * Math.PI) * settings.delayOffset 
      delay += buildingPoint.length * 100.0
      delay += building.body.bounds.center.x * 20.0

      let animationFrame = (globalFrame + delay) % settings.tileAnimation
      let progress = scale(animationFrame, 0.0, settings.tileAnimation, 0.0, 1.0)
      progress = Math.sin(progress * Math.PI)

      const color = chroma.mix(tile.currentColor, tile.nextColor, progress).hex()
      tile.path.fillColor = new paper.Color(color)
    })
  })
}