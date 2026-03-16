

/**
 * FOR DEBUGGING PURPOSES
 * @param {THREE.Vector3} position
 * 
*/
function drawDebugCube(position) {
    // draw cube at target position
    if (scene.getObjectByName("debugCube")) {
      scene.remove(scene.getObjectByName("debugCube"))
    }
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    // draw it on top of eveything
    cube.renderOrder =  999
    cube.material.depthTest = false 
    cube.material.transparent = true
    cube.name = "debugCube";
    cube.position.copy(position);
    scene.add(cube);
  }
  


