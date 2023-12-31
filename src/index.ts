import {
  ArxMap,
  Audio,
  DONT_QUADIFY,
  Entity,
  HudElements,
  Rotation,
  SHADING_SMOOTH,
  Settings,
  Texture,
  Vector3,
} from 'arx-level-generator'
import { Lever, SoundPlayer } from 'arx-level-generator/prefabs/entity'
import { loadRooms } from 'arx-level-generator/prefabs/rooms'
import { Label, Scale, Shadow } from 'arx-level-generator/scripting/properties'
import { createLight, createZone } from 'arx-level-generator/tools'
import { scaleUV, toArxCoordinateSystem } from 'arx-level-generator/tools/mesh'
import { pickRandom, randomBetween } from 'arx-level-generator/utils/random'
import { CylinderGeometry, MathUtils, Mesh, MeshBasicMaterial, Vector2 } from 'three'
import { Button } from '@/entities/Button.js'
import { Cursor } from '@/entities/Cursor.js'
import { DiscoFloorTile } from '@/entities/DiscoFloorTile.js'
import { Timer } from '@/entities/Timer.js'
import { jarreZoolookologie } from '@/patterns.js'
import { createSynthPanel } from '@/prefabs/synthPanel.js'
import { createLamp } from './prefabs/lamp.js'

const settings = new Settings()

const map = new ArxMap()
map.config.offset = new Vector3(6000, 0, 6000)
map.player.position.adjustToPlayerHeight()
map.player.withScript()
map.hud.hide(HudElements.Minimap)

// ---------------------------

const pattern = jarreZoolookologie

const synthWallPosZ = 500
const synthWallPosY = -30

// ---------------------------

const instruments = [
  new SoundPlayer({ audio: Audio.spiderStep3 }),
  new SoundPlayer({ audio: Audio.metalOnWood2 }),
  new SoundPlayer({ audio: Audio.sausageJump }),
  new SoundPlayer({ audio: Audio.footstepShoeMetalStep }),
  new SoundPlayer({ audio: Audio.interfaceInvstd }),
  new SoundPlayer({ audio: Audio.clothOnCloth1 }),
]

const buttonPattern = pattern.map((row) => {
  return row.replaceAll(' ', '')
})

const numberOfBeats = buttonPattern[0].length

const offsetLeft = -360

const rootButton = new Button()
rootButton.script?.makeIntoRoot()

const buttons: Button[] = []
for (let patternY = 0; patternY < pattern.length; patternY++) {
  const row: Button[] = []

  let x = -1
  for (let patternX = 0; patternX < pattern[patternY].length; patternX++) {
    if (pattern[patternY][patternX] === ' ') {
      continue
    }

    x++

    const button = new Button({
      position: new Vector3(offsetLeft + patternX * 20, -220 + patternY * 30 + synthWallPosY, synthWallPosZ),
      orientation: new Rotation(0, MathUtils.degToRad(-90), 0),
      isOn: false,
      isToggleSwitch: true,
    })
    if (pattern[patternY][patternX] === 'x') {
      button.on()
    }
    button.script
      ?.on(
        'init',
        ((colIdx, rowIdx) => () => {
          return `setgroup btn_${colIdx}_${rowIdx}`
        })(x, patternY),
      )
      .on('trigger', () => {
        return `
          if (^$param1 == "out") {
            sendevent play ${instruments[patternY].ref} nop
          }
        `
      })
    row.push(button)
  }

  const trySoundButton = new Button({
    position: new Vector3(-60 + offsetLeft, -220 + patternY * 30 + synthWallPosY, synthWallPosZ),
    orientation: new Rotation(0, MathUtils.degToRad(-90), 0),
    isOn: true,
    isToggleSwitch: false,
  })
  trySoundButton.script?.on('clicked', () => {
    return `sendevent play ${instruments[patternY].ref} nop`
  })

  buttons.push(...row, trySoundButton)
}

// -----------------

const cursor = new Cursor({
  position: new Vector3(offsetLeft, -250 + synthWallPosY, synthWallPosZ),
  orientation: new Rotation(0, MathUtils.degToRad(-90), 0),
})

// -----------------

