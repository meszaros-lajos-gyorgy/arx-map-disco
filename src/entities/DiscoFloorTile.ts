import { ArxPolygonFlags } from 'arx-convert/types'
import { Expand } from 'arx-convert/utils'
import { Entity, EntityConstructorPropsWithoutSrc, EntityModel, Material, Rotation, Texture } from 'arx-level-generator'
import { createPlaneMesh } from 'arx-level-generator/prefabs/mesh'
import { Interactivity, Shadow } from 'arx-level-generator/scripting/properties'
import { getNonIndexedVertices } from 'arx-level-generator/tools/mesh'
import { applyTransformations } from 'arx-level-generator/utils'
import { BufferAttribute, BufferGeometry, MathUtils, Vector2 } from 'three'

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

type DiscoFloorTileProps = Expand<
  EntityConstructorPropsWithoutSrc & {
    // TODO
  }
>

// ---------------------------------

export const floorTileMesh = createPlaneMesh({
  size: new Vector2(100, 100),
  texture: Material.fromTexture(discoTile1, {
    flags: ArxPolygonFlags.None,
  }),
})

// ---------------------------------

export class DiscoFloorTile extends Entity {
  constructor({ ...props }: DiscoFloorTileProps = {}) {
    super({
      src: 'fix_inter/disco_floor_tile',
      model: EntityModel.fromThreeJsObj(floorTileMesh, {
        filename: 'disco_floor_tile.ftl',
        originIdx: 1,
      }),
      otherDependencies: [discoTile1, discoTile2, discoTile3, discoTile4, discoTile5],
      orientation: new Rotation(0, MathUtils.degToRad(-90), 0),
      ...props,
    })

    this.withScript()

    this.script?.properties.push(Interactivity.off, Shadow.off)
  }
}
