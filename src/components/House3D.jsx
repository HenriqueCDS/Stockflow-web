import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

const COLORS = {
  wall: 0xf28a1f,
  roof: 0xd9561c,
  roofEdge: 0xe8650f,
  wallDark: 0xe07018,
  detail: 0xea7210,
  glass: 0xfb9a2a,
}

const FIT_RADIUS = 2.9

function buildHouse() {
  const house = new THREE.Group()
  // plástico ABS polido de bloco de montar: verniz brilhante por cima de uma base lisa
  const mat = (color) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 })
  const add = (geo, color, x, y, z, parent = house) => {
    const m = new THREE.Mesh(geo, mat(color))
    m.position.set(x, y, z)
    parent.add(m)
    return m
  }
  const rbox = (w, h, d, r = 0.04) => new RoundedBoxGeometry(w, h, d, 4, r)

  const W = 1.3, H = 1.5, D = 1.5, R = 1.1, O = 0.28, T = 0.16
  const y0 = 0

  // Parte de baixo de peça de Lego: borda oca + tubos que encaixam nos pinos
  const SK = 0.32, RIM = 0.12
  add(rbox(W * 2, SK, RIM, 0.03), COLORS.wall, 0, -SK / 2, D - RIM / 2)
  add(rbox(W * 2, SK, RIM, 0.03), COLORS.wall, 0, -SK / 2, -D + RIM / 2)
  add(rbox(RIM, SK, D * 2 - RIM * 2, 0.03), COLORS.wall, W - RIM / 2, -SK / 2, 0)
  add(rbox(RIM, SK, D * 2 - RIM * 2, 0.03), COLORS.wall, -W + RIM / 2, -SK / 2, 0)
  const ring = new THREE.Shape()
  ring.absarc(0, 0, 0.24, 0, Math.PI * 2, false)
  const hole = new THREE.Path()
  hole.absarc(0, 0, 0.15, 0, Math.PI * 2, true)
  ring.holes.push(hole)
  const tubeGeo = new THREE.ExtrudeGeometry(ring, { depth: SK, bevelEnabled: false, curveSegments: 32 })
  for (const tx of [-0.42, 0.42]) for (const tz of [-0.9, 0, 0.9]) {
    const tube = add(tubeGeo, COLORS.wall, tx, 0, tz)
    tube.rotation.x = Math.PI / 2 // extrusão (+z) passa a descer em -y
  }

  // Walls + gable triangle
  add(rbox(W * 2, H, D * 2, 0.03), COLORS.wall, 0, y0 + H / 2, 0)
  const tri = new THREE.Shape()
  tri.moveTo(-W, 0); tri.lineTo(W, 0); tri.lineTo(0, R); tri.lineTo(-W, 0)
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: D * 2 - 0.1, bevelEnabled: false }), mat(COLORS.wall))
  gable.position.set(0, y0 + H, -D + 0.05)
  house.add(gable)

  // Roof slabs
  const a = Math.atan(R / W)
  const L = (W + O) / Math.cos(a) + 0.08
  const roofD = D * 2 + O * 2
  const peakY = y0 + H + R
  for (const side of [-1, 1]) {
    const cx = side * (W + O) / 2
    const cy = peakY - ((W + O) * Math.tan(a)) / 2
    const slab = add(rbox(L, T, roofD, 0.05), COLORS.roof, 0, 0, 0)
    slab.rotation.z = -side * a
    slab.position.set(
      cx + side * Math.sin(a) * (T / 2) * 1,
      cy + Math.cos(a) * (T / 2),
      0,
    )
  }
  // Ridge cap
  add(rbox(0.3, 0.18, roofD + 0.02, 0.07), COLORS.roofEdge, 0, peakY + 0.06, 0)
  // Fascia frame on front gable edge (thin slabs hugging the triangle)
  for (const side of [-1, 1]) {
    const f = add(rbox(L, 0.12, 0.1, 0.03), COLORS.roofEdge, 0, 0, 0)
    f.rotation.z = -side * a
    f.position.set(
      side * (W + O) / 2 + side * Math.sin(a) * (T / 2),
      peakY - ((W + O) * Math.tan(a)) / 2 + Math.cos(a) * (T / 2) - 0.02,
      D + O,
    )
  }

  // Chimney (sits on the left slope, towards the back)
  const chX = -0.72
  const roofYAt = (x) => peakY - Math.abs(x) * Math.tan(a) + T / Math.cos(a) / 2
  const chBase = roofYAt(chX) - 0.25
  const chH = 1.15
  add(rbox(0.42, chH, 0.42, 0.03), COLORS.wall, chX, chBase + chH / 2, -0.6)
  add(rbox(0.62, 0.16, 0.62, 0.06), COLORS.roofEdge, chX, chBase + chH + 0.05, -0.6)
  // pinos (studs) de bloco de montar no topo da chaminé
  for (const sx of [-0.14, 0.14]) for (const sz of [-0.14, 0.14]) {
    add(new THREE.CylinderGeometry(0.075, 0.075, 0.07, 28), COLORS.roofEdge, chX + sx, chBase + chH + 0.165, -0.6 + sz)
  }

  // Door
  const fz = D
  add(rbox(0.8, 1.15, 0.06, 0.02), COLORS.roofEdge, 0, y0 + 0.575, fz + 0.01)
  add(rbox(0.6, 1.05, 0.08, 0.02), COLORS.detail, 0, y0 + 0.525, fz + 0.04)
  add(new THREE.SphereGeometry(0.035, 16, 16), COLORS.roofEdge, 0.2, y0 + 0.5, fz + 0.1)

  // Front windows (frame + pane + sill)
  for (const side of [-1, 1]) {
    const wx = side * 0.92
    add(rbox(0.5, 0.55, 0.05, 0.02), COLORS.wallDark, wx, y0 + 0.82, fz + 0.01)
    add(rbox(0.38, 0.43, 0.07, 0.02), COLORS.glass, wx, y0 + 0.82, fz + 0.04)
    add(rbox(0.62, 0.06, 0.16, 0.02), COLORS.glass, wx, y0 + 0.5, fz + 0.08)
  }

  // Round attic window
  const circ = add(new THREE.CylinderGeometry(0.19, 0.19, 0.08, 40), COLORS.detail, 0, y0 + H + 0.5, fz + 0.01)
  circ.rotation.x = Math.PI / 2

  // Side windows (both walls)
  for (const side of [-1, 1]) {
    const sx = side * W
    add(rbox(0.05, 0.62, 0.7, 0.02), COLORS.wallDark, sx + side * 0.01, y0 + 0.85, 0)
    add(rbox(0.07, 0.52, 0.28, 0.02), COLORS.glass, sx + side * 0.04, y0 + 0.85, -0.14)
    add(rbox(0.07, 0.52, 0.28, 0.02), COLORS.glass, sx + side * 0.04, y0 + 0.85, 0.14)
    add(rbox(0.12, 0.05, 0.8, 0.02), COLORS.glass, sx + side * 0.07, y0 + 0.55, 0)
  }

  return house
}

