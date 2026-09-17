import { Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, useGLTF } from '@react-three/drei'
import { Group, MathUtils } from 'three'

type Props = { reduced: boolean; mobile: boolean; visible: boolean; onReady: () => void; onLost: () => void }
function Ribbon({ reduced, mobile, visible }: Props) {
  const group = useRef<Group>(null)
  const invalidate = useThree(state => state.invalidate)
  useLayoutEffect(() => {
    if (reduced && group.current) {
      group.current.rotation.set(0, 0, 0)
      group.current.position.y = 0.08
      invalidate()
    }
  }, [reduced, invalidate])
  const elapsed = useRef(0)
  const cursor = useRef({ x: 0, y: 0 })
  const { scene } = useGLTF('/assets/drixel-ribbon.glb', false)
  useEffect(() => {
    if (reduced || mobile) { cursor.current = { x: 0, y: 0 }; return }
    const move = (event: PointerEvent) => { cursor.current = { x: event.clientX / innerWidth * 2 - 1, y: event.clientY / innerHeight * 2 - 1 } }
    const reset = () => { cursor.current = { x: 0, y: 0 } }
    window.addEventListener('pointermove', move)
    document.addEventListener('pointerleave', reset)
    window.addEventListener('blur', reset)
    return () => { window.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', reset); window.removeEventListener('blur', reset) }
  }, [reduced, mobile])
  useFrame((_, delta) => {
    if (!group.current || !visible) return
    if (reduced) { group.current.rotation.set(0, 0, 0); group.current.position.y = 0.08; return }
    const dt = Math.min(delta, 0.05)
    elapsed.current += dt
    const t = elapsed.current
    group.current.rotation.x = MathUtils.damp(group.current.rotation.x, cursor.current.y * 0.045 + Math.sin(t * 0.24) * 0.025, 3, dt)
    group.current.rotation.y = MathUtils.damp(group.current.rotation.y, cursor.current.x * 0.085 + Math.sin(t * 0.18) * 0.07, 3, dt)
    group.current.rotation.z = MathUtils.damp(group.current.rotation.z, Math.sin(t * 0.22) * 0.018, 3, dt)
    group.current.position.y = 0.08 + Math.sin(t * 0.6) * 0.045
  })
  return <group ref={group} position={[0, 0.08, 0]} rotation={[0, 0, 0]}>
    <group rotation={[0, -0.42, -0.08]}><primitive object={scene} dispose={null} /></group>
  </group>
}
function Lifecycle({ onReady, onLost }: Pick<Props, 'onReady' | 'onLost'>) {
  const gl = useThree(state => state.gl)
  useEffect(() => {
    const canvas = gl.domElement
    const lost = (event: Event) => { event.preventDefault(); onLost() }
    canvas.addEventListener('webglcontextlost', lost)
    const id = requestAnimationFrame(onReady)
    return () => { cancelAnimationFrame(id); canvas.removeEventListener('webglcontextlost', lost) }
  }, [gl, onReady, onLost])
  return null
}
export default function RibbonScene(props: Props) {
  return <Canvas orthographic camera={{ position: [0, 4.4, 8], zoom: 100, near: 0.1, far: 50 }}
    dpr={[1, props.mobile ? 1.25 : 1.75]} frameloop={!props.visible ? 'never' : props.reduced ? 'demand' : 'always'}
    gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }} style={{ position: 'absolute', inset: 0 }}>
    <FitCamera />
    <ambientLight intensity={0.5} />
    <directionalLight position={[0, 2, 5]} intensity={0.65} color="#e6d9ff" />
    <directionalLight position={[-3, 5, 4]} intensity={1.5} color="#f6eeff" />
    <Environment resolution={props.mobile ? 64 : 128}>
      <color attach="background" args={["#b4acbf"]} />
      <Lightformer position={[-4, 5, 2]} target={[0, 0, 0]} scale={[5, 5, 1]} intensity={2} />
      <Lightformer position={[-3, 1, 4]} scale={[3, 5, 1]} intensity={2} />
      <Lightformer position={[3, 2, -4]} scale={[4, 3, 1]} intensity={2.8} color="#ded0ff" />
      <Lightformer position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[6, 6, 1]} intensity={1.5} />
    </Environment>
    <Suspense fallback={null}>
    <Ribbon {...props} />
    <ContactShadows position={[0, -0.59, 0]} opacity={0.42} scale={10} blur={1.4} far={0.85} resolution={props.mobile ? 256 : 512} color="#573199" frames={1} />
    <Lifecycle onReady={props.onReady} onLost={props.onLost} />
    </Suspense>
  </Canvas>
}
function FitCamera() {
  const { camera, size } = useThree()
  useEffect(() => {
    if ('zoom' in camera) { camera.zoom = Math.min(size.width / 6.4, size.height / 3.12); camera.updateProjectionMatrix() }
  }, [camera, size])
  return null
}
