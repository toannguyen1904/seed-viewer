import * as THREE from 'three';
import {g} from './globals.ts';

export function copyMap(map: Map<any, any>) {
    const newMap = new Map();
    map.forEach((val, key) => {
        newMap.set(key, val);
    });
    return newMap;
}

export function createBoneMap(boneNames: string[]) {
    const map = new Map<string,[]>();
    boneNames.forEach(bn => {
        map.set(bn, []);
    });
    return map;
}

export function getCombinations<T>(arr: T[]) {
    const result = arr.flatMap(
        (v, i) => arr.slice(i+1).map( w => [v, w] )
    );
    return result;
}


export function quatDiff(q1: THREE.Quaternion, q2: THREE.Quaternion) {
    return q2.clone().multiply(q1.clone().invert());
}

export function quatAngle(q: THREE.Quaternion) {
    return 2 * Math.acos( Math.abs( clamp(q.w,-1,1) ) );
}

export function clamp(val: number, min: number, max: number) {
    return Math.min(Math.max(val, min), max);
}

export function getCookieValue(cookie:string) {
    var cks = document.cookie.split(';');
    for(let i = 0; i < cks.length; i++){
        let [key, value] = cks[i].split('=');
        if (key.trim() == cookie) return value.trim();
    }
    return null;
}


export function getUsername(){
    return getCookieValue("X-Viewer-Username")!;
}

export function areNumbersClose(a: number, b: number, epsilon = 0.0001) {
    return Math.abs(a - b) < epsilon;
}

export function makeTextareaVerticallyResizable(textarea: HTMLTextAreaElement, initialHeight:number) {
    textarea.setAttribute("style", "height:" + initialHeight + "px;overflow-y:hidden;");
    // textarea.setAttribute("style", "height:" + (textarea.scrollHeight) + "px;overflow-y:hidden;");
    textarea.addEventListener("input", OnInput, false);

    function OnInput(this: any) {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + "px";
    }
    
}

export async function isOk(response: Response) {
    if (!response.ok) {
        const json = await response.json();
        console.error(json);
        if (json.error) {
            alert(json.error);
            throw new Error(json.error);

        } else{
            alert("HTTP-Error: " + response.status + " " + response.statusText);
            throw new Error("HTTP-Error: " + response.status + " " + response.statusText);
        }
    }else{
        // if json then return json
        if (response.headers.get("content-type")?.includes("application/json")) {
            return await response.json();
        }
        else {
            alert("Unknown content type:" + response.headers.get("content-type"));
        }
    }
}


export function percentToFrame(percent: number) {
    percent = clamp(percent, 0, 100);
    const maxFrame = g.MODEL3D?.anim?.maxFrame ?? 0;
    return Math.floor(percent / 100 * maxFrame);
}

export function frameToPercent(frame: number) {
    const maxFrame = g.MODEL3D?.anim?.maxFrame ?? 1; // Avoid division by zero
    frame = clamp(frame, 0, maxFrame);
    return frame / maxFrame * 100;
}

export function deleteCookies() {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}

export function onKeyPressLimitLength(event: KeyboardEvent, callback: Function) {
    if (event.key === "Enter") {
        callback();
    }
}

export function findInObject(obj: Object, key: string) {
    for (const [k, v] of Object.entries(obj)) {
        if (k.includes(key)) {
            return v;
        }
    }
    return null;
}