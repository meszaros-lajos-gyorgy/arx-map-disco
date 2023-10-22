import { Expand } from 'arx-convert/utils'
import { EntityConstructorPropsWithoutSrc } from 'arx-level-generator'
import { Marker } from 'arx-level-generator/prefabs/entity'
import { ScriptSubroutine } from 'arx-level-generator/scripting'
import { useDelay } from 'arx-level-generator/scripting/hooks'
import { Variable } from 'arx-level-generator/scripting/properties'
import { roundToNDecimals } from 'arx-level-generator/utils'
import { times } from 'arx-level-generator/utils/faux-ramda'

type TimerConstructorProps = Expand<
  EntityConstructorPropsWithoutSrc & {
    numberOfSteps: number
    notesPerBeat: number
    bpm: number
    numberOfInstruments: number
    startsMuted: boolean
  }
>

export class Timer extends Marker {
  private propStep: Variable<number>
  private propMaxSteps: Variable<number>

  private propIsOn: Variable<boolean>[]

  private mainLoop: ScriptSubroutine

  constructor({
    numberOfSteps,
    notesPerBeat,
    bpm,
    numberOfInstruments,
    startsMuted: startMuted,
    ...props
  }: TimerConstructorProps) {
    super(props)

    this.withScript()

    this.propStep = new Variable('int', 'step', 0)
    this.propMaxSteps = new Variable('int', 'max_steps', numberOfSteps)
    this.propIsOn = times((i) => new Variable('bool', `on_${i}`, !startMuted), numberOfInstruments)

    this.mainLoop = new ScriptSubroutine('main_loop', () => {
      return `
        inc ${this.propStep.name} 1
        if (${this.propStep.name} >= ${this.propMaxSteps.name}) {
          set ${this.propStep.name} 0
        }

        sendevent tick self ~${this.propStep.name}~

        ${times((y) => {
          return `
            if (${this.propIsOn[y].name} == 1) {
              sendevent trigger self "~${this.propStep.name}~ ${y}"
            }
          `
        }, numberOfInstruments).join('\n')}
      `
    })

    this.script?.properties.push(this.propStep, this.propMaxSteps, ...this.propIsOn)
    this.script?.subroutines.push(this.mainLoop)

    this.script
      ?.on('initend', () => {
        const { loop } = useDelay()
        const interval = 1 / notesPerBeat / (bpm / 60)
        return `${loop(roundToNDecimals(3, interval) * 1000)} ${this.mainLoop.invoke()}`
      })
      .on('custom', () => {
        return `
          // if (^#param2 != 0) {
          //   accept
          // }

          if (^$param1 == "on") {
            set §on_~^#param2~ 1
            accept
          }
          if (^$param1 == "off") {
            set §on_~^#param2~ 0
            accept
          }
        `
      })
  }
}
