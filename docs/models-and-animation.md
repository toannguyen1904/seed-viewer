# Models & Animation System

The viewer supports two 3D character models, each with its own animation format and rendering pipeline.

## Model Configuration

`MODEL_CONFIGS` in `globals.ts` defines each model. The `rotation` field is a `[x, y, z]` Euler tuple applied with `'YXZ'` order (X first/inner, Y last/outer).

| Property | SOMA | G1 |
|----------|------|----|
| `name` | "SOMA" | "G1" |
| `scale` | 0.01 | 1.0 |
| `rotation` | [0, 0, 0] | [-PI/2, 0, 0] |
| `animFormat` | "bvh" | "csv" |
| `animEndpoint` | `/storage_local/somabvh/` | `/storage_local/g1csv/` |

**Order in `MODEL_CONFIGS`** = dropdown order in the model selector.

### Rotation Conventions

- **SOMA**: Already Y-up with +Z forward (standard Three.js). No rotation needed.
- **G1**: Z-up FBX with +X forward (URDF/robotics convention). Only needs -90° X rotation for Z-up → Y-up conversion. The animation CSV `root_rotateZ` (~87°) handles facing direction — it rotates the character from +X to approximately +Y in Z-up space, which maps to +Z (toward camera) in Y-up world space.

## SOMA — `Model3D`

**FBX**: `models3D/SOMA/soma_male_skel_minimal.fbx` — humanoid character.

**Scale**: 0.01 (FBX geometry is in centimeters, `metersPerUnit=0.01`).

**Skeleton**: 78 bones, standard humanoid hierarchy. Bone names have leading underscore in FBX (`_Root`, `_Hips`, `_Spine1`, etc.). BVH tracks use plain names without underscore (`Root`, `Hips`, `Spine1`). The `toBvhName()` helper in `setFrame()` strips the leading underscore when matching FBX bones to BVH tracks.

**Materials** (`applySomaMaterials()`): Upgrades all meshes to `MeshPhysicalMaterial` with:
- Clearcoat effect for glossy surface
- FlakesTexture normal map (procedural 512x512 canvas from `flakes_texture.ts`) for metallic flakes
- Cylindrical UV projection auto-generated if mesh has no UVs
- Two material zones controlled via lighting settings: "body" (light parts) and "dark" (head, hands, ankles, hips)
- After material creation, saved lighting/material settings are re-applied via `loadSettings()` + `applyLightingSettings()`

**Animation**: BVH format. Backend endpoint: `/api/storage_local/somabvh/` (reads `move_uniform_soma_bvh_path` metadata column). Note: metadata stores `.csv` extension but actual files are `.bvh` — the backend auto-corrects this.

**Frame application** (`Model3D.setFrame()`):
1. Recursively walks the skeleton from root
2. For each bone, finds matching track by name (using `toBvhName()` to strip underscore prefix)
3. Interpolates between `floor(frame)` and `ceil(frame)` using `t = frame - floor(frame)`
4. Hips: position interpolated, offset by rest position
5. All bones: quaternion slerp interpolation

## G1 Robot — `Model3DG1`

**FBX**: `models3D/g1/g1_Zup_robot_01.fbx` — exported from URDF via Blender.

**FBX loading** (`Model3DG1.init()`):
The FBX has a URDF-style dual hierarchy that needs special handling:
```
_g1_29dof_grp
  ├── _pelvis_grp          (SkinnedMesh container, each mesh skinned to 1 joint)
  └── floating_base_joint  (skeleton hierarchy)
```

Processing steps:
1. Traverse to collect joints (names containing "joint" or "root") into a `joints` Map
2. Convert each SkinnedMesh to a regular Mesh, parent it under its skeleton bone
3. Compute smooth vertex normals (`computeVertexNormals()`)
4. Remove the now-empty `_pelvis_grp`
5. Apply PBR materials (dark metallic for head/hands/ankles/hips, white metallic for body)
6. Create `JointHelper` for skeleton visualization (blue/green gradient, matching SkeletonHelper2 colors)

**Materials** (`applyG1Materials()`): `MeshStandardMaterial` with two zones:
- **Dark parts** (head, hands, ankles, hips, pelvis, logo): glossy black metallic with subtle blue glow on head
- **Body parts**: white metallic

**Animation format**: CSV with columns:
- `Frame` — frame index
- `root_translateX/Y/Z` — root position (centimeters, Z-up)
- `root_rotateX/Y/Z` — root rotation (degrees, ZYX Euler order)
- `<joint_name>_dof` — single degree of freedom per joint (degrees)

**Joint naming mapping**: FBX has leading underscore (`_left_hip_pitch_joint`), CSV column names don't (`left_hip_pitch_joint_dof`).

**Frame application** (`Model3DG1.setFrame()`):
1. Root (`floating_base_joint`): position in cm → meters (scale 0.01), rotation degrees → radians, Euler order ZYX
2. Per joint: single-DOF rotation based on joint type:
   - `pitch` / `knee` / `elbow` → Y axis rotation
   - `roll` → X axis rotation
   - `yaw` → Z axis rotation

**G1 Animation class** (`g1_animation.ts`):
- Default fps: 120
- `getFrameData(frame)` returns interpolated column values
- Handles fractional frames with linear interpolation

## Skeleton Visualization

Two helper classes in `customSkeletonHelper.js`:

- **`SkeletonHelper2`** — Used by SOMA. Extends Three.js `SkeletonHelper`. Draws bone lines with blue→green gradient. Skips root bone segment (sets zero-length line). Root name detection includes both `Root` and `_Root` (SOMA). Uses `LineSegments.prototype.updateMatrixWorld` to skip SkeletonHelper's position overwrite.

- **`JointHelper`** — Used by G1. Custom `LineSegments` that draws lines only between joint/bone objects (ignores Mesh children reparented under joints). Same blue→green color gradient as SkeletonHelper2.

Both helpers are added to `g.SCENE` (not to the model object) to avoid double-scaling from parent transforms. The SkeletonHelper constructor sets `matrix = root.matrixWorld` and `matrixAutoUpdate = false`, so it follows the model automatically.

## Model Switching Flow (`model_selector.ts`)

1. Save current state: animation name (`g.MOVE_ORG_NAME`), playing, following, skeleton visibility
2. `disposeModel3D()` — cleans up current model geometry, materials, skeleton helpers
3. Set `g.CURRENT_MODEL` to new type
4. Create new model class (`Model3D` or `Model3DG1`)
5. Load FBX via `init3DModel()` with config from `MODEL_CONFIGS`
6. `applySceneForModel()` — loads and applies per-model lighting settings, rebuilds env map (does not set camera position)
7. Add to scene
8. Reload same animation on new model via `requestBVH()` (dispatches to BVH or CSV based on model's `animFormat`)
9. Restore saved state (playing, following, skeleton visibility) and update timeline button DOM
10. Refresh settings panel if open

## Adding a New Model

To add a new character model:
1. Add a new entry to `ModelType` union in `globals.ts`
2. Add config to `MODEL_CONFIGS` with URL, scale, rotation (Euler tuple), animation format
3. Create a model class with `init()`, `setFrame()`, `getRootWorldPosition()`, `dispose()` methods
4. Add the class to `init3DModel()` in `models.ts`
5. If new animation format: create a new animation class with `fps`, `maxFrame`, `getFrameData()`, and add backend endpoint
6. Update `model_selector.ts` to handle the new model
7. Add lighting defaults in `lighting_settings.ts`
