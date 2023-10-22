import { Color, Entity, Rotation, Vector3 } from 'arx-level-generator'
import { createLight } from 'arx-level-generator/tools'

type createLampProps = {
  position: Vector3
  orientation?: Rotation
}

const snakeLampBlue = Color.fromCSS('#2ba9f3')

export const createLamp = ({ position, orientation }: createLampProps) => {
  const lamp = new Entity({
    src: 'fix_inter/lamp_human_snake2',
    position,
    orientation,
  })

  const light = createLight({
    position: position.clone().add(new Vector3(0, -25, 0)),
    radius: 200,
    color: snakeLampBlue,
  })

  return {
    entities: [lamp],
    lights: [light],
  }
}
