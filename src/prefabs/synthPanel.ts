import { ArxPolygonFlags } from 'arx-convert/types'
import { Material, Texture, Vector3 } from 'arx-level-generator'
import { createPlaneMesh } from 'arx-level-generator/prefabs/mesh'
import { scaleUV } from 'arx-level-generator/tools/mesh'
import { applyTransformations } from 'arx-level-generator/utils'
import { MathUtils, Vector2 } from 'three'

type createSynthPanelProps = {
  position: Vector3
  size: Vector2
}

export const createSynthPanel = ({ position, size }: createSynthPanelProps) => {
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

  return panel
}
