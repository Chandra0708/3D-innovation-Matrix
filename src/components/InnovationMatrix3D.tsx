import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  InnovationItem,
  InnovationType,
  InnovationNature,
  InnovationLocus,
  CubeState,
  MatrixFilters,
  ColorMode,
  MatrixLayoutMode,
} from '../types/innovation';
import {
  INNOVATION_TYPES,
  INNOVATION_NATURES,
  INNOVATION_LOCI,
  NATURE_COLORS,
  TYPE_COLORS,
} from '../constants/innovationTaxonomy';
import {
  getCubeKey,
  getCoordinatesFromIndices,
  getCubeColor,
  createTextSprite,
} from '../utils/threeUtils';
import { ZoomOut } from 'lucide-react';

export type CameraPreset = 'isometric' | 'front' | 'side' | 'top';

interface InnovationMatrix3DProps {
  innovations: InnovationItem[];
  filters: MatrixFilters;
  colorMode: ColorMode;
  layoutMode?: MatrixLayoutMode;
  explodeFactor: number;
  autoRotate: boolean;
  selectedCubeKey: string | null;
  recentlyGrownKey: string | null;
  cameraPreset?: CameraPreset;
  onSelectCube: (cube: CubeState | null) => void;
  onHoverCube: (cube: CubeState | null, screenPos?: { x: number; y: number }) => void;
}

interface CubeMeshRef {
  mesh: THREE.Mesh;
  edges: THREE.LineSegments;
  pulseRing?: THREE.Mesh;
  key: string;
  typeIndex: number;
  natureIndex: number;
  locusIndex: number;
  homePosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  currentScale: number;
  targetScale: number;
  pulseScale: number;
  isPulsing: boolean;
}

