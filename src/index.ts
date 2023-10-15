import { ArxPolygonFlags } from 'arx-convert/types'
import {
  ArxMap,
  Audio,
  DONT_QUADIFY,
  HudElements,
  Material,
  Rotation,
  SHADING_SMOOTH,
  Settings,
  Texture,
  Vector3,
} from 'arx-level-generator'
import { Lever, SoundPlayer } from 'arx-level-generator/prefabs/entity'
import { createPlaneMesh } from 'arx-level-generator/prefabs/mesh'
import { loadRooms } from 'arx-level-generator/prefabs/rooms'
import { Label } from 'arx-level-generator/scripting/properties'
import { scaleUV } from 'arx-level-generator/tools/mesh'
import { applyTransformations } from 'arx-level-generator/utils'
import { MathUtils, Vector2 } from 'three'
import { Button } from '@/entities/Button.js'
import { Cursor } from '@/entities/Cursor.js'
import { Timer } from '@/entities/Timer.js'
import { DiscoFloorTile, floorTileMesh } from './entities/DiscoFloorTile.js'

const settings = new Settings()

const map = new ArxMap()
map.config.offset = new Vector3(6000, 0, 6000)
map.player.position.adjustToPlayerHeight()
map.player.withScript()
map.hud.hide(HudElements.Minimap)

// ---------------------------

const createSynthPanel = (position: Vector3, size: Vector2) => {
  const metal = Material.fromTexture(
    Texture.fromCustomFile({
      filename: 'dark-[metal]-grid.jpg',
      sourcePath: 'textures',
    }),
    {
      flags: ArxPolygonFlags.Tiled,
    },
  )

  const panel = createPlaneMesh({ size, texture: metal })
  panel.rotateX(MathUtils.degToRad(90))
  scaleUV(new Vector2(0.5, 0.5), panel.geometry)
  applyTransformations(panel)
  panel.translateX(position.x)
  panel.translateY(position.y)
  panel.translateZ(position.z)

  return [panel]
}

// prettier-ignore
const formattedButtonPattern = [
  '.... .... .... .... .... .... .... ....',
  '.... .... .... .... ..xx xx.. x... ....',
  '.... .... .... .... .... .... .... ....',
  '.... .... .... .... .... .... .... ....',
  '.... x... .... x... .... x... .... x...',
  'x.x. .x.. x.xx .x.. x.x. .x.. x... ...x',
]

// ---------------------------

const instruments = [
  new SoundPlayer({ audio: Audio.spiderStep3 }),
  new SoundPlayer({ audio: Audio.metalOnWood2 }),
  new SoundPlayer({ audio: Audio.sausageJump }),
  new SoundPlayer({ audio: Audio.footstepShoeMetalStep }),
  new SoundPlayer({ audio: Audio.interfaceInvstd }),
  new SoundPlayer({ audio: Audio.clothOnCloth1 }),
]

const buttonPattern = formattedButtonPattern.map((row) => {
  return row.replaceAll(' ', '')
})

const numberOfBeats = buttonPattern[0].length

const offsetLeft = -360

const buttons: Button[][] = []
for (let y = 0; y < formattedButtonPattern.length; y++) {
  const row: Button[] = []
  let cntr = -1
  for (let x = 0; x < formattedButtonPattern[y].length; x++) {
    if (formattedButtonPattern[y][x] === ' ') {
      continue
    }

    cntr++

    const button = new Button({
      position: new Vector3(offsetLeft + x * 20, -220 + y * 30, 400),
      orientation: new Rotation(0, MathUtils.degToRad(-90), 0),
    })
    if (formattedButtonPattern[y][x] === 'x') {
      button.on()
    }
    button.script?.on(
      'init',
      ((i) => () => {
        return `setgroup button_column_${i}`
      })(cntr),
    )
    button.script?.on('trigger', () => {
      return `
        if (^$param1 == "out") {
          sendevent play ${instruments[y].ref} nop
        }
      `
    })
    row.push(button)
  }
  buttons.push(row)
}

const timer = new Timer({ numberOfSteps: numberOfBeats, notesPerBeat: 4, bpm: 120 })

const lever = new Lever({
  position: new Vector3(-40 + offsetLeft, -220 + (buttonPattern.length / 2) * 30 - 20, 400),
  orientation: new Rotation(MathUtils.degToRad(90), 0, 0),
  isSilent: true,
})
lever.script?.properties.push(new Label('sound on/off'))

const cursor = new Cursor({
  position: new Vector3(offsetLeft, -220 - 30, 400),
  orientation: new Rotation(0, MathUtils.degToRad(-90), 0),
})

timer.isMuted = false
timer.script?.on('tick', () => {
  return `
    if (^#param1 == 0) {
      sendevent move_x ${cursor.ref} -${(numberOfBeats - 1 + 7) * 20}
    } else {
      if(^#param1 == 4) {
        sendevent move_x ${cursor.ref} 40
      } else {
        if (^#param1 == 8) {
          sendevent move_x ${cursor.ref} 40
        } else {
          if(^#param1 == 12) {
            sendevent move_x ${cursor.ref} 40
          } else {
            if(^#param1 == 16) {
              sendevent move_x ${cursor.ref} 40
            } else {
              if (^#param1 == 20) {
                sendevent move_x ${cursor.ref} 40
              } else {
                if(^#param1 == 24) {
                  sendevent move_x ${cursor.ref} 40
                } else {
                  if(^#param1 == 28) {
                    sendevent move_x ${cursor.ref} 40
                  } else {
                    if (^#param1 == 32) {
                      sendevent move_x ${cursor.ref} 40
                    } else {
                      if(^#param1 == 36) {
                        sendevent move_x ${cursor.ref} 40
                      } else {
                        sendevent move_x ${cursor.ref} 20
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `
})
timer.script?.on('trigger', () => {
  return `
    sendevent -g "button_column_~^#param1~" trigger "in"
  `
})

lever.isPulled = !timer.isMuted
lever.script?.on('custom', () => {
  return `
    if (^$param1 == "on") {
      sendevent custom ${timer.ref} "on"
    }
    if (^$param1 == "off") {
      sendevent custom ${timer.ref} "off"
    }
  `
})

// ---------------------------

const synthPanel = createSynthPanel(
  new Vector3(6000 + 0, -150, 6000 + 400),
  new Vector2(formattedButtonPattern[0].length * 20 + 70, 190),
)

const meshes = [...synthPanel]

meshes.forEach((mesh) => {
  map.polygons.addThreeJsMesh(mesh, { tryToQuadify: DONT_QUADIFY, shading: SHADING_SMOOTH })
})

map.entities.push(...buttons.flat(), timer, lever, cursor, ...instruments)

// ---------------------------

const discoTile = new DiscoFloorTile({
  position: new Vector3(0, -10, 0),
  // orientation: new Rotation(0, 0, 0),
})

map.entities.push(discoTile)

floorTileMesh.translateX(map.config.offset.x - 60)
floorTileMesh.translateY(map.config.offset.y + -10)
floorTileMesh.translateZ(map.config.offset.z)
applyTransformations(floorTileMesh)
map.polygons.addThreeJsMesh(floorTileMesh, {
  tryToQuadify: DONT_QUADIFY,
})

// ---------------------------

const rooms = await loadRooms('./map.rooms', settings)
rooms.forEach((room) => {
  map.add(room, true)
})

map.finalize()
await map.saveToDisk(settings)

console.log('done')
