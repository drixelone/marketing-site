import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three'

/** A rounded rectangular ribbon swept around a shaped elliptical centreline.
 * Most of the band stands upright. The half twist is concentrated at the back,
 * so the front remains broad and the back folds diagonally through the opening.
 * Subdivisions across the faces give the satin surface a soft transverse crown.
 */
export function createRibbonGeometry(segments = 320) {
  const positions: number[] = [], indices: number[] = [], uvs: number[] = []
  const section: [number, number][] = []
  const halfWidth = 0.58, radius = 0.023, arcSteps = 10, faceSteps = 20
  for (let j = 0; j <= arcSteps; j++) {
    const a = -Math.PI / 2 + j / arcSteps * Math.PI
    section.push([halfWidth - radius + radius * Math.cos(a), radius * Math.sin(a)])
  }
  for (let j = 1; j < faceSteps; j++) section.push([(halfWidth - radius) * (1 - 2 * j / faceSteps), radius])
  for (let j = 0; j <= arcSteps; j++) {
    const a = Math.PI / 2 + j / arcSteps * Math.PI
    section.push([-halfWidth + radius + radius * Math.cos(a), radius * Math.sin(a)])
  }
  for (let j = 1; j < faceSteps; j++) section.push([(halfWidth - radius) * (-1 + 2 * j / faceSteps), -radius])
  const bump = (u: number, at: number, spread: number) => Math.exp((Math.cos(u - at) - 1) / (spread * spread))
  const centerAt = (u: number) => {
    const t = u + Math.PI / 2
    return new Vector3(
      2.48 * Math.cos(t),
      0.08 * Math.cos(u) + 0.34 * bump(u, 1.02 * Math.PI, 0.38) - 0.15 * bump(u, 1.57 * Math.PI, 0.32),
      1.64 * Math.sin(t),
    )
  }
  const count = section.length
  for (let i = 0; i <= segments; i++) {
    const u = i / segments * Math.PI * 2
    const t = u + Math.PI / 2
    const center = centerAt(u)
    const tangent = centerAt(u + 0.0001).sub(centerAt(u - 0.0001)).normalize()
    const radial = new Vector3(Math.cos(t) / 2.48, 0, Math.sin(t) / 1.64).normalize()
    const up = new Vector3().crossVectors(tangent, radial).normalize()
    const f = Math.max(0, Math.min(1, (u - Math.PI * 0.68) / (Math.PI * 0.9)))
    const smooth = f * f * (3 - 2 * f)
    const twist = Math.PI / 2 + Math.PI * smooth + 0.12 * Math.sin(u)
    const wide = radial.clone().multiplyScalar(Math.cos(twist)).addScaledVector(up, Math.sin(twist))
    const normal = new Vector3().crossVectors(tangent, wide).normalize()
    for (const [w, d] of section) {
      uvs.push(i / segments, (w + halfWidth) / (halfWidth * 2))
      const crown = 0.09 * (1 - (w / halfWidth) ** 2) * Math.cos(u / 2)
      const widthScale = 0.88 + 0.12 * (1 - Math.cos(u)) / 2 + 0.18 * bump(u, 1.22 * Math.PI, 0.39) - 0.22 * bump(u, 1.57 * Math.PI, 0.30)
      const p = center.clone().addScaledVector(wide, w * widthScale).addScaledVector(normal, d + crown)
      positions.push(p.x, p.y, p.z)
    }
  }
  for (let i = 0; i < segments; i++) for (let j = 0; j < count; j++) {
    const a = i * count + j, b = i * count + (j + 1) % count
    const c = a + count, d = b + count
    indices.push(a, b, c, b, d, c)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const normals = geometry.getAttribute('normal')
  for (let j = 0; j < count; j++) {
    const start = (j + count / 2) % count, end = segments * count + j
    const n = new Vector3().fromBufferAttribute(normals, start).add(new Vector3().fromBufferAttribute(normals, end)).normalize()
    normals.setXYZ(start, n.x, n.y, n.z); normals.setXYZ(end, n.x, n.y, n.z)
  }
  geometry.computeBoundingSphere()
  return geometry
}