export const InnovationMatrix3D: React.FC<InnovationMatrix3DProps> = ({
  innovations,
  filters,
  colorMode,
  layoutMode = 'reference_3d',
  explodeFactor,
  autoRotate,
  selectedCubeKey,
  recentlyGrownKey,
  cameraPreset = 'isometric',
  onSelectCube,
  onHoverCube,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cubeRefs = useRef<Map<string, CubeMeshRef>>(new Map());
  const axisGroupRef = useRef<THREE.Group | null>(null);
  const focusedAxesGroupRef = useRef<THREE.Group | null>(null);
  const gyroRingsRef = useRef<THREE.Mesh[]>([]);
  const hoveredKeyRef = useRef<string | null>(null);

  // Filters ref for raycasting handlers
  const filtersRef = useRef<MatrixFilters>(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Camera animation lerp targets
  const targetCameraPosRef = useRef<THREE.Vector3 | null>(null);
  const targetControlsTargetRef = useRef<THREE.Vector3 | null>(null);
  const wasFocusedOnCubeRef = useRef<boolean>(false);

  // Group innovations by cube key
  const cubeStateMapRef = useRef<Map<string, CubeState>>(new Map());

  // Active focused cube state for on-screen HUD
  const [focusedActiveCube, setFocusedActiveCube] = useState<CubeState | null>(null);

  // Build the 108 cube states map (all uniform scale 1.0)
  const buildCubeStates = useCallback(() => {
    const map = new Map<string, CubeState>();
    for (let t = 0; t < INNOVATION_TYPES.length; t++) {
      for (let n = 0; n < INNOVATION_NATURES.length; n++) {
        for (let l = 0; l < INNOVATION_LOCI.length; l++) {
          const key = getCubeKey(t, n, l);
          map.set(key, {
            coordinate: { typeIndex: t, natureIndex: n, locusIndex: l },
            cubeKey: key,
            type: INNOVATION_TYPES[t],
            nature: INNOVATION_NATURES[n],
            locus: INNOVATION_LOCI[l],
            innovations: [],
            currentScale: 1.0,
            targetScale: 1.0,
          });
        }
      }
    }

    // Populate with innovations
    innovations.forEach((item) => {
      const t = INNOVATION_TYPES.indexOf(item.type);
      const n = INNOVATION_NATURES.indexOf(item.nature);
      const l = INNOVATION_LOCI.indexOf(item.locus);
      if (t !== -1 && n !== -1 && l !== -1) {
        const key = getCubeKey(t, n, l);
        const state = map.get(key);
        if (state) {
          state.innovations.push(item);
        }
      }
    });

    cubeStateMapRef.current = map;
  }, [innovations]);

  useEffect(() => {
    buildCubeStates();
  }, [buildCubeStates]);

  // Compact camera position for presets
  const getPresetCameraPosition = useCallback((preset: CameraPreset) => {
    switch (preset) {
      case 'front':
        return new THREE.Vector3(0, 0, 18);
      case 'side':
        return new THREE.Vector3(18, 0, 0);
      case 'top':
        return new THREE.Vector3(0.01, 20, 0.01);
      case 'isometric':
      default:
        return new THREE.Vector3(14, 11, 15);
    }
  }, []);

  // Return only highlighted/active meshes that can be clicked
  const getInteractiveMeshes = useCallback(() => {
    const active: THREE.Mesh[] = [];
    cubeRefs.current.forEach((ref) => {
      const state = cubeStateMapRef.current.get(ref.key);
      // Non-highlighted (empty) cubes are not clickable!
      if (!state || state.innovations.length === 0) return;

      // Check active filters
      const matchesType = filtersRef.current.activeType === 'all' || filtersRef.current.activeType === state.type;
      const matchesNature = filtersRef.current.activeNature === 'all' || filtersRef.current.activeNature === state.nature;
      const matchesLocus = filtersRef.current.activeLocus === 'all' || filtersRef.current.activeLocus === state.locus;
      if (!matchesType || !matchesNature || !matchesLocus) return;

      // Check search query
      if (filtersRef.current.searchQuery.trim()) {
        const q = filtersRef.current.searchQuery.toLowerCase();
        const matchesSearch = state.innovations.some(
          (inv) =>
            inv.companyName.toLowerCase().includes(q) ||
            inv.innovationName.toLowerCase().includes(q) ||
            (inv.description && inv.description.toLowerCase().includes(q))
        );
        if (!matchesSearch) return;
      }

      active.push(ref.mesh);
    });
    return active;
  }, []);

  // Initialize Three.js scene once
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, 0.012);
    sceneRef.current = scene;

    // Focused cube axes group (isolated out of graph)
    const focusedGroup = new THREE.Group();
    focusedAxesGroupRef.current = focusedGroup;
    scene.add(focusedGroup);

    // Camera (compact framing)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(14, 11, 15);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 55;
    controls.minDistance = 2.5;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting (Studio Three-Point Setup)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff6ec, 2.2);
    keyLight.position.set(20, 30, 20);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.3);
    fillLight.position.set(-20, 10, -20);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa78bfa, 1.5);
    rimLight.position.set(-20, 20, 20);
    scene.add(rimLight);

    // Subtle Ground Grid (comfortably lowered so all bottom axes and titles sit clearly above it)
    const gridHelper = new THREE.GridHelper(28, 28, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -6.6;
    scene.add(gridHelper);

    // Build 108 Cube Meshes (compact 1.0 unit size)
    const cubeMap = new Map<string, CubeMeshRef>();
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const ringGeo = new THREE.RingGeometry(0.65, 0.9, 32);

    for (let t = 0; t < INNOVATION_TYPES.length; t++) {
      for (let n = 0; n < INNOVATION_NATURES.length; n++) {
        for (let l = 0; l < INNOVATION_LOCI.length; l++) {
          const key = getCubeKey(t, n, l);

          // Cube Material
          const mat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            emissive: 0x000000,
            emissiveIntensity: 0.0,
            roughness: 0.25,
            metalness: 0.15,
            transparent: true,
            opacity: 0.04,
          });

          const mesh = new THREE.Mesh(boxGeo, mat);
          mesh.userData = { cubeKey: key, typeIndex: t, natureIndex: n, locusIndex: l };

          // Edge lines (all 108 cube outlines visible from the start)
          const lineMat = new THREE.LineBasicMaterial({
            color: 0x475569,
            transparent: true,
            opacity: 0.65,
          });
          const edges = new THREE.LineSegments(edgesGeo, lineMat);
          mesh.add(edges);

          // Pulse Ring (for vibrant glow pulse animation when innovation is added/edited)
          const ringMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0,
          });
          const pulseRing = new THREE.Mesh(ringGeo, ringMat);
          pulseRing.rotation.x = Math.PI / 2;
          pulseRing.position.y = -0.48;
          mesh.add(pulseRing);

          scene.add(mesh);

          cubeMap.set(key, {
            mesh,
            edges,
            pulseRing,
            key,
            typeIndex: t,
            natureIndex: n,
            locusIndex: l,
            homePosition: new THREE.Vector3(0, 0, 0),
            targetPosition: new THREE.Vector3(0, 0, 0),
            currentScale: 1.0,
            targetScale: 1.0,
            pulseScale: 1,
            isPulsing: false,
          });
        }
      }
    }
    cubeRefs.current = cubeMap;

    // Raycasting for Hover & Click (restricted strictly to highlighted/active cubes)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      // ONLY test highlighted/active cubes! Non-highlighted (empty) cubes are not hoverable/clickable
      const interactiveMeshes = getInteractiveMeshes();
      const intersects = raycaster.intersectObjects(interactiveMeshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const key = hit.userData.cubeKey as string;
        const cubeState = cubeStateMapRef.current.get(key) || null;
        if (cubeState && cubeState.innovations.length > 0) {
          if (hoveredKeyRef.current !== key) {
            hoveredKeyRef.current = key;
            renderer.domElement.style.cursor = 'pointer';
            if (!wasFocusedOnCubeRef.current) {
              onHoverCube(cubeState, { x: event.clientX, y: event.clientY });
            }
          }
          return;
        }
      }

      if (hoveredKeyRef.current !== null) {
        hoveredKeyRef.current = null;
        renderer.domElement.style.cursor = 'default';
        onHoverCube(null);
      }
    };

    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      // ONLY test highlighted/active cubes! Non-highlighted cubes are NOT clickable
      const interactiveMeshes = getInteractiveMeshes();
      const intersects = raycaster.intersectObjects(interactiveMeshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const key = hit.userData.cubeKey as string;
        const cubeState = cubeStateMapRef.current.get(key) || null;
        if (cubeState && cubeState.innovations.length > 0) {
          onSelectCube(cubeState);
          return;
        }
      }

      // Clicking outside any active cube or on a non-highlighted cube returns to overview
      onSelectCube(null);
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousemove', handlePointerMove);
    domElement.addEventListener('click', handleClick);

    // Keyboard ESC to return to overview
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSelectCube(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera interpolation
      if (targetCameraPosRef.current && targetControlsTargetRef.current && cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(targetCameraPosRef.current, 0.08);
        controlsRef.current.target.lerp(targetControlsTargetRef.current, 0.08);
        controlsRef.current.update();

        if (
          cameraRef.current.position.distanceTo(targetCameraPosRef.current) < 0.04 &&
          controlsRef.current.target.distanceTo(targetControlsTargetRef.current) < 0.04
        ) {
          targetCameraPosRef.current = null;
          targetControlsTargetRef.current = null;
        }
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = autoRotate;
        controlsRef.current.autoRotateSpeed = 0.8;
        controlsRef.current.update();
      }

      // Smoothly animate cube position (pop out of graph when active, or return to home)
      cubeRefs.current.forEach((ref) => {
        ref.mesh.position.lerp(ref.targetPosition, 0.12);
        ref.currentScale += (ref.targetScale - ref.currentScale) * 0.15;
        ref.mesh.scale.set(ref.currentScale, ref.currentScale, ref.currentScale);

        // Pulse ring animation
        if (ref.isPulsing && ref.pulseRing) {
          ref.pulseScale += 0.05;
          const ringMat = ref.pulseRing.material as THREE.MeshBasicMaterial;
          ringMat.opacity = Math.max(0, 1 - (ref.pulseScale - 1) * 0.8);
          ref.pulseRing.scale.set(ref.pulseScale, ref.pulseScale, 1);

          if (ref.pulseScale > 2.2) {
            ref.isPulsing = false;
            ringMat.opacity = 0;
            ref.pulseScale = 1;
          }
        }
      });

      // Rotate gyroscopic orbital rings around extracted active cube
      if (gyroRingsRef.current.length >= 2) {
        gyroRingsRef.current[0].rotation.y += 0.024;
        gyroRingsRef.current[0].rotation.z += 0.012;
        gyroRingsRef.current[1].rotation.x += 0.02;
        gyroRingsRef.current[1].rotation.z -= 0.015;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      domElement.removeEventListener('mousemove', handlePointerMove);
      domElement.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
    };
  }, [getInteractiveMeshes]);

  // Update Camera position when CameraPreset changes (if not zoomed into a cube)
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    if (selectedCubeKey) return; // Don't override if actively inspecting an extracted cube

    const defaultPos = getPresetCameraPosition(cameraPreset);
    targetCameraPosRef.current = defaultPos;
    targetControlsTargetRef.current = new THREE.Vector3(0, 0, 0);
  }, [cameraPreset, selectedCubeKey, getPresetCameraPosition]);

  // Update Cube Positions & Compact Spacing & Rebuild 3 Axes
  useEffect(() => {
    // Compact spacing: cubes sit tightly and neatly with minimal gap for a solid, compact matrix
    const currentSpacing = 1.04;

    cubeRefs.current.forEach((ref) => {
      const pos = getCoordinatesFromIndices(
        ref.typeIndex,
        ref.natureIndex,
        ref.locusIndex,
        currentSpacing,
        layoutMode
      );
      ref.homePosition.copy(pos);
      // Only set target to home if this cube is NOT extracted/selected
      if (selectedCubeKey !== ref.key) {
        ref.targetPosition.copy(pos);
      }
    });

    // Build Clear, Professional 3D Global Matrix Axes
    if (sceneRef.current) {
      if (axisGroupRef.current) {
        sceneRef.current.remove(axisGroupRef.current);
      }

      const axisGroup = new THREE.Group();
      const ROTATION_90 = (270 * Math.PI) / 180; // 90° clockwise rotation in Three.js Sprite space

      const axisLineMat = new THREE.LineBasicMaterial({
        color: 0x64748b,
        transparent: true,
        opacity: 0.85,
      });

      const arrowConeGeo = new THREE.ConeGeometry(0.18, 0.45, 16);

      if (layoutMode === 'reference_3d') {
        const xMin = -1.5 * currentSpacing;
        const xMax = 1.5 * currentSpacing;
        const yMin = -4 * currentSpacing;
        const yMax = 4 * currentSpacing;
        const zMin = -1 * currentSpacing;
        const zMax = 1 * currentSpacing;

        // 1. VERTICAL AXIS (Y): Type of Innovation (9 Categories)
        const vRailX = xMin - 1.15;
        const vRailZ = zMin - 0.25;

        const vRailGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(vRailX, yMin - 0.4, vRailZ),
          new THREE.Vector3(vRailX, yMax + 0.6, vRailZ),
        ]);
        axisGroup.add(new THREE.Line(vRailGeo, axisLineMat));

        const vArrow = new THREE.Mesh(arrowConeGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        vArrow.position.set(vRailX, yMax + 0.8, vRailZ);
        axisGroup.add(vArrow);

        // 9 Category labels along Y
        for (let t = 0; t < INNOVATION_TYPES.length; t++) {
          const y = (t - 4) * currentSpacing;
          const typeName = INNOVATION_TYPES[t];
          const color = TYPE_COLORS[typeName]?.hex || '#38bdf8';

          const labelSprite = createTextSprite(typeName, {
            lines: [typeName],
            fontSize: 40,
            textColor: '#f8fafc',
            bgColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: color,
            accentDotColor: color,
            width: 480,
            height: 90,
            scaleX: 2.4,
            scaleY: 0.45,
          });
          labelSprite.position.set(vRailX - 1.4, y, vRailZ);
          axisGroup.add(labelSprite);

          const tickGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(vRailX - 0.15, y, vRailZ),
            new THREE.Vector3(xMin - 0.2, y, vRailZ),
          ]);
          axisGroup.add(new THREE.Line(tickGeo, axisLineMat));
        }

        // Title in the MIDDLE of the vertical axis (y = 0)
        const vTitleSprite = createTextSprite('Type of Innovation', {
          lines: ['Type of Innovation'],
          fontSize: 44,
          fontWeight: '800',
          textColor: '#38bdf8',
          bgColor: 'rgba(15, 23, 42, 0.98)',
          borderColor: '#38bdf8',
          accentDotColor: '#38bdf8',
          width: 540,
          height: 105,
          scaleX: 2.9,
          scaleY: 0.56,
        });
        vTitleSprite.position.set(vRailX - 3.4, 0, vRailZ);
        axisGroup.add(vTitleSprite);

        // 2. HORIZONTAL FRONT AXIS (X): Focus of Innovation (4 Loci) - Rotated by 90 degrees
        const hRailY = yMin - 0.85;
        const hRailZ = zMax + 1.1;

        const hRailGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(xMin - 0.5, hRailY, hRailZ),
          new THREE.Vector3(xMax + 0.6, hRailY, hRailZ),
        ]);
        axisGroup.add(new THREE.Line(hRailGeo, axisLineMat));

        const hArrow = new THREE.Mesh(arrowConeGeo, new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
        hArrow.rotation.z = -Math.PI / 2;
        hArrow.position.set(xMax + 0.8, hRailY, hRailZ);
        axisGroup.add(hArrow);

        // 4 Category labels along X - rotated 90 degrees
        for (let l = 0; l < INNOVATION_LOCI.length; l++) {
          const x = (l - 1.5) * currentSpacing;
          const locusName = INNOVATION_LOCI[l];

          const locusSprite = createTextSprite(locusName, {
            lines: [locusName],
            fontSize: 40,
            textColor: '#fef08a',
            bgColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(245, 158, 11, 0.7)',
            accentDotColor: '#f59e0b',
            width: 420,
            height: 90,
            scaleX: 2.1,
            scaleY: 0.45,
            rotation: ROTATION_90,
          });
          locusSprite.position.set(x, hRailY - 1.25, hRailZ);
          axisGroup.add(locusSprite);

          const tickGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x, hRailY, hRailZ),
            new THREE.Vector3(x, yMin - 0.15, zMax + 0.2),
          ]);
          axisGroup.add(new THREE.Line(tickGeo, axisLineMat));
        }

        // Title in the MIDDLE of the horizontal axis (x = 0) - rotated 90 degrees
        const focusTitleSprite = createTextSprite('Focus of Innovation', {
          lines: ['Focus of Innovation'],
          fontSize: 44,
          fontWeight: '800',
          textColor: '#fbbf24',
          bgColor: 'rgba(15, 23, 42, 0.98)',
          borderColor: '#f59e0b',
          accentDotColor: '#f59e0b',
          width: 560,
          height: 105,
          scaleX: 3.0,
          scaleY: 0.56,
          rotation: ROTATION_90,
        });
        focusTitleSprite.position.set(0, hRailY - 1.75, hRailZ + 0.65);
        axisGroup.add(focusTitleSprite);

        // 3. DEPTH RIGHT AXIS (Z): Nature of Innovation (3 Natures) - Rotated by 90 degrees
        const dRailY = yMin - 0.85;
        const dRailX = xMax + 1.1;

        const dRailGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(dRailX, dRailY, zMin - 0.5),
          new THREE.Vector3(dRailX, dRailY, zMax + 0.6),
        ]);
        axisGroup.add(new THREE.Line(dRailGeo, axisLineMat));

        const dArrow = new THREE.Mesh(arrowConeGeo, new THREE.MeshBasicMaterial({ color: 0x34d399 }));
        dArrow.rotation.x = Math.PI / 2;
        dArrow.position.set(dRailX, dRailY, zMax + 0.8);
        axisGroup.add(dArrow);

        // 3 Category labels along Z - rotated 90 degrees
        for (let n = 0; n < INNOVATION_NATURES.length; n++) {
          const z = (n - 1) * currentSpacing;
          const natureName = INNOVATION_NATURES[n];
          const color = NATURE_COLORS[natureName]?.hex || '#34d399';

          const natureSprite = createTextSprite(natureName, {
            lines: [natureName],
            fontSize: 40,
            textColor: color,
            bgColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: color,
            accentDotColor: color,
            width: 440,
            height: 90,
            scaleX: 2.2,
            scaleY: 0.45,
            rotation: ROTATION_90,
          });
          natureSprite.position.set(dRailX + 1.25, dRailY - 1.25, z);
          axisGroup.add(natureSprite);

          const tickGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(dRailX, dRailY, z),
            new THREE.Vector3(xMax + 0.2, yMin - 0.15, z),
          ]);
          axisGroup.add(new THREE.Line(tickGeo, axisLineMat));
        }

        // Title in the MIDDLE of the depth axis (z = 0) - rotated 90 degrees
        const natureTitleSprite = createTextSprite('Nature of Innovation', {
          lines: ['Nature of Innovation'],
          fontSize: 44,
          fontWeight: '800',
          textColor: '#34d399',
          bgColor: 'rgba(15, 23, 42, 0.98)',
          borderColor: '#34d399',
          accentDotColor: '#34d399',
          width: 560,
          height: 105,
          scaleX: 3.0,
          scaleY: 0.56,
          rotation: ROTATION_90,
        });
        natureTitleSprite.position.set(dRailX + 2.7, dRailY - 1.0, 0);
        axisGroup.add(natureTitleSprite);
      } else {
        // Horizontal Types 3D layout mode
        const xMin = -4 * currentSpacing;
        const xMax = 4 * currentSpacing;
        const yMin = -1 * currentSpacing;
        const yMax = 1 * currentSpacing;
        const zMin = -1.5 * currentSpacing;
        const zMax = 1.5 * currentSpacing;

        // Y: Nature
        const vRailX = xMin - 1.15;
        const vRailZ = zMin - 0.25;

        const vRailGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(vRailX, yMin - 0.4, vRailZ),
          new THREE.Vector3(vRailX, yMax + 0.6, vRailZ),
        ]);
        axisGroup.add(new THREE.Line(vRailGeo, axisLineMat));

        const vArrow = new THREE.Mesh(arrowConeGeo, new THREE.MeshBasicMaterial({ color: 0x34d399 }));
        vArrow.position.set(vRailX, yMax + 0.8, vRailZ);
        axisGroup.add(vArrow);

        for (let n = 0; n < INNOVATION_NATURES.length; n++) {
          const y = (n - 1) * currentSpacing;
          const natureName = INNOVATION_NATURES[n];
          const color = NATURE_COLORS[natureName]?.hex || '#34d399';

          const labelSprite = createTextSprite(natureName, {
            lines: [natureName],
            fontSize: 40,
            textColor: color,
            bgColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: color,
            accentDotColor: color,
            width: 440,
            height: 90,
            scaleX: 2.2,
            scaleY: 0.45,
          });
          labelSprite.position.set(vRailX - 1.4, y, vRailZ);
          axisGroup.add(labelSprite);
        }

        const vTitleSprite = createTextSprite('Nature of Innovation', {
          lines: ['Nature of Innovation'],
          fontSize: 44,
          fontWeight: '800',
          textColor: '#34d399',
          bgColor: 'rgba(15, 23, 42, 0.98)',
          borderColor: '#34d399',
          accentDotColor: '#34d399',
          width: 560,
          height: 105,
          scaleX: 3.0,
          scaleY: 0.56,
        });
        vTitleSprite.position.set(vRailX - 3.4, 0, vRailZ);
        axisGroup.add(vTitleSprite);

        // X: Type
        const hRailY = yMin - 0.85;
        const hRailZ = zMax + 1.1;

        const hRailGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(xMin - 0.5, hRailY, hRailZ),
          new THREE.Vector3(xMax + 0.6, hRailY, hRailZ),
        ]);
        axisGroup.add(new THREE.Line(hRailGeo, axisLineMat));

        const hArrow = new THREE.Mesh(arrowConeGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        hArrow.rotation.z = -Math.PI / 2;
        hArrow.position.set(xMax + 0.8, hRailY, hRailZ);
        axisGroup.add(hArrow);

        for (let t = 0; t < INNOVATION_TYPES.length; t++) {
          const x = (t - 4) * currentSpacing;
          const typeName = INNOVATION_TYPES[t];
          const color = TYPE_COLORS[typeName]?.hex || '#38bdf8';

          const typeSprite = createTextSprite(typeName, {
            lines: [typeName],
            fontSize: 38,
            textColor: '#f8fafc',
            bgColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: color,
            accentDotColor: color,
            width: 440,
            height: 90,
            scaleX: 2.2,
            scaleY: 0.45,
          });
          typeSprite.position.set(x, hRailY - 0.75, hRailZ);
          axisGroup.add(typeSprite);
        }

        const typeTitleSprite = createTextSprite('Type of Innovation', {
          lines: ['Type of Innovation'],
          fontSize: 44,
          fontWeight: '800',
          textColor: '#38bdf8',
          bgColor: 'rgba(15, 23, 42, 0.98)',
          borderColor: '#38bdf8',
          accentDotColor: '#38bdf8',
          width: 560,
          height: 105,
          scaleX: 3.0,
          scaleY: 0.56,
        });
        typeTitleSprite.position.set(0, hRailY - 1.35, hRailZ + 0.3);
        axisGroup.add(typeTitleSprite);

        // Z: Focus
        const dRailY = yMin - 0.85;
        const dRailX = xMax + 1.1;

        const dRailGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(dRailX, dRailY, zMin - 0.5),
          new THREE.Vector3(dRailX, dRailY, zMax + 0.6),
        ]);
        axisGroup.add(new THREE.Line(dRailGeo, axisLineMat));

        const dArrow = new THREE.Mesh(arrowConeGeo, new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
        dArrow.rotation.x = Math.PI / 2;
        dArrow.position.set(dRailX, dRailY, zMax + 0.8);
        axisGroup.add(dArrow);

        for (let l = 0; l < INNOVATION_LOCI.length; l++) {
          const z = (l - 1.5) * currentSpacing;
          const locusName = INNOVATION_LOCI[l];

          const locusSprite = createTextSprite(locusName, {
            lines: [locusName],
            fontSize: 40,
            textColor: '#fef08a',
            bgColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(245, 158, 11, 0.7)',
            accentDotColor: '#f59e0b',
            width: 420,
            height: 90,
            scaleX: 2.1,
            scaleY: 0.45,
            rotation: ROTATION_90,
          });
          locusSprite.position.set(dRailX + 1.25, dRailY - 1.25, z);
          axisGroup.add(locusSprite);
        }

        const locusTitleSprite = createTextSprite('Focus of Innovation', {
          lines: ['Focus of Innovation'],
          fontSize: 44,
          fontWeight: '800',
          textColor: '#fbbf24',
          bgColor: 'rgba(15, 23, 42, 0.98)',
          borderColor: '#f59e0b',
          accentDotColor: '#f59e0b',
          width: 560,
          height: 105,
          scaleX: 3.0,
          scaleY: 0.56,
          rotation: ROTATION_90,
        });
        locusTitleSprite.position.set(dRailX + 2.7, dRailY - 1.0, 0);
        axisGroup.add(locusTitleSprite);
      }

      sceneRef.current.add(axisGroup);
      axisGroupRef.current = axisGroup;
    }
  }, [explodeFactor, layoutMode, selectedCubeKey]);

  // Extract Selected Cube Out of Graph and Display Its 3 Axes in a Separate Showcase Way
  useEffect(() => {
    const focusedGroup = focusedAxesGroupRef.current;
    if (!focusedGroup || !sceneRef.current) return;

    // Clear previous focused elements
    while (focusedGroup.children.length > 0) {
      focusedGroup.remove(focusedGroup.children[0]);
    }
    gyroRingsRef.current = [];

    // Reset all cubes to their home positions unless selected
    cubeRefs.current.forEach((ref) => {
      if (ref.key !== selectedCubeKey) {
        ref.targetPosition.copy(ref.homePosition);
      }
    });

    if (!selectedCubeKey) {
      setFocusedActiveCube(null);
      if (wasFocusedOnCubeRef.current) {
        // Return camera smoothly to compact overview
        const defaultPos = getPresetCameraPosition(cameraPreset);
        targetCameraPosRef.current = defaultPos;
        targetControlsTargetRef.current = new THREE.Vector3(0, 0, 0);
        wasFocusedOnCubeRef.current = false;
      }
      return;
    }

    const state = cubeStateMapRef.current.get(selectedCubeKey);
    const selectedRef = cubeRefs.current.get(selectedCubeKey);

    if (!state || !selectedRef) {
      setFocusedActiveCube(null);
      return;
    }

    // Only active cubes (with logged innovations) can be selected and extracted
    const isActiveCube = state.innovations.length > 0;
    setFocusedActiveCube(isActiveCube ? state : null);

    if (isActiveCube) {
      const currentSpacing = 1.04;
      const xMax = 1.5 * currentSpacing;
      const zMax = 1.0 * currentSpacing;

      // Calculate a designated exhibition position COMPLETELY OUT OF THE GRAPH in clear open space
      const homePos = selectedRef.homePosition;
      const extractedPos = new THREE.Vector3(
        xMax + 5.5,
        0.8,
        zMax + 4.8
      );

      // Glide selected cube smoothly to the separate showcase position outside the graph
      selectedRef.targetPosition.copy(extractedPos);

      const ex = extractedPos.x;
      const ey = extractedPos.y;
      const ez = extractedPos.z;

      const axisLength = 3.2;
      const cylinderRadius = 0.045;
      const arrowConeGeo = new THREE.ConeGeometry(0.18, 0.45, 16);

      // Target optical center of the showcase assembly (cube + 3 visible axes)
      const showcaseCenter = new THREE.Vector3(ex + 0.9, ey + 0.8, ez + 0.9);
      targetControlsTargetRef.current = showcaseCenter;

      // Reduced zoom: camera positioned at a comfortable, spacious distance (~14.2 units)
      // provides an expansive, balanced, professional framing where the cube, all 3 axes,
      // mid-shaft axis badges, orbital rings, and origin tether are fully and clearly visible.
      targetCameraPosRef.current = showcaseCenter.clone().add(new THREE.Vector3(8.5, 6.2, 9.8));
      wasFocusedOnCubeRef.current = true;

      // -----------------------------------------------------------------------
      // 1. MATRIX ORIGIN SOCKET & GUIDING LASER TETHER (Marks where it came from)
      // -----------------------------------------------------------------------
      const socketGeo = new THREE.BoxGeometry(1.05, 1.05, 1.05);
      const socketEdges = new THREE.EdgesGeometry(socketGeo);
      const socketMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.85,
      });
      const socketMesh = new THREE.LineSegments(socketEdges, socketMat);
      socketMesh.position.copy(homePos);
      focusedGroup.add(socketMesh);

      // Dashed laser tether connecting matrix slot to extracted cube
      const tetherGeo = new THREE.BufferGeometry().setFromPoints([homePos, extractedPos]);
      const tetherMat = new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        dashSize: 0.35,
        gapSize: 0.2,
        transparent: true,
        opacity: 0.75,
      });
      const tetherLine = new THREE.Line(tetherGeo, tetherMat);
      tetherLine.computeLineDistances();
      focusedGroup.add(tetherLine);

      // Dedicated Exhibition Floor Pedestal / Circular Base underneath the extracted cube
      const pedestalGeo = new THREE.CylinderGeometry(2.0, 2.2, 0.08, 36);
      const pedestalMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 0.85,
      });
      const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestalMesh.position.set(extractedPos.x, -5.7, extractedPos.z);
      focusedGroup.add(pedestalMesh);

      const pedestalRingGeo = new THREE.RingGeometry(1.8, 2.05, 36);
      const pedestalRingMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const pedestalRing = new THREE.Mesh(pedestalRingGeo, pedestalRingMat);
      pedestalRing.rotation.x = Math.PI / 2;
      pedestalRing.position.set(extractedPos.x, -5.65, extractedPos.z);
      focusedGroup.add(pedestalRing);

      // -----------------------------------------------------------------------
      // 2. THE 3 DEDICATED ORTHOGONAL AXES OF THIS CUBE (Titles in the MIDDLE)
      // -----------------------------------------------------------------------
      const isRef3D = layoutMode === 'reference_3d';
      const xAxisTitle = isRef3D ? 'Focus of Innovation' : 'Type of Innovation';
      const xAxisVal = isRef3D ? state.locus : state.type;
      const xAxisColor = isRef3D ? 0xf59e0b : 0x38bdf8;
      const xAxisHex = isRef3D ? '#f59e0b' : '#38bdf8';

      const yAxisTitle = isRef3D ? 'Type of Innovation' : 'Nature of Innovation';
      const yAxisVal = isRef3D ? state.type : state.nature;
      const yAxisColor = isRef3D ? 0x38bdf8 : 0x34d399;
      const yAxisHex = isRef3D ? '#38bdf8' : '#34d399';

      const zAxisTitle = isRef3D ? 'Nature of Innovation' : 'Focus of Innovation';
      const zAxisVal = isRef3D ? state.nature : state.locus;
      const zAxisColor = isRef3D ? 0x34d399 : 0xf59e0b;
      const zAxisHex = isRef3D ? '#34d399' : '#f59e0b';

      // --- AXIS 1: [X-AXIS] ---
      const xShaftGeo = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, axisLength, 16);
      const xShaftMat = new THREE.MeshStandardMaterial({
        color: xAxisColor,
        emissive: xAxisColor,
        emissiveIntensity: 0.7,
        roughness: 0.25,
      });
      const xShaft = new THREE.Mesh(xShaftGeo, xShaftMat);
      xShaft.rotation.z = -Math.PI / 2;
      xShaft.position.set(ex + 0.5 + axisLength / 2, ey, ez);
      focusedGroup.add(xShaft);

      const xArrow = new THREE.Mesh(arrowConeGeo, new THREE.MeshBasicMaterial({ color: xAxisColor }));
      xArrow.rotation.z = -Math.PI / 2;
      xArrow.position.set(ex + 0.5 + axisLength + 0.22, ey, ez);
      focusedGroup.add(xArrow);

      // Title in the MIDDLE of the shaft
      const xSprite = createTextSprite(xAxisTitle, {
        lines: [xAxisTitle, `${xAxisVal}`],
        fontSize: 38,
        fontWeight: '800',
        textColor: '#ffffff',
        subTextColor: xAxisHex,
        bgColor: 'rgba(15, 23, 42, 0.98)',
        borderColor: xAxisHex,
        accentDotColor: xAxisHex,
        width: 520,
        height: 110,
        scaleX: 2.7,
        scaleY: 0.58,
      });
      xSprite.position.set(ex + 0.5 + axisLength / 2, ey + 0.8, ez + 0.2);
      focusedGroup.add(xSprite);

      // --- AXIS 2: [Y-AXIS (VERTICAL)] ---
      const yShaftGeo = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, axisLength, 16);
      const yShaftMat = new THREE.MeshStandardMaterial({
        color: yAxisColor,
        emissive: yAxisColor,
        emissiveIntensity: 0.7,
        roughness: 0.25,
      });
      const yShaft = new THREE.Mesh(yShaftGeo, yShaftMat);
      yShaft.position.set(ex, ey + 0.5 + axisLength / 2, ez);
      focusedGroup.add(yShaft);

      const yArrow = new THREE.Mesh(arrowConeGeo, new THREE.MeshBasicMaterial({ color: yAxisColor }));
      yArrow.position.set(ex, ey + 0.5 + axisLength + 0.22, ez);
      focusedGroup.add(yArrow);

      // Title in the MIDDLE of the shaft
      const ySprite = createTextSprite(yAxisTitle, {
        lines: [yAxisTitle, `${yAxisVal}`],
        fontSize: 38,
        fontWeight: '800',
        textColor: '#ffffff',
        subTextColor: yAxisHex,
        bgColor: 'rgba(15, 23, 42, 0.98)',
        borderColor: yAxisHex,
        accentDotColor: yAxisHex,
        width: 520,
        height: 110,
        scaleX: 2.7,
        scaleY: 0.58,
      });
      ySprite.position.set(ex - 0.9, ey + 0.5 + axisLength / 2, ez + 0.2);
      focusedGroup.add(ySprite);

      // --- AXIS 3: [Z-AXIS (DEPTH)] ---
      const zShaftGeo = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, axisLength, 16);
      const zShaftMat = new THREE.MeshStandardMaterial({
        color: zAxisColor,
        emissive: zAxisColor,
        emissiveIntensity: 0.7,
        roughness: 0.25,
      });
      const zShaft = new THREE.Mesh(zShaftGeo, zShaftMat);
      zShaft.rotation.x = Math.PI / 2;
      zShaft.position.set(ex, ey, ez + 0.5 + axisLength / 2);
      focusedGroup.add(zShaft);

      const zArrow = new THREE.Mesh(arrowConeGeo, new THREE.MeshBasicMaterial({ color: zAxisColor }));
      zArrow.rotation.x = Math.PI / 2;
      zArrow.position.set(ex, ey, ez + 0.5 + axisLength + 0.22);
      focusedGroup.add(zArrow);

      // Title in the MIDDLE of the shaft
      const zSprite = createTextSprite(zAxisTitle, {
        lines: [zAxisTitle, `${zAxisVal}`],
        fontSize: 38,
        fontWeight: '800',
        textColor: '#ffffff',
        subTextColor: zAxisHex,
        bgColor: 'rgba(15, 23, 42, 0.98)',
        borderColor: zAxisHex,
        accentDotColor: zAxisHex,
        width: 520,
        height: 110,
        scaleX: 2.7,
        scaleY: 0.58,
      });
      zSprite.position.set(ex + 0.35, ey + 0.8, ez + 0.5 + axisLength / 2);
      focusedGroup.add(zSprite);

      // Guide dashed projection lines from cube to axes endpoints
      const guidePointsX = [new THREE.Vector3(ex + 0.5, ey + 0.5, ez), new THREE.Vector3(ex + 0.5 + axisLength, ey + 0.5, ez)];
      const guideGeoX = new THREE.BufferGeometry().setFromPoints(guidePointsX);
      const guideLineX = new THREE.Line(guideGeoX, new THREE.LineDashedMaterial({ color: xAxisColor, dashSize: 0.2, gapSize: 0.15, opacity: 0.45, transparent: true }));
      guideLineX.computeLineDistances();
      focusedGroup.add(guideLineX);

      // -----------------------------------------------------------------------
      // 3. SCI-FI ORBITAL RINGS AROUND EXTRACTED CUBE
      // -----------------------------------------------------------------------
      const ring1Geo = new THREE.TorusGeometry(0.95, 0.018, 16, 48);
      const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
      const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      ring1.position.copy(extractedPos);

      const ring2Geo = new THREE.TorusGeometry(1.05, 0.018, 16, 48);
      const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.85 });
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2.position.copy(extractedPos);
      ring2.rotation.x = Math.PI / 2;

      focusedGroup.add(ring1);
      focusedGroup.add(ring2);
      gyroRingsRef.current = [ring1, ring2];
    }
  }, [selectedCubeKey, layoutMode, explodeFactor, cameraPreset, getPresetCameraPosition]);

  // Trigger pulse effect when recentlyGrownKey changes
  useEffect(() => {
    if (!recentlyGrownKey) return;
    const ref = cubeRefs.current.get(recentlyGrownKey);
    if (ref && ref.pulseRing) {
      ref.isPulsing = true;
      ref.pulseScale = 1;
      const ringMat = ref.pulseRing.material as THREE.MeshBasicMaterial;
      ringMat.opacity = 1;
    }
  }, [recentlyGrownKey]);

  // Update Materials, Glow Illumination, Outlines & Matrix Dimming
  useEffect(() => {
    const isAnyCubeExtracted = Boolean(selectedCubeKey && focusedActiveCube);

    cubeRefs.current.forEach((ref) => {
      const state = cubeStateMapRef.current.get(ref.key);
      const mat = ref.mesh.material as THREE.MeshStandardMaterial;
      const edgeMat = ref.edges.material as THREE.LineBasicMaterial;

      if (!state) return;

      const count = state.innovations.length;

      // Check Filter match
      const matchesType = filters.activeType === 'all' || filters.activeType === state.type;
      const matchesNature = filters.activeNature === 'all' || filters.activeNature === state.nature;
      const matchesLocus = filters.activeLocus === 'all' || filters.activeLocus === state.locus;

      // Check Search Query match
      let matchesSearch = true;
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        matchesSearch = state.innovations.some(
          (inv) =>
            inv.companyName.toLowerCase().includes(q) ||
            inv.innovationName.toLowerCase().includes(q) ||
            (inv.description && inv.description.toLowerCase().includes(q))
        );
      }

      const isFilteredOut = !matchesType || !matchesNature || !matchesLocus;
      const isSearchDimmed = filters.searchQuery.trim().length > 0 && !matchesSearch;

      const isSelected = selectedCubeKey === ref.key;
      const isHovered = hoveredKeyRef.current === ref.key;

      ref.targetScale = isSelected ? 1.08 : isHovered ? 1.05 : 1.0;

      if (isFilteredOut || isSearchDimmed) {
        // Ghosted out state
        mat.transparent = true;
        mat.opacity = 0.02;
        mat.color.setHex(0x0f172a);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
        edgeMat.opacity = 0.08;
        edgeMat.color.setHex(0x1e293b);
      } else {
        const colorInfo = getCubeColor(state.type, state.nature, colorMode, count);

        if (count === 0) {
          // Blank cube: wireframe outline only (non-highlighted)
          mat.transparent = true;
          mat.opacity = 0.04;
          mat.color.setHex(0x0f172a);
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
          edgeMat.color.setHex(0x334155);
          // When a cube is extracted outside, dim the other lattice cubes so extracted cube is crystal clear
          edgeMat.opacity = isAnyCubeExtracted ? 0.2 : 0.6;
        } else {
          // Highlighted cube with innovations
          mat.transparent = isAnyCubeExtracted && !isSelected;
          mat.opacity = isAnyCubeExtracted && !isSelected ? 0.18 : 1.0;
          mat.color.setHex(colorInfo.color);
          mat.emissive.setHex(isSelected ? 0xffffff : colorInfo.emissive);
          mat.emissiveIntensity = isSelected
            ? 0.95
            : isAnyCubeExtracted
            ? 0.1
            : colorInfo.emissiveIntensity;
          mat.roughness = 0.2;
          mat.metalness = 0.15;
          edgeMat.color.setHex(isSelected ? 0xffffff : colorInfo.edgeColor);
          edgeMat.opacity = isAnyCubeExtracted && !isSelected ? 0.25 : 1.0;
        }

        if (isSelected) {
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.emissive.setHex(0xffffff);
          mat.emissiveIntensity = 0.95;
          edgeMat.color.setHex(0xffffff);
          edgeMat.opacity = 1.0;
        }
      }
    });
  }, [filters, colorMode, selectedCubeKey, innovations, focusedActiveCube]);

  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* 1-Click Return to Matrix Button when cube is extracted out of graph */}
      {selectedCubeKey && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-20 pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-200">
          <button
            onClick={() => onSelectCube(null)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-900/95 hover:bg-slate-800 backdrop-blur-md border border-slate-700 hover:border-sky-500/60 rounded-full shadow-2xl transition-all cursor-pointer group"
            title="Return cube back into graph overview (or press Escape)"
          >
            <ZoomOut className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
            <span>Return to Matrix (Esc)</span>
          </button>
        </div>
      )}
    </div>
  );
};
