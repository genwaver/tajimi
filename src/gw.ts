import * as paper from 'paper'

export interface LogoPalette {
  stroke: string
  fill: string
  crest: string
  beak: string
}

export interface LogoSettings extends LogoPalette {
  strokeWidth: number
}

export interface Logo {
  group: paper.Group,
  crest: paper.Group,
  eye: paper.Path
  beak: paper.Path,
  body: paper.Path
}

export const drawLogo = (point: paper.Point, radius: number, settings: LogoSettings ): Logo => {
  const body = new paper.Path.Circle({
    center: point,
    radius,
    strokeWidth: settings.strokeWidth,
    strokeColor: settings.stroke,
    fillColor: settings.fill,
  })

  const crestPointA = new paper.Path.Circle({
    center: point.add([radius * 0.075, -radius]),
    radius: radius * 0.225,
    strokeWidth: settings.strokeWidth,
    strokeColor: settings.stroke,
    fillColor: settings.crest
  })

  const crestPointB = new paper.Path.Circle({
    center: point.add([radius * 0.35, -radius * 1.05]),
    radius: radius * 0.225,
    strokeWidth: settings.strokeWidth,
    strokeColor: settings.stroke,
    fillColor: settings.crest
  })

  const crestPointC = new paper.Path.Circle({
    center: point.add([radius * 0.55, -radius * 0.85]),
    radius: radius * 0.225,
    strokeWidth: settings.strokeWidth,
    strokeColor: settings.stroke,
    fillColor: settings.crest
  })

  const beak = new paper.Path.Circle({
    center: point.add([-radius, -radius * 0.05]),
    radius: radius * 0.2,
    strokeWidth: settings.strokeWidth,
    strokeColor: settings.stroke,
    fillColor: settings.beak
  })

  const eye = new paper.Path.Circle({
    center: point.subtract([radius * 0.385, radius * 0.415]),
    radius: radius * 0.0825,
    fillColor: settings.stroke
  })

  const g = new paper.PointText(point.add([radius * 0.35, radius * 0.225]))
  g.fillColor = settings.stroke
  g.fontSize = radius * 0.55
  g.fontFamily = 'Roboto, sans-serif'
  g.fontWeight = '300 italic'
  g.content = 'G'

  const waver = new paper.PointText(point.add([radius * 1.1, radius * 0.225]))
  waver.fillColor = settings.stroke
  waver.fontSize = radius * 0.55
  waver.fontFamily = 'Roboto, sans-serif'
  waver.fontWeight = '300 italic'
  waver.content = 'W  A  V  E  R'

  const group = new paper.Group()
  const crest = new paper.Group()

  crest.addChild(crestPointA)
  crest.addChild(crestPointB)
  crest.addChild(crestPointC)
  group.addChild(crest)
  group.addChild(beak)
  group.addChild(body)
  group.addChild(g)
  group.addChild(waver)
  group.addChild(eye)


  return {
    group,
    eye,
    crest,
    beak,
    body
  }
}