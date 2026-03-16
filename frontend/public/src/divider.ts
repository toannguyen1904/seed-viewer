
import {resizeViewport} from "./viewport.ts";


function initHorizontalDivider(divider: HTMLElement) {

    // get parent
    const parent = divider.parentElement! as HTMLElement;
    // get previous sibling of divider
    const prevSibling = divider.previousElementSibling! as HTMLElement;
    // get next sibling of divider
    const nextSibling = divider.nextElementSibling! as HTMLElement;

    // const leftPane = document.getElementById('left-pane')!;
    // const rightPane = document.getElementById('right-pane')!;

    divider.className = "grow-0 shrink-0 w-2 cursor-col-resize z-40 hover:bg-gray-300 rounded transition-colors";
    divider.innerHTML = /*html*/``

    let grabOffset = 0;

    function mousemove(e: { clientX: number; }) {
        const parentRect = parent.getBoundingClientRect();
        let containerWidth = parentRect.width;
        const dividerWidth = divider.getBoundingClientRect().width;
        let newLeftPaneWidth = ((e.clientX - grabOffset - parentRect.left) / containerWidth) * 100;
        let newRightPaneWidth = 100 - newLeftPaneWidth - (dividerWidth / containerWidth) * 100;

        prevSibling.style.width = `${newLeftPaneWidth}%`;
        nextSibling.style.width = `${newRightPaneWidth}%`;
        divider.style.left = `${prevSibling.getBoundingClientRect().width}px`;

        resizeViewport();
    }

    function mouseup() {
        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);
    }

    divider.addEventListener('mousedown', function (e) {
        e.preventDefault();
        const dividerRect = divider.getBoundingClientRect();
        grabOffset = e.clientX - dividerRect.left;
        document.addEventListener('mousemove', mousemove);
        document.addEventListener('mouseup', mouseup);
    });


    // place divider between left and right panes
    divider.style.left = `${prevSibling.getBoundingClientRect().width}px`;

    // check if size of window changed, then adjust divider
    window.addEventListener('resize', function () {
        divider.style.left = `${prevSibling.getBoundingClientRect().width}px`;
    });
}

function initVerticalDivider(divider: HTMLElement) {
    
        // get parent
        const parent = divider.parentElement! as HTMLElement;
        // get previous sibling of divider
        const prevSibling = divider.previousElementSibling! as HTMLElement;
        // get next sibling of divider
        const nextSibling = divider.nextElementSibling! as HTMLElement;
    
    
        divider.className = "grow-0 shrink-0 h-2 cursor-row-resize z-40 hover:bg-gray-300 rounded transition-colors";
        divider.innerHTML = /*html*/``
    
        function mousemove(e: { clientY: number; }) {
            // shady but works
            let containerHeight = parent.getBoundingClientRect().height;
            let mouseHeightPercent = (e.clientY / containerHeight)
            mouseHeightPercent = Math.min(1, Math.max(0, mouseHeightPercent));
            const dividerHeightPercent = divider.getBoundingClientRect().height / containerHeight ;
            let newTopPaneHeight = mouseHeightPercent ;
            newTopPaneHeight = Math.min(1-dividerHeightPercent, Math.max(0, newTopPaneHeight));
            let newBottomPaneHeight = 1 - newTopPaneHeight - dividerHeightPercent ;
            newBottomPaneHeight = Math.min(1-dividerHeightPercent, Math.max(0, newBottomPaneHeight));

            // Set the heights of the panes. 
            prevSibling.style.height = `${newTopPaneHeight * 100}%`;
            nextSibling.style.height = `${newBottomPaneHeight * 100}%`;
            divider.style.top = `${prevSibling.getBoundingClientRect().height}px`;
        
            // onChartResize();
        }
        
        function mouseup() {
            document.removeEventListener('mousemove', mousemove);
            document.removeEventListener('mouseup', mouseup);
        }
    
        divider.addEventListener('mousedown', function (e) {
            e.preventDefault();
            document.addEventListener('mousemove', mousemove);
            document.addEventListener('mouseup', mouseup);
        });

        // place divider between top and bottom panes
        divider.style.top = `${prevSibling.getBoundingClientRect().height}px`;

        // check if size of window changed, then adjust divider
        window.addEventListener('resize', function () {
            divider.style.top = `${prevSibling.getBoundingClientRect().height}px`;
        });

}




export function initDivider() {
    // find all elemnets with 
    const dividersH = document.getElementsByName('divider-h')
    dividersH.forEach(divider => {
        initHorizontalDivider(divider);
    });

    const dividersV = document.getElementsByName('divider-v')
    dividersV.forEach(divider => {
        initVerticalDivider(divider);
    });
    
}

