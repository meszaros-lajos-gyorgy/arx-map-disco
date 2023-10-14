import { Entity, EntityConstructorPropsWithoutSrc } from 'arx-level-generator'
import { Interactivity, Invulnerability, Scale, Shadow } from 'arx-level-generator/scripting/properties'

export class Cursor extends Entity {
  constructor(props: EntityConstructorPropsWithoutSrc = {}) {
    super({
      src: 'npc/flying_creature',
      ...props,
    })
    this.withScript()
    this.script?.properties.push(new Scale(0.2), Shadow.off, Invulnerability.on, Interactivity.off)

    this.script?.on('move_x', () => {
      return `
        move ^#param1 0 0
      `
    })
  }
}
