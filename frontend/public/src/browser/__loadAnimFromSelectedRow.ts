import { requestBVH } from './__requestBVH.ts'

export async function loadAnimFromSelectedRow(val: any) {
    requestBVH({ val: val })
}