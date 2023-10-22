import { ArxPolygonFlags } from 'arx-convert/types'
import { Expand } from 'arx-convert/utils'
import { Entity, EntityConstructorPropsWithoutSrc, EntityModel, Material, Texture } from 'arx-level-generator'
import { createPlaneMesh } from 'arx-level-generator/prefabs/mesh'
import { ScriptSubroutine } from 'arx-level-generator/scripting'
import { TweakSkin } from 'arx-level-generator/scripting/commands'
import { Interactivity, Shadow, Variable } from 'arx-level-generator/scripting/properties'
import { Vector2 } from 'three'

const discoTile1 = Texture.fromCustomFile({
  filename: '[glass]-disco-tile-1.jpg',
  sourcePath: 'textures',
})

const discoTile2 = Texture.fromCustomFile({
  filename: '[glass]-disco-tile-2.jpg',
  sourcePath: 'textures',
})

const discoTile3 = Texture.fromCustomFile({
  filename: '[glass]-disco-tile-3.jpg',
  sourcePath: 'textures',
})

const discoTile4 = Texture.fromCustomFile({
  filename: '[glass]-disco-tile-4.jpg',
  sourcePath: 'textures',
})

const discoTile5 = Texture.fromCustomFile({
  filename: '[glass]-disco-tile-5.jpg',
  sourcePath: 'textures',
})

// ---------------------------------

const floorTileMesh = createPlaneMesh({
  size: new Vector2(100, 100),
  texture: Material.fromTexture(discoTile1, {
    flags: ArxPolygonFlags.None,
  }),
})

// ---------------------------------

type DiscoFloorTileConstructorProps = Expand<
  EntityConstructorPropsWithoutSrc & {
    skinIdx: 1 | 2 | 3 | 4 | 5
  }
>

export class DiscoFloorTile extends Entity {
  private propSkinIdx: Variable<number>

  constructor({ skinIdx, ...props }: DiscoFloorTileConstructorProps = { skinIdx: 1 }) {
    super({
      src: 'fix_inter/disco_floor_tile',
      model: EntityModel.fromThreeJsObj(floorTileMesh, {
        filename: 'disco_floor_tile.ftl',
        originIdx: 1,
      }),
      otherDependencies: [discoTile1, discoTile2, discoTile3, discoTile4, discoTile5],
      ...props,
    })
    this.withScript()

    this.position.z += 50

    this.propSkinIdx = new Variable('int', 'skin_idx', skinIdx)

    const tileSkin1 = new TweakSkin(discoTile1, discoTile1)
    const tileSkin2 = new TweakSkin(discoTile1, discoTile2)
    const tileSkin3 = new TweakSkin(discoTile1, discoTile3)
    const tileSkin4 = new TweakSkin(discoTile1, discoTile4)
    const tileSkin5 = new TweakSkin(discoTile1, discoTile5)

    const updateSkin = new ScriptSubroutine('update_skin', () => {
      if (!this.script?.isRoot) {
        return ``
      }

      return `
        if (${this.propSkinIdx.name} == 1) {
          ${tileSkin1.toString()}
          accept
        }
        if (${this.propSkinIdx.name} == 2) {
          ${tileSkin2.toString()}
          accept
        }
        if (${this.propSkinIdx.name} == 3) {
          ${tileSkin3.toString()}
          accept
        }
        if (${this.propSkinIdx.name} == 4) {
          ${tileSkin4.toString()}
          accept
        }
        if (${this.propSkinIdx.name} == 5) {
          ${tileSkin5.toString()}
          accept
        }
      `
    })

    this.script?.properties.push(this.propSkinIdx)
    this.script?.subroutines.push(updateSkin)

    this.script
      ?.whenRoot()
      .on('init', () => {
        return `
          setgroup disco_tile
          ${Interactivity.off}
          ${Shadow.off}
        `
      })
      .on('initend', () => updateSkin.invoke())
      .on('change_skin', () => {
        return `
          random 50 {
            accept
          }

          inc ${this.propSkinIdx.name} 1
          if (${this.propSkinIdx.name} > 5) {
            set ${this.propSkinIdx.name} 1
          }
          ${updateSkin.invoke()}
        `
      })
  }
}
