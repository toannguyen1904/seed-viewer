import {lg} from "./__localGlobals"

export function updateMaxPages(newMax: number) {
    lg.MAXPAGES = Math.ceil(newMax / lg.PERPAGE)
    if (lg.MAXPAGES == 0) {
        lg.MAXPAGES = 1
    }
    (document.querySelector('#tab-page') as HTMLInputElement).max = lg.MAXPAGES.toString()
    document.querySelector('#tab-max-pages')!.innerHTML = "/" + lg.MAXPAGES
    const totalEl = document.getElementById('tab-total-moves');
    if (totalEl) {
        totalEl.textContent = `${newMax} moves`;
    }
}

