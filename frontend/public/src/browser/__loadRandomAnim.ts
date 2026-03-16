import { requestBVH } from './__requestBVH'
export async function loadRandomAnim() {
    requestBVH({ random: true })
}