export default function House3D() {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    const view = renderer.domElement
    Object.assign(view.style, { cursor: 'grab', touchAction: 'none', display: 'block', width: '100%', height: '100%' })
    mount.appendChild(view)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
    camera.position.set(7.5, 5.5, 8.5)

    // reflexos de estúdio para o brilho do plástico
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTex
    scene.environmentIntensity = 0.7

    scene.add(new THREE.HemisphereLight(0xfff1e0, 0xc0501a, 0.6))
    const sun = new THREE.DirectionalLight(0xffffff, 2.2)
    sun.position.set(-5, 9, 6)
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0xffc89a, 0.6)
    fill.position.set(6, 3, 4)
    scene.add(fill)

    const house = buildHouse()
    // centraliza o modelo na origem (o centro da caixa envolvente vira o centro da cena)
    const center = new THREE.Box3().setFromObject(house).getCenter(new THREE.Vector3())
    house.position.set(-center.x, -center.y, -center.z)
    const baseY = house.position.y
    scene.add(house)

    const controls = new OrbitControls(camera, view)
    controls.target.set(0, 0, 0)
    controls.enableDamping = true
    controls.enablePan = false
    controls.maxPolarAngle = Math.PI
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    controls.autoRotate = !reduceMotion
    controls.autoRotateSpeed = 1.2
    controls.addEventListener('start', () => { controls.autoRotate = false; view.style.cursor = 'grabbing' })
    controls.addEventListener('end', () => { view.style.cursor = 'grab' })

    // Hover: leve aumento de escala
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let hovered = false
    const updatePointer = (e) => {
      const r = view.getBoundingClientRect()
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      return raycaster.intersectObject(house, true).length > 0
    }
    const onMove = (e) => { hovered = updatePointer(e) }
    const onLeave = () => { hovered = false }
    view.addEventListener('pointermove', onMove)
    view.addEventListener('pointerleave', onLeave)

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount
      if (!w || !h) return
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      // enquadra a casa no painel: distância que cabe na menor dimensão do campo de visão
      const vHalf = THREE.MathUtils.degToRad(camera.fov) / 2
      const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect)
      const dist = FIT_RADIUS / Math.sin(Math.min(vHalf, hHalf))
      const dir = camera.position.clone().sub(controls.target).normalize()
      camera.position.copy(controls.target).addScaledVector(dir, dist)
      controls.minDistance = dist * 0.5
      controls.maxDistance = dist * 1.8
    }
    const ro = new ResizeObserver(resize)
    ro.observe(mount)
    resize()

    const clock = new THREE.Clock()
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const t = clock.getElapsedTime()
      const s = THREE.MathUtils.lerp(house.scale.x, hovered ? 1.04 : 1, 0.1)
      house.scale.setScalar(s)
      house.position.y = baseY + (reduceMotion ? 0 : Math.sin(t * 1.4) * 0.06)
      controls.update()
      renderer.render(scene, camera)
    }
    // Pausa a animação quando o painel sai da tela
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { if (!raf) tick() }
      else { cancelAnimationFrame(raf); raf = 0 }
    })
    io.observe(mount)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      view.removeEventListener('pointermove', onMove)
      view.removeEventListener('pointerleave', onLeave)
      controls.dispose()
      scene.traverse((o) => {
        if (o.isMesh) { o.geometry.dispose(); o.material.dispose() }
      })
      envTex.dispose()
      pmrem.dispose()
      renderer.dispose()
      mount.removeChild(view)
    }
  }, [])

  return <div ref={mountRef} className="house3d" aria-label="Casa 3D interativa" />
}