const rootDiscoTile = new DiscoFloorTile()
rootDiscoTile.script?.makeIntoRoot()

const discoTiles: DiscoFloorTile[] = []
for (let x = 0; x < 9; x++) {
  for (let y = 0; y < 4; y++) {
    const discoTile = new DiscoFloorTile({
      position: new Vector3(-450 + x * 100, -5, 150 - y * 100),
      skinIdx: pickRandom([1, 2, 3, 4, 5]),
    })
    discoTiles.push(discoTile)
  }
}

// -----------------

const timer = new Timer({
  numberOfSteps: numberOfBeats,
  notesPerBeat: 4,
  bpm: 120,
  numberOfInstruments: instruments.length,
  startsMuted: settings.mode === 'development',
})
timer.script
  ?.on('tick', () => {
    return `
      sendevent -g disco_tile change_skin nop

      if (^#param1 == 0) {
        sendevent move_x ${cursor.ref} -${(numberOfBeats - 1 + 7) * 20}
      } else {
        set @float ^#param1
        div @float 4
        set §int @float
        dec @float §int

        // if (((float)(^#param1 / 4) - (int)(^#param1 / 4)) == 0) {
        if (@float == 0) {
          sendevent move_x ${cursor.ref} 40
        } else {
          sendevent move_x ${cursor.ref} 20
        }
      }
    `
  })
  .on('trigger', () => {
    const targetGroup = '"btn_~^#param1~_~^#param2~"'
    const eventName = 'trigger'
    const params = ['in']
    return `
      sendevent -g ${targetGroup} ${eventName} "${params.join(' ')}"
    `
  })

// -----------------

const levers: Lever[] = []
for (let y = 0; y < pattern.length; y++) {
  const lever = new Lever({
    position: new Vector3(-30 + offsetLeft, -225 + y * 30 + synthWallPosY, synthWallPosZ),
    orientation: new Rotation(MathUtils.degToRad(90), 0, 0),
    isSilent: true,
  })
  lever.isPulled = settings.mode !== 'development'
  lever.script?.properties.push(new Label('sound on/off'), new Scale(0.5))
  lever.script?.on(
    'custom',
    ((rowIdx) => () => {
      return `
        if (^$param1 == "on") {
          sendevent custom ${timer.ref} "on ${rowIdx}"
        }
        if (^$param1 == "off") {
          sendevent custom ${timer.ref} "off ${rowIdx}"
        }
      `
    })(y),
  )
  levers.push(lever)
}

// ---------------------------

const synthPanel = createSynthPanel({
  position: map.config.offset.clone().add(new Vector3(0, -150 + synthWallPosY, synthWallPosZ)),
  size: new Vector2(pattern[0].length * 20 + 70 + 60, 190),
})

// ---------------------------

let cylinder = new CylinderGeometry(300, 300, 1200, 8, 1, false, MathUtils.degToRad(90), MathUtils.degToRad(180))
cylinder = toArxCoordinateSystem(cylinder)
scaleUV(new Vector2(7, 7), cylinder)

const wood = new MeshBasicMaterial({
  map: Texture.l4DwarfWoodBoard02,
})

const mesh = new Mesh(cylinder, wood)
mesh.position.add(map.config.offset.clone().add(new Vector3(0, 600 - 35, 530)))
mesh.scale.multiply(new Vector3(1.5, 1, 1))

map.polygons.addThreeJsMesh(mesh)

// TODO: subdivide polygons

// ---------------------------

const lute = new Entity({
  src: 'items/special/luth',
  position: new Vector3(-250, -35 - 20, 300),
  orientation: new Rotation(0, MathUtils.degToRad(15), MathUtils.degToRad(90)),
})
map.entities.push(lute)

// ---------------------------

// Tizzy and all the junk her script requires

const key = Entity.key
key.id = 8

const mug = new Entity({
  src: 'items/movable/mug',
  id: 18,
  position: new Vector3(0, 200, 0),
})

const barZone = createZone({
  position: new Vector3(0, 100, 0),
  size: new Vector3(10, 10, 10),
  name: 'bar',
})
map.zones.push(barZone)

