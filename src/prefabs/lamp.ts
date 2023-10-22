import { Color, Entity, Light, Rotation, Vector3 } from 'arx-level-generator'
import { createLight } from 'arx-level-generator/tools'

type createLampProps = {
  position: Vector3
  orientation?: Rotation
  variant: 'wall' | 'ceiling'
}

const snakeLampBlue = Color.fromCSS('#2ba9f3')
const goblinLampRed = Color.fromCSS('#c03a37')

export const createLamp = ({ position, orientation, variant }: createLampProps) => {
  let lamp: Entity
  let light: Light

  if (variant === 'wall') {
    lamp = new Entity({
      src: 'fix_inter/lamp_human_snake2',
      position,
      orientation,
    })
    light = createLight({
      position: position.clone().add(new Vector3(0, -25, 0)),
      radius: 200,
      color: snakeLampBlue,
    })
  } else {
    lamp = new Entity({
      src: 'fix_inter/lamp_goblin3',
      position: position.clone().add(new Vector3(0, -100, 0)),
      orientation,
    })
    light = createLight({
      position: position.clone().add(new Vector3(0, 200, 0)),
      radius: 400,
      color: goblinLampRed,
    })
  }

  return {
    entities: [lamp],
    lights: [light],
  }
}
