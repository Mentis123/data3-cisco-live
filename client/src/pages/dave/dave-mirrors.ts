import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

import { REFLECTION_LAYER } from "./dave-physical";

export const REFLECTION_CONTENT_LAYER = 3;

const smokedMirrorShader = {
  name: "DaveSmokedMirrorShader",
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    mirrorOpacity: { value: 0.86 },
    normalReflectance: { value: 0.5 },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;

    #include <common>
    #include <logdepthbuf_pars_vertex>

    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float mirrorOpacity;
    uniform float normalReflectance;
    varying vec4 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;

    #include <logdepthbuf_pars_fragment>

    void main() {
      #include <logdepthbuf_fragment>
      vec3 reflection = texture2DProj(tDiffuse, vUv).rgb;
      reflection = max(reflection - vec3(0.006), vec3(0.0));
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      float grazing = 1.0 - abs(dot(normalize(vWorldNormal), viewDirection));
      float fresnel = normalReflectance
        + (1.0 - normalReflectance) * pow(grazing, 5.0);
      float opacity = mirrorOpacity + (0.96 - mirrorOpacity) * pow(grazing, 5.0);
      reflection *= color * fresnel;
      gl_FragColor = vec4(reflection + vec3(0.0015, 0.0025, 0.004), opacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};

export type DaveMirrorSystem = {
  group: THREE.Group;
  mirrors: Reflector[];
  dispose: () => void;
};

export type MirrorFace = {
  name: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
};

export function createMirrorFaceDefinitions(halfExtent: number): MirrorFace[] {
  return [
    {
      name: "+z",
      position: new THREE.Vector3(0, 0, halfExtent),
      rotation: new THREE.Euler(0, Math.PI, 0),
    },
    {
      name: "-z",
      position: new THREE.Vector3(0, 0, -halfExtent),
      rotation: new THREE.Euler(0, 0, 0),
    },
    {
      name: "+x",
      position: new THREE.Vector3(halfExtent, 0, 0),
      rotation: new THREE.Euler(0, -Math.PI / 2, 0),
    },
    {
      name: "-x",
      position: new THREE.Vector3(-halfExtent, 0, 0),
      rotation: new THREE.Euler(0, Math.PI / 2, 0),
    },
    {
      name: "+y",
      position: new THREE.Vector3(0, halfExtent, 0),
      rotation: new THREE.Euler(Math.PI / 2, 0, 0),
    },
    {
      name: "-y",
      position: new THREE.Vector3(0, -halfExtent, 0),
      rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
    },
  ];
}

/**
 * Six actual planar mirrors. Reflection cameras see the one physical object,
 * the twelve physical frame edges, and the analytically generated image cells.
 * They do not render the floor, sky, glass shell, or one another.
 */
export function createMirrorSystem(halfExtent: number): DaveMirrorSystem {
  const group = new THREE.Group();
  group.name = "dave-six-planar-mirrors";

  const faces = createMirrorFaceDefinitions(halfExtent);

  const mirrors = faces.map((face) => {
    const geometry = new THREE.PlaneGeometry(halfExtent * 1.985, halfExtent * 1.985);
    const mirror = new Reflector(geometry, {
      clipBias: 0.001,
      color: 0xedeae8,
      textureWidth: 384,
      textureHeight: 384,
      multisample: 0,
      shader: smokedMirrorShader,
    });
    mirror.name = `dave-mirror-${face.name}`;
    mirror.position.copy(face.position);
    mirror.rotation.copy(face.rotation);
    mirror.renderOrder = 1;
    mirror.layers.set(0);

    const material = mirror.material as THREE.ShaderMaterial;
    material.transparent = true;
    material.depthWrite = false;
    material.depthTest = true;
    // The Reflector is the inward physical coating. A camera outside a near
    // panel sees through it; the far/side inward coatings reflect the source.
    material.side = THREE.FrontSide;
    material.blending = THREE.NormalBlending;
    material.toneMapped = false;

    group.add(mirror);
    return mirror;
  });

  // The optical coating only renders from the chamber interior. This separate
  // substrate supplies the observed smoky transmission when the camera sees a
  // panel's back face, without ever reusing a stale Reflector render target.
  const paneGeometry = new THREE.PlaneGeometry(halfExtent * 1.985, halfExtent * 1.985);
  const paneMaterial = new THREE.MeshBasicMaterial({
    color: 0x03050a,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  faces.forEach((face) => {
    const pane = new THREE.Mesh(paneGeometry, paneMaterial);
    pane.name = `dave-smoked-pane-${face.name}`;
    pane.position.copy(face.position);
    pane.rotation.copy(face.rotation);
    pane.renderOrder = 2;
    group.add(pane);
  });

  const reflectionBackground = new THREE.Color(0x000103);

  mirrors.forEach((mirror) => {
    const originalBeforeRender = mirror.onBeforeRender.bind(mirror);

    mirror.onBeforeRender = (renderer, scene, camera, geometry, material, renderGroup) => {
      const reflectionCamera = mirror.getReflectionCamera(camera);
      reflectionCamera.layers.disableAll();
      reflectionCamera.layers.enable(REFLECTION_LAYER);
      reflectionCamera.layers.enable(REFLECTION_CONTENT_LAYER);

      const oldBackground = scene.background;
      const oldFog = scene.fog;
      const visibility = mirrors.map((candidate) => candidate.visible);

      mirrors.forEach((candidate) => {
        if (candidate !== mirror) {
          candidate.visible = false;
        }
      });
      scene.background = reflectionBackground;
      scene.fog = null;

      try {
        originalBeforeRender(renderer, scene, camera, geometry, material, renderGroup);
      } finally {
        scene.background = oldBackground;
        scene.fog = oldFog;
        mirrors.forEach((candidate, index) => {
          candidate.visible = visibility[index];
        });
      }
    };
  });

  return {
    group,
    mirrors,
    dispose: () => {
      mirrors.forEach((mirror) => {
        mirror.geometry.dispose();
        mirror.dispose();
      });
    },
  };
}

export function enableMirrorContent(object: THREE.Object3D) {
  object.traverse((child) => {
    child.layers.enable(REFLECTION_CONTENT_LAYER);
  });
}
