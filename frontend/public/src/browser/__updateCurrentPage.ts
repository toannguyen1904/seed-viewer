import { lg } from "./__localGlobals";

export function updateCurrentPage(newPage: number) {
    if (newPage > lg.MAXPAGES) {
        lg.PAGE = lg.MAXPAGES;
    }
    else if (newPage < 1) {
        lg.PAGE = 1;
    }
    else {
        lg.PAGE = newPage;
    }
    (document.querySelector('#tab-page') as HTMLInputElement).value = lg.PAGE.toString()
}
