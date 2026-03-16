
import { getTablePage } from './__getMetadataPage';
import {lg} from "./__localGlobals"
import {createLocalFilesBrowser} from "./__createLocalFilesBrowser"

export function initBrowser() {

    createLocalFilesBrowser()

    lg.CONTROLLER = new AbortController();
    lg.SIGNAL = lg.CONTROLLER.signal;
}










