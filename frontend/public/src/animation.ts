import { g } from './globals.ts';
import * as THREE from 'three';
import { BVH, BVHLoader } from 'three/addons/loaders/BVHLoader.js';
import { setAnimToDownload } from './download_anim.ts';
import { fillTwoColumnMetadata } from './metadata_viewer.ts';


////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class Animation {
	frameCount: number;
	fps: number;
	root: THREE.Bone;
	anim: BVH;
	maxFrame: number;
	name: string;

	constructor(anim: BVH, name :string) {
		this.frameCount = anim.clip.tracks[0].times.length;
		this.fps = Math.round(this.frameCount / anim.clip.duration);
		this.root = this.__findRoot(anim);
		this.anim = anim;
		this.maxFrame = this.frameCount - 1;
		this.name = name;
	}
	

	__findRoot(anim: BVH) : THREE.Bone {
		const root = anim.skeleton.bones.find(bone => bone.parent === null);
		if (!root) {
			console.error("Root bone not found")
		}
		return root as THREE.Bone;
	}


}



////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/**
 * @param {string} bvhUrl 
 */
 export async function loadBVHUrl(bvhUrl:string, name = "no_name", fromBrowser = true, metadata: { [key: string]: string } | null = null) {

	name = name.replace(".bvh", "");
	const bvh = await new BVHLoader().loadAsync(bvhUrl);
	const anim = new Animation(bvh, name);
	g.MODEL3D.anim = anim;
	 

	if (!metadata) {
		g.SPINNER.show("Fetching metadata");
		// fetch at backend /metadata GET request to get metadata.
		fetch(`${g.BACKEND_URL}/metadata/${name}`)
		.then((res) => {
			if (!res.ok) {
				console.log("Failed to fetch metadata");
				return null;
			}
			return res.json();
		})
		.then((data) => {
			if (data) {
				fillTwoColumnMetadata(data);
			}else{
					fillTwoColumnMetadata({ "Name": name, "Frames": anim.maxFrame.toString(), "FPS": anim.fps.toString()}, false)
				}
			})
			.catch(err => {
				console.log(err);
				return null;
			}).finally(() => {
				g.SPINNER.hide("Fetching metadata");
			});
	}


	g.FRAME = 0;
	g.MOVE_ORG_NAME = name;
	g.LOOP_START = 0;
	g.LOOP_END = anim.maxFrame;
	

	setAnimToDownload(bvhUrl, name)

}

/**
 * @param {string} bvhString 
 */
export async function loadBVHString(bvhString:string, name = "no_name", fromBrowser = true, metadata: { [key: string]: string } | null = null) {
	const bvhURL = URL.createObjectURL(new Blob([bvhString], { type: 'text/plain' }));
	await loadBVHUrl(bvhURL, name, fromBrowser, metadata);
}




////////////////////////////////////////////////////////////////////////////////////////////////////////////////
