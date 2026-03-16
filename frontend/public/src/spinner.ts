import { g } from "./globals.ts";

const lg = {
  COUNTER: 0 as number,
  MESSAGE_QUEUE: [] as string[],
}


export function initSpinner() {
  const spinner = document.getElementById("spinner")!;
  spinner.className = "fixed top-0 left-0 h-full w-full pointer-events-none flex flex-col items-center justify-center	 z-50 ";
  spinner.innerHTML = /*html*/`
        <div
          class="text-gray-800 bg-black/20 inline-block h-16 w-16 animate-spin rounded-full border-8 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite]"
          role="status">
        </div>
        <p class="text-white m-2 p-1 px-2 bg-black bg-opacity-40 rounded-lg whitespace-pre-line">Loading...</p>
    `

  g.SPINNER = {
    show: function (key="Loading...") {
      lg.MESSAGE_QUEUE.push(key);
      const p = spinner.getElementsByTagName("p")[0];
      // show all messages
      p.innerText = lg.MESSAGE_QUEUE.join("\n");
      lg.COUNTER++;
      // assert length of lg.MESSAGE_QUEUE is equal to lg.COUNTER
      if (lg.MESSAGE_QUEUE.length !== lg.COUNTER) {
        alert("BUG. lg.MESSAGE_QUEUE.length !== lg.COUNTER");
      }
      spinner.classList.remove("hidden");
    },
    hide: function (key="Loading...") {
      // delete first occurence of key
      const ind = lg.MESSAGE_QUEUE.findIndex((v) => v === key);
      if (ind !== -1) {
        lg.MESSAGE_QUEUE.splice(ind, 1);
      }
      // show all messages
      const p = spinner.getElementsByTagName("p")[0];
      p.innerText = lg.MESSAGE_QUEUE.join("<br>");
      lg.COUNTER--;
      if (lg.MESSAGE_QUEUE.length !== lg.COUNTER) {
        alert("BUG. lg.MESSAGE_QUEUE.length !== lg.COUNTER");
      }
      // console.log("hide spinner", lg.COUNTER);
      if (lg.COUNTER <= 0) {
        spinner.classList.add("hidden");
      }
    }
  }

}