const tizzy = new Entity({
  src: 'npc/human_base',
  id: 97,
  position: new Vector3(-350, 0, -500),
  orientation: new Rotation(0, MathUtils.degToRad(-90), 0),
})

const whereThePlayerStandsWhenTalkingWithTizzy = Entity.marker.at({
  position: tizzy.position.clone().add(new Vector3(200, 0, 0)),
})
whereThePlayerStandsWhenTalkingWithTizzy.id = 174

map.entities.push(mug, whereThePlayerStandsWhenTalkingWithTizzy, key, tizzy)

// ---------------------------

const loungeLight = createLight({
  position: new Vector3(0, -175, -1000),
  radius: 1000,
  intensity: 0.5,
})
map.lights.push(loungeLight)

const armchair1 = new Entity({
  src: 'items/movable/seat_armchair2_rich',
  position: new Vector3(350, 0, -1000 + randomBetween(-10, 10)),
  orientation: new Rotation(0, MathUtils.degToRad(180 - 45 + randomBetween(-15, 15)), 0),
})
armchair1.withScript()
armchair1.script?.properties.push(Shadow.off)
const armchair2 = new Entity({
  src: 'items/movable/seat_armchair2_rich',
  position: new Vector3(150, 0, -1050 + randomBetween(-10, 10)),
  orientation: new Rotation(0, MathUtils.degToRad(45 + randomBetween(-15, 15)), 0),
})
armchair2.withScript()
armchair2.script?.properties.push(Shadow.off)

const armchair3 = new Entity({
  src: 'items/movable/seat_armchair2_rich',
  position: new Vector3(-150, 0, -1000 + randomBetween(-10, 10)),
  orientation: new Rotation(0, MathUtils.degToRad(180 - 45 + randomBetween(-15, 15)), 0),
})
armchair3.withScript()
armchair3.script?.properties.push(Shadow.off)
const armchair4 = new Entity({
  src: 'items/movable/seat_armchair2_rich',
  position: new Vector3(-350, 0, -1050 + randomBetween(-10, 10)),
  orientation: new Rotation(0, MathUtils.degToRad(45 + randomBetween(-15, 15)), 0),
})
armchair4.withScript()
armchair4.script?.properties.push(Shadow.off)

map.entities.push(armchair1, armchair2, armchair3, armchair4)

// ---------------------------

const lamps = [
  createLamp({
    position: new Vector3(-480, -200, 300),
    variant: 'wall',
  }),
  createLamp({
    position: new Vector3(480, -200, 300),
    orientation: new Rotation(0, MathUtils.degToRad(180), 0),
    variant: 'wall',
  }),
  createLamp({
    position: new Vector3(-480, -200, 0),
    variant: 'wall',
  }),
  createLamp({
    position: new Vector3(480, -200, 0),
    orientation: new Rotation(0, MathUtils.degToRad(180), 0),
    variant: 'wall',
  }),

  createLamp({
    position: new Vector3(300, -550, -525),
    variant: 'ceiling',
  }),
  createLamp({
    position: new Vector3(0, -550, -525),
    variant: 'ceiling',
  }),
  createLamp({
    position: new Vector3(-300, -550, -525),
    variant: 'ceiling',
  }),

  createLamp({
    position: new Vector3(-480, -200, -1000),
    variant: 'wall',
  }),
  createLamp({
    position: new Vector3(480, -200, -1000),
    orientation: new Rotation(0, MathUtils.degToRad(180), 0),
    variant: 'wall',
  }),
]

// ---------------------------

const meshes = [synthPanel]
meshes.forEach((mesh) => {
  map.polygons.addThreeJsMesh(mesh, { tryToQuadify: DONT_QUADIFY, shading: SHADING_SMOOTH })
})

map.entities.push(
  rootButton,
  ...buttons,
  timer,
  ...levers,
  cursor,
  ...instruments,
  rootDiscoTile,
  ...discoTiles,
  ...lamps.flatMap(({ entities }) => entities),
)

map.lights.push(...lamps.flatMap(({ lights }) => lights))

// ---------------------------

const rooms = await loadRooms('./map.rooms', settings)
rooms.forEach((room) => {
  map.add(room, true)
})

map.finalize()
await map.saveToDisk(settings)

console.log('done')
