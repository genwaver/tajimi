import './style.css'
import * as paper from 'paper'
import * as math from 'mathjs'
import chroma from 'chroma-js'
import * as building from './building'
import GUI from 'lil-gui'
import { CanvasCapture } from 'canvas-capture'
import { Logo, drawLogo } from './gw'
import { clamp, easeInOutCubic, easeOutBack } from './utils'

interface Painting {
  project: paper.Project
  canvas: HTMLCanvasElement,
  preview: HTMLCanvasElement
}

/**
 * Postal Settings
 */
const palette = {
  frameColor: 'white',
  backgroundColor: '#cce5ff',
  strokeColor: '#303ff5',
  tileColorA: '#ffa6cb',
  tileColorB: '#cce5ff',
  windowColor: '#fad4e4',
  windowShineColor: '#303ff5',
}

const settings = {
  previewWidth: 540 * 1.5,
  previewHeight: 540 * 1.5,
  postalWidth: 540,
  postalHeight: 540,
  postalFrameOffsetFactor: 0.825,
  postalFrameSizeFactor: 0.1,
  postalFrameRadius: 4.0,
  buildingHeightMinFactor: 0.35,
  buildingHeightMaxFactor: 0.7,
  buildingWidthMinFactor: 0.275,
  buildingWidthMaxFactor: 0.395,
  buildingWidthFactorThreshold: 0.25,
  buildingWidthMinimumFactor: 0.15,
  buildingCount: 8,
  windowRadius: 2.5,
  windowFrameOffsetFactor: 0.135,
  windowGridOffsetFactor: 0.1,
  windowGridCols: 2,
  windowMinFrameOffset: 3.0,
  buildingAnimation: 340.0,
  tileAnimation: 60.0,
  strokeWidth: 2.75,
  shadowBlur: 8.0,
  delayOffset: 21.5,
  delayOffset2: 12.0,
  delayOffset3: 25.0,
  exportScale: 2.0,
  updateTajimi: () => {
    updateTajimi()
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

const gui = new GUI({ title: 'Palette'})
gui.addColor(settings, 'backgroundColor').onChange(() => {
  updateSettings(postal!, settings)
})
gui.addColor(settings, 'windowColor').onChange(() => {
  updateSettings(postal!, settings)
})
gui.addColor(settings, 'windowShineColor').onChange(() => {
  updateSettings(postal!, settings)
})
gui.addColor(settings, 'strokeColor').onChange(() => {
  updateSettings(postal!, settings)
})
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

gui.hide()

function updateTajimi () {
  if(postal) {
    paper.project.activeLayer.removeChildren()
    postal = drawTajimiPostal(paper.view, settings)
    setupAnimation(postal)
  }
}

/*
gui.add(settings, 'exportScale').min(1.0).max(4.0).step(1.0).onChange(() => {
  if (painting && postal) {
    const canvasWidth = settings.postalWidth * settings.exportScale
    const canvasHeight = settings.postalHeight * settings.exportScale
    paper.view.viewSize = new paper.Size(canvasWidth * window.devicePixelRatio, canvasHeight * window.devicePixelRatio)

    postal.group.remove()
    postal = drawTajimiPostal(paper.view, settings)

    painting.canvas.style.width = `${canvasWidth}px`
    painting.canvas.style.height = `${canvasHeight}px`
    painting.canvas.width = canvasWidth * window.devicePixelRatio
    painting.canvas.height = canvasHeight * window.devicePixelRatio
  }
})
*/

/*
gui.add(settings, 'updateTajimi')
gui.add(settings, 'exportSvg')
gui.add(settings, 'record')
*/

const updateTileColors = (postal: TajimiPostal) => {
  postal.tajimi.buildings.forEach(b => b.tiles.forEach(tile =>{

    const currentColor = chroma(settings.tileColorA).brighten(math.random(-0.3, 0.3))
    const nextColor = chroma(settings.tileColorB).brighten(math.random(-0.3, 0.3))

    tile.path.fillColor = new paper.Color(currentColor.hex())

    tile.currentColor = currentColor.hex()
    tile.nextColor = nextColor.hex()
  }))
}


export interface TajimiPostal {
  group: paper.Group
  logo: Logo
  background: paper.Path,
  frame: paper.Path,
  tajimi: building.Tajimi,
  title: paper.PointText
}

const scale =  (number: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
  return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

const drawTajimiPostal = (view: paper.View, settings: any): TajimiPostal => {
  const background = new paper.Shape.Rectangle({
    point: [0, 0],
    size: view.size.clone(),
    fillColor: settings.backgroundColor,
  })

  const postalFrameOffset = (view.size.width - view.size.width * settings.postalFrameOffsetFactor) * 0.5
  const postalFrameSize = view.size.subtract(postalFrameOffset * 2.0)
  const postalFramePoint = new paper.Point(postalFrameOffset, postalFrameOffset)

  const postalFrame = new paper.Shape.Rectangle({
    point: postalFramePoint,
    size: postalFrameSize,
    strokeColor: settings.strokeColor,
    strokeWidth: settings.strokeWidth,
    fillColor: settings.frameColor,
    radius: settings.postalFrameRadius,
    shadowColor: '#00000026',
    shadowBlur: settings.shadowBlur,
    shadowOffset: new paper.Point(8.0, 8.0)
  })

  const canvasOffset = postalFrameSize.width * settings.postalFrameSizeFactor * 0.5
  const canvasPoint = postalFramePoint.add(canvasOffset)
  const canvasSize = postalFrameSize.subtract(canvasOffset * 2.0)

  const tajimi = building.drawTajimi(canvasPoint, canvasSize, settings)

  background.sendToBack()

  const logo = drawLogo(postalFramePoint.add(canvasOffset * 0.5),
    canvasOffset * 1.15, 
    {
      strokeWidth: settings.strokeWidth,
      shadowBlur: settings.shadowBlur,
      stroke: settings.strokeColor,
      fill: settings.frameColor,
      crest: settings.tileColorA,
      beak: settings.tileColorB
    }
  )

  const content = '多治見市'
  const fontSize = canvasOffset * 0.5

  const title = new paper.PointText(
    postalFramePoint
      .add(postalFrameSize)
      .subtract([canvasOffset * 0.5, canvasOffset * 0.5 + fontSize * -0.35])
      .subtract([(content.length + 1) * fontSize, 0.0])
  )

  title.fillColor = settings.strokeColor
  title.fontFamily = 'Noto Sans JP, sans-serif'
  title.fontSize = canvasOffset * 0.5
  title.fontWeight = '500'
  title.content = '多治見市'

  const group = new paper.Group()
  group.addChild(background)
  group.addChild(postalFrame)
  group.addChild(tajimi.group)
  group.addChild(logo.group)
  group.addChild(title)

  return {
    group,
    background,
    frame: postalFrame,
    tajimi,
    logo,
    title
  }
}

/**
 * Main Animation
 */

let postal: TajimiPostal | undefined = undefined
let painting: Painting | undefined = undefined
let playing = true
let globalFrame = 0

window.onload = () => {

  painting = setupPainting(settings)
  postal = drawTajimiPostal(paper.view, settings)
  setupAnimation(postal!)
  updateSettings(postal!, settings)
  CanvasCapture.init(painting.canvas)

  paper.view.onFrame = (event: any) => {
    if (playing)
      globalFrame += 1

    animateTimeline(globalFrame, postal!, settings)
    drawPreview(painting!, settings)
    checkRecording(painting!.canvas, globalFrame)
  }
}

const setupPainting = (settings: any) : Painting => {
  const preview: HTMLCanvasElement = document.getElementById('preview')
  preview.style.width = `${settings.previewWidth}px`
  preview.style.height = `${settings.previewHeight}px`
  preview.width = settings.previewWidth * window.devicePixelRatio
  preview.height = settings.previewHeight * window.devicePixelRatio

  const canvasWidth = settings.postalWidth * settings.exportScale
  const canvasHeight = settings.postalHeight * settings.exportScale

  const canvas: HTMLCanvasElement = document.getElementById('painting')
  canvas.style.width = `${canvasWidth}px`
  canvas.style.height = `${canvasHeight}px`
  canvas.width = canvasWidth * window.devicePixelRatio
  canvas.height = canvasHeight * window.devicePixelRatio

  const project = paper.setup(canvas)

  return {
    project,
    preview,
    canvas
  }
}

const drawPreview = ({preview, canvas}: Painting, settings: any) => {
  const ctx = preview.getContext('2d')
  const canvasWidth = settings.postalWidth * settings.exportScale * window.devicePixelRatio
  const canvasHeight = settings.postalHeight * settings.exportScale * window.devicePixelRatio
  ctx?.drawImage(canvas, 0, 0, canvasWidth, canvasHeight, 0, 0, settings.previewWidth * window.devicePixelRatio, settings.previewHeight * window.devicePixelRatio)
}

/**
 * Recording logic
 */
let recordingRequested = false
let isRecording = false
let recordingFrames = settings.buildingAnimation


const checkRecording = (canvas: HTMLCanvasElement, frame: number) => {
  const animationFrame = frame % recordingFrames

  if (recordingRequested) {
    isRecording = animationFrame === 0
    recordingRequested = !isRecording
  }

  if(isRecording) {
    if (animationFrame === 0) {
      CanvasCapture.setVerbose(true)
      CanvasCapture.beginPNGFramesRecord({ onExportProgress: (progress) => {
        console.log(`Zipping... ${Math.round(progress * 100)}% complete.`)
      }})
    }
    
    if (animationFrame < recordingFrames) {
      CanvasCapture.recordFrame()
    }
    
    if (animationFrame === recordingFrames - 1) {
      CanvasCapture.stopRecord()
    }


    isRecording = animationFrame < recordingFrames - 1
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
  postal.tajimi.buildings.forEach(b => {
    b.body.strokeColor = settings.strokeColor
    b.bodyShadow.fillColor = settings.strokeColor
    b.bodyShadow.shadowColor = settings.strokeColor
  })
  postal.tajimi.buildings.forEach(b => b.tiles.forEach(t => t.path.strokeColor = settings.strokeColor))
  postal.tajimi.buildings.forEach(b => b.windows.forEach((w) => {
    w.frame.strokeColor = settings.strokeColor
    w.glass.strokeColor = settings.strokeColor
    w.division.strokeColor = settings.strokeColor
    w.person.fillColor = settings.strokeColor
    w.glassFrame.strokeColor = settings.strokeColor
    w.frame.shadowColor = settings.strokeColor
    w.shines.forEach(s => s.fillColor = chroma(settings.windowShineColor).brighten(1.5).hex())
  }))

  postal.logo.group.strokeColor = settings.strokeColor
  postal.title.fillColor = settings.strokeColor
  postal.logo.eye.fillColor = settings.strokeColor
  postal.logo.crest.fillColor = settings.tileColorA
  postal.logo.beak.fillColor = settings.tileColorB

  const btns = document.getElementsByClassName('button')
  for (let index = 0; index < btns.length; index++) {
    btns[index].style.borderColor = settings.strokeColor
    btns[index].style.color = settings.strokeColor
  }
}

/**
 * 
 * Animation Functions
 */

const animateBuildings = (_globalFrame: number, postal: TajimiPostal, settings: any) => {
  postal.tajimi.buildings.forEach(building => {
    const speed = postal.tajimi.size.width / settings.buildingAnimation
    building.group.position.x -= speed

    if (building.group.position.x < postal.tajimi.point.x ) {
      building.group.position.x = postal.tajimi.point.x + postal.tajimi.size.width
    }
  })
}

const animateWindows = (_globalFrame: number, postal: TajimiPostal, settings: any) => {
  postal.tajimi.buildings.forEach(building => {
    building.windows.forEach(window => {
      const offset = scale(building.body.position.x, 0.0, paper.view.size.width, -8.0, 8.0)
      window.frame.shadowOffset.x = offset
    })
  })
}

const animateTiles = (globalFrame: number, buildings: Array<building.Building>) => {
  buildings.forEach((building, buildingIndex) => {
    building.tiles.forEach((tile, index) => {

      let buildingPoint = new paper.Point(
        scale(tile.point.x, building.body.bounds.topLeft.x, building.body.bounds.topRight.x, -0.5, 0.5),
        scale(tile.point.y, building.body.bounds.topLeft.y, building.body.bounds.bottomLeft.y, -0.5, 0.5)
      )

      let delay = index * settings.delayOffset
      delay += buildingIndex * settings.delayOffset3

      let animationFrame = (globalFrame + delay) % settings.tileAnimation
      const progress = scale(animationFrame, 0.0, settings.tileAnimation, 0.0, 1.0)
      const ease = Math.pow(Math.sin(progress * Math.PI * 2.0), 2.0)
      const s = tile.size.multiply(ease)
      tile.path.size = s

    })
  })
}

/**
 * Animation setup
 */
const setupAnimation = (postal: TajimiPostal) => {
  /**
   * Setup random durations
   */
  postal.tajimi.buildings.forEach((b, bIndex) => {
    const endPos = b.group.position.x > postal.tajimi.point.add(postal.tajimi.size.multiply(0.5)).x ?
      postal.tajimi.point.add(postal.tajimi.size).add(b.size).x :
      -b.size.width

    b.animationData.duration = math.randomInt(45.0, 60.0)
    b.animationData.delay = math.randomInt(0.0, 60.0 - b.animationData.duration)
    b.animationData.buildingPos = {
      start: b.group.position.x,
      end: endPos
    }

    b.tiles.forEach((t, index) => {
      /**
       * In animation
       */
      const totalDuration = 80.0
      const tDelaySpan = 10.0
      const tileDelay = tDelaySpan / b.tiles.length
      const bDelaySpan = 30.0
      const bDelay = bDelaySpan / postal.tajimi.buildings.length
      const inDuration = totalDuration - tDelaySpan - bDelaySpan

      t.animationData.inDuration = inDuration
      t.animationData.inDelay = ((b.tiles.length - index) * tileDelay) + (bIndex * bDelay)

      /**
       * Main animation
       */
      const mainDuration = math.randomInt(60, 80) + 10.0
      const mainDelaySpan = 10.0
      const randomDelay = math.randomInt(0.0, 90.0 - mainDuration)
      const delayAmount = scale(t.point.y, b.point.y, b.point.add(b.size).y, 1.0, 0.0)

      t.animationData.duration = mainDuration - mainDelaySpan
      t.animationData.delay = (mainDelaySpan * delayAmount) + randomDelay

    })

    b.windows.forEach((w, i) => {
      const totalDuration = 90.0
      const delaySpan = 50.0
      const wDelay = (b.windows.length - i) * (delaySpan / b.windows.length)

      const personDirection = math.pickRandom([1.1, -1.1])

      w.animationData = {}
      w.animationData.duration = totalDuration - delaySpan
      w.animationData.delay = wDelay
      w.animationData.frameSize = w.frame.size
      w.animationData.glassSize = w.glass.size
      w.animationData.personPos = {
        previous: w.person.position.x + (w.glass.size.width * personDirection),
        start: w.person.position.x + (w.glass.size.width * personDirection),
        end: w.person.position.x
      }

      w.person.translate([w.person.position.x - (w.person.position.x + (w.glass.size.width * personDirection)), 0.0])
    })
  })
}

/**
 * Timeline animation
 */

const animateTimeline = (frame: number, postal: TajimiPostal, settings: any) => {
  const animationFrame = frame % 340.0
  /**
   * Random Body Buildings Appears
   * 0 -> 60 frames
   */
  postal.tajimi.buildings.forEach((b, bIndex) => {
    const start = b.animationData.delay
    const end = b.animationData.delay + b.animationData.duration

    let bFrame = clamp(animationFrame, start, end)
    let bProgress = scale(bFrame, start, end, 0.0, 1.0)
    let bEase = easeOutBack(bProgress)
    const size = b.size.multiply(bEase)
    b.body.size = size
    b.bodyShadow.size = size

    /**
     * Tiles frames
     * 60 -> 120 frames
     */
    let tileEnd = 0.0

    b.tiles.forEach((t, i) => {
      /**
       * In Animation
       */
      const inStart = b.animationData.duration + t.animationData.inDelay 
      const inEnd = b.animationData.duration + t.animationData.inDelay + t.animationData.inDuration

      let tInFrame = clamp(animationFrame, inStart, inEnd)
      let tInProgress = scale(tInFrame, inStart, inEnd, 0.0, 1.0)
      let tInEase = easeInOutCubic(tInProgress)
      tInEase = animationFrame < 60.0 ? 0.0 : tInEase
      const size = t.size.multiply(tInEase)
      t.path.size = size

      /**
       * Detail animation
       */
      const dStart = inEnd + t.animationData.delay
      const dEnd = dStart + t.animationData.duration
      tileEnd = inEnd

      let tDFrame = clamp(animationFrame, dStart, dEnd)
      let tDProgress = scale(tDFrame, dStart, dEnd, 0.0, 1.0)
      let tDEase = Math.pow(Math.sin(tDProgress * Math.PI * 3.0), 2)

      const color = chroma.mix(t.currentColor, t.nextColor, tDEase).hex()

      t.path.fillColor = color
    })

    /**
     * WindowFrames frames
     * 60 -> 120 frames
     */
    b.windows.forEach((w, wIndex) => {

      const inStart = tileEnd + w.animationData.delay 
      const inEnd = inStart + w.animationData.duration

      let tInFrame = clamp(animationFrame, inStart, inEnd)
      let tInProgress = scale(tInFrame, inStart, inEnd, 0.0, 1.0)
      let tInEase = easeOutBack(tInProgress)

      tInEase = animationFrame < inStart ? 0.0 : tInEase

      w.frame.size = w.animationData.frameSize.multiply(tInEase)
      w.glass.size = w.animationData.glassSize.multiply(tInEase)
      w.glassFrame.size = w.animationData.glassSize.multiply(tInEase)

      const divisionStart = w.division.firstSegment
      const divisionEnd = w.division.lastSegment

      divisionStart.point.y = w.glass.bounds.center.y - w.glass.size.height * 0.5
      divisionEnd.point.y = w.glass.bounds.center.y + w.glass.size.height * 0.5

      const gStart = inEnd
      const gEnd = gStart + 60.0

      let gFrame = clamp(animationFrame, gStart, gEnd)
      let gProgress = scale(gFrame, gStart, gEnd, 0.0, 1.0)
      let gEase = easeOutBack(gProgress)

      const posX = scale(gEase, 0.0, 1.0, w.animationData.personPos.start, w.animationData.personPos.end)
      const deltaX = w.animationData.personPos.previous - posX

      w.person.translate([deltaX, 0.0])
      w.shines.forEach(s => s.opacity = gEase)

      w.animationData.personPos.previous = posX
    })

    /**
     * Out animation
     */
    const outStart = 265.0
    const outEnd = 265.0 + 75.0
    let bOutFrame = clamp(animationFrame, outStart, outEnd)
    let bOutProgress = scale(bOutFrame, outStart, outEnd, 0.0, 1.0)
    let bOutEase = easeInOutCubic(bOutProgress)


    b.group.position.x = scale(bOutEase, 0.0, 1.0, b.animationData.buildingPos.start, b.animationData.buildingPos.end)
  })
}

document.getElementById('generate')?.addEventListener('click', () => updateTajimi())
document.getElementById('settings')?.addEventListener('click', () => gui.show(gui._hidden))
document.getElementById('download')?.addEventListener('click', () => CanvasCapture.takePNGSnapshot())
document.getElementById('play')?.addEventListener('click', () => {
  const btn = document.getElementById('play')?.firstElementChild
  playing = !playing

  if (!playing) {
    btn?.classList.remove('fa-pause')
    btn?.classList.add('fa-play')
  } else {
    btn?.classList.remove('fa-play')
    btn?.classList.add('fa-pause')
  }
})