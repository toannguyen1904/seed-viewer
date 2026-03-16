import * as THREE from 'three';

const _vector = /*@__PURE__*/ new THREE.Vector3();
const _boneMatrix = /*@__PURE__*/ new THREE.Matrix4();
const _matrixWorldInv = /*@__PURE__*/ new THREE.Matrix4();

/**
 * Custom SkeletonHelper for SOMA models.
 * Overrides updateMatrixWorld to skip drawing lines from
 * the root bone ("_Root").
 *
 * IMPORTANT: calls LineSegments.updateMatrixWorld (NOT SkeletonHelper's)
 * to prevent the base class from overwriting our custom positions.
 */
export class SkeletonHelper2 extends THREE.SkeletonHelper{
    constructor(object){
        super(object);
    }

    updateMatrixWorld( force ) {

		const bones = this.bones;

		const geometry = this.geometry;
		const position = geometry.getAttribute( 'position' );

		_matrixWorldInv.copy( this.root.matrixWorld ).invert();

		for ( let i = 0, j = 0; i < bones.length; i ++ ) {

			const bone = bones[ i ];
			if ( bone.parent && bone.parent.isBone ) {

				_boneMatrix.multiplyMatrices( _matrixWorldInv, bone.matrixWorld );
				_vector.setFromMatrixPosition( _boneMatrix );
				position.setXYZ( j, _vector.x, _vector.y, _vector.z );

                const pName = bone.parent.name;
                if ( pName === "root" || pName === "_Root" ){
                    position.setXYZ( j + 1, _vector.x, _vector.y, _vector.z );
                }     else{
                    _boneMatrix.multiplyMatrices( _matrixWorldInv, bone.parent.matrixWorld );
                    _vector.setFromMatrixPosition( _boneMatrix );
                    position.setXYZ( j + 1, _vector.x, _vector.y, _vector.z );
                }



				j += 2;

			}

		}

		geometry.getAttribute( 'position' ).needsUpdate = true;

		// Skip SkeletonHelper.updateMatrixWorld (which would overwrite positions)
		// and call LineSegments.updateMatrixWorld directly
		THREE.LineSegments.prototype.updateMatrixWorld.call( this, force );

	}
}


/**
 * Simple skeleton helper for models where bones have non-bone children
 * (e.g. G1 robot with Mesh objects reparented under joints).
 * 
 * Instead of relying on THREE.SkeletonHelper's auto-discovery (which
 * picks up Mesh children too), this takes an explicit list of bone objects
 * and draws colored line segments between each bone and its parent bone.
 */
export class JointHelper extends THREE.LineSegments {
    constructor(joints) {
        // Build pairs: for each joint whose parent is also a bone/joint,
        // draw a line from parent to child
        const pairs = [];
        for (const joint of joints) {
            if (joint.parent && joint.parent.isBone) {
                pairs.push({ child: joint, parent: joint.parent });
            }
        }

        const vertexCount = pairs.length * 2;
        const positions = new Float32Array(vertexCount * 3);
        const colors = new Float32Array(vertexCount * 3);

        // Initialize colors to match Three.js SkeletonHelper (blue→green)
        for (let i = 0; i < pairs.length; i++) {
            // Parent vertex: green
            colors[i * 6 + 0] = 0.0;
            colors[i * 6 + 1] = 1.0;
            colors[i * 6 + 2] = 0.0;
            // Child vertex: blue
            colors[i * 6 + 3] = 0.0;
            colors[i * 6 + 4] = 0.0;
            colors[i * 6 + 5] = 1.0;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            depthTest: false,
            depthWrite: false,
            toneMapped: false,
            transparent: true,
            fog: false,
        });

        super(geometry, material);

        this._pairs = pairs;
        this.frustumCulled = false;
        this.matrixAutoUpdate = true;
    }

    updateMatrixWorld(force) {
        const position = this.geometry.getAttribute('position');

        for (let i = 0; i < this._pairs.length; i++) {
            const { child, parent } = this._pairs[i];

            // Get world positions
            parent.getWorldPosition(_vector);
            position.setXYZ(i * 2, _vector.x, _vector.y, _vector.z);

            child.getWorldPosition(_vector);
            position.setXYZ(i * 2 + 1, _vector.x, _vector.y, _vector.z);
        }

        position.needsUpdate = true;
        super.updateMatrixWorld(force);
    }

    dispose() {
        this.geometry.dispose();
        this.material.dispose();
    }
}