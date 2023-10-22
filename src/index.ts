import {
  ArxMap,
  Audio,
  DONT_QUADIFY,
  HudElements,
  Rotation,
  SHADING_SMOOTH,
  Settings,
  Vector3,
} from 'arx-level-generator'
import { Lever, SoundPlayer } from 'arx-level-generator/prefabs/entity'
import { loadRooms } from 'arx-level-generator/prefabs/rooms'
import { Label, Scale } from 'arx-level-generator/scripting/properties'
import { pickRandom } from 'arx-level-generator/utils/random'
import { MathUtils, Vector2 } from 'three'
import { Button } from '@/entities/Button.js'
import { Cursor } from '@/entities/Cursor.js'
import { DiscoFloorTile } from '@/entities/DiscoFloorTile.js'
import { Timer } from '@/entities/Timer.js'
import { jarreZoolookologie } from '@/patterns.js'
import { createSynthPanel } from '@/prefabs/synthPanel.js'

const settings = new Settings()

const map = new ArxMap()
map.config.offset = new Vector3(6000, 0, 6000)
map.player.position.adjustToPlayerHeight()
map.player.withScript()
map.hud.hide(HudElements.Minimap)

// ---------------------------

const pattern = jarreZoolookologie

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
      position: new Vector3(offsetLeft + patternX * 20, -220 + patternY * 30, 400),
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
    position: new Vector3(-60 + offsetLeft, -220 + patternY * 30, 400),
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
  position: new Vector3(offsetLeft, -220 - 30, 400),
  orientation: new Rotation(0, MathUtils.degToRad(-90), 0),
})

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
    position: new Vector3(-30 + offsetLeft, -225 + y * 30, 400),
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

// -----------------

const rootDiscoTile = new DiscoFloorTile()
rootDiscoTile.script?.makeIntoRoot()

const discoTiles: DiscoFloorTile[] = []

for (let x = 0; x < 9; x++) {
  for (let y = 0; y < 4; y++) {
    const discoTile = new DiscoFloorTile({
      position: new Vector3(-450 + x * 100, -5, 350 - y * 100),
      skinIdx: pickRandom([1, 2, 3, 4, 5]),
    })
    discoTiles.push(discoTile)
  }
}

// ---------------------------

const synthPanel = createSynthPanel(
  map.config.offset.clone().add(new Vector3(0, -150, 400)),
  new Vector2(pattern[0].length * 20 + 70 + 60, 190),
)

// ---------------------------

const meshes = [synthPanel]
meshes.forEach((mesh) => {
  map.polygons.addThreeJsMesh(mesh, { tryToQuadify: DONT_QUADIFY, shading: SHADING_SMOOTH })
})

map.entities.push(rootButton, ...buttons, timer, ...levers, cursor, ...instruments, rootDiscoTile, ...discoTiles)

// ---------------------------

const rooms = await loadRooms('./map.rooms', settings)
rooms.forEach((room) => {
  map.add(room, true)
})

map.finalize()
await map.saveToDisk(settings)

console.log('done')
