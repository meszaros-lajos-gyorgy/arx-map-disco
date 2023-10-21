import { EntityConstructorPropsWithoutSrc, Texture } from 'arx-level-generator'
import { Cube } from 'arx-level-generator/prefabs/entity'
import { ScriptSubroutine } from 'arx-level-generator/scripting'
import { LoadAnim, TweakSkin } from 'arx-level-generator/scripting/commands'
import { useDelay } from 'arx-level-generator/scripting/hooks'
import { Interactivity, Scale, Speed, Variable } from 'arx-level-generator/scripting/properties'

export class Button extends Cube {
  private propIsOn: Variable<boolean>

  constructor(props: EntityConstructorPropsWithoutSrc = {}) {
    super(props)
    this.withScript()
    this.propIsOn = new Variable('bool', 'on', false)

    const onSkin = new TweakSkin(Texture.stoneGroundCavesWet05, Texture.aliciaRoomMur02)
    const offSkin = new TweakSkin(Texture.stoneGroundCavesWet05, Texture.stoneHumanPriest4)
    const updateSkin = new ScriptSubroutine('update_skin', () => {
      return `
        if (${this.propIsOn.name} == 1) {
          ${onSkin.toString()}
        } else {
          ${offSkin.toString()}
        }
      `
    })

    this.script?.properties.push(this.propIsOn)

    // TODO: only add this subroutine to the script if isRoot
    this.script?.subroutines.push(updateSkin)

    this.script
      ?.on('init', () => {
        if (!this.script?.isRoot) {
          return ``
        }

        return `
          ${Interactivity.on}
          ${new Scale(0.1)}
          ${new Speed(2)}
          ${new LoadAnim('action1', 'push_button')}
        `
      })
      .on('initend', () => {
        if (!this.script?.isRoot) {
          return ''
        }

        return `
          ${updateSkin.invoke()}
        `
      })
      .on('clicked', () => {
        if (!this.script?.isRoot) {
          return ''
        }

        const { delay } = useDelay()

        return `
          ${Interactivity.off}
          ${delay(500)} ${Interactivity.on}
          if (${this.propIsOn.name} == 1) {
            set ${this.propIsOn.name} 0
          } else {
            set ${this.propIsOn.name} 1
          }
          ${updateSkin.invoke()}
          playanim action1
        `
      })
      .on('trigger', () => {
        if (!this.script?.isRoot) {
          return ''
        }

        return `
          if (^$param1 == "in") {
            if (${this.propIsOn.name} == 1) {
              sendevent trigger self "out"
            }
          }
        `
      })
  }

  get isOn() {
    return this.propIsOn.value
  }

  on() {
    this.propIsOn.value = true
  }
  off() {
    this.propIsOn.value = false
  }
}
