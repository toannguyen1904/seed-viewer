import { loadAnimFromSelectedRow } from "./__loadAnimFromSelectedRow.ts"
import {lg} from "./__localGlobals.ts"

/**
* 
* @param {string[]} columns 
* @param {Array.<Object>} rows 
*/
export function refreshBrowserTable(columns: any[], rows: any[]) {
    const browserTable = document.getElementById("browser-table")!
    const headerTable = document.getElementById("browser-table-header")!

    // Render header in separate non-scrolling table
    headerTable.innerHTML =
    /*html*/`
    <tr>
        ${
            columns.map((col) => /*html*/`
                <th class="text-left px-2 py-2 bg-white border-b border-gray-200 text-sm font-semibold text-gray-700">${col}</th>
            `).join("")
        }
    </tr>
    `

    // Render data rows in scrollable table
    browserTable.innerHTML =
    /*html*/`
    <tbody>

        ${
            rows.map((row) => /*html*/`
                <tr name="datarow" class="border-b border-gray-100 cursor-pointer hover:bg-lime/20 text-sm break-all align-top bg-gray-50">
                    ${
                    columns.map((key) => /*html*/`
                        <td class="px-2 py-1 text-gray-600">${row[key]}</td>
                    `).join("")
                    }
                </tr>
            `).join("")
        }
    </tbody>
    `

    browserTable.querySelectorAll("tr[name='datarow']").forEach((row: Element, i) => {
        const c = "Filename";
        (row as HTMLElement).onclick = () => {
            // Highlight selected row
            browserTable.querySelectorAll("tr[name='datarow']").forEach((r: Element) => {
                (r as HTMLElement).classList.remove("bg-lime/30");
            });
            (row as HTMLElement).classList.add("bg-lime/30");
            loadAnimFromSelectedRow(rows[i][c]);
        }
    })


}
