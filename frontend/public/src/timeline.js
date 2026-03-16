
import { g } from './globals.ts';
import { frameToPercent, clamp } from './helpers.ts';
import { toggleTemporalLabels } from './temporal_labels.ts';

export function setFrame(frame, _clamp=false) {
  if (_clamp && g.MODEL3D?.anim) {
    frame = clamp(frame, 0, g.MODEL3D.anim.maxFrame);
  }
  g.FRAME = frame;
  // stop playing
  g.PLAYING = false;
  // change current frame
  document.getElementById("currentFrame").innerText = `  ${frame}`;
  refreshPlayingButton();
  
  // set frame indicator for labeller
  refreshPlayingButton();
}

function refreshFrameText() {
  if (!g.MODEL3D?.anim) return;
  document.getElementById("maxFrame").innerText = `/ ${g.MODEL3D.anim.maxFrame}`;
  document.getElementById("timelineSlider").max = g.MODEL3D.anim.maxFrame + 1;
  document.getElementById("timelineSlider").value = g.FRAME;
}

function refreshPlayingButton() {
  if (g.PLAYING) {
    document.getElementById("pauseButton").style.display = "block";
    document.getElementById("playButton").style.display = "none";
    // color the play button
    // document.getElementById("playButton").classList.add("text-gray-700");
  } else {
    document.getElementById("playButton").style.display = "block";
    document.getElementById("pauseButton").style.display = "none";
    // color the play button
    // document.getElementById("playButton").classList.remove("text-gray-700");
  }
}

function refreshFollowButton() {
  if (g.CAMCON.following) {
    // color the follow button
    document.getElementById("followButton").classList.add("text-gray-700");
  } else {
    // color the follow button
    document.getElementById("followButton").classList.remove("text-gray-700");
  }
}

export function initTimeline() {

    const defaultGray = "text-gray-400"

    const timeline = document.getElementById("timeline");
    timeline.className += " w-full flex flex-row justify-end leading-none p-2";
    timeline.innerHTML = /*html*/ `
        <div id="timelineBar"
          class="flex w-full h-10 flex-row flex-between px-2 gap-3 rounded-lg justify-center items-center" style="background: rgba(240, 240, 240, 0.7); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);">

          <!-- skeleton button -->
          <div class="myicon">
            <button title="Show skeleton">
              <span id="skeletonButton" class="material-symbols-outlined">
                accessibility_new
              </span>
            </button>
          </div>


          <!-- follow button -->
          <div class="myicon">
            <button title="Follow character">
              <span class="material-symbols-outlined" id="followButton">
                center_focus_strong
              </span>
            </button>
          </div>

          <!-- temporal label button -->
          <div class="myicon">
            <button title="Show temporal labels">
              <span id="temporalLabelButton" style="display: inline-flex; width: 24px; height: 24px;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M4 2C2.9 2 2 2.9 2 4v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4zm0 2h16v12h-4.83L12 19.17 8.83 16H4V4z"/>
                  <rect x="7" y="7" width="10" height="1.5" rx="0.75"/>
                  <rect x="7" y="11" width="7" height="1.5" rx="0.75"/>
                </svg>
              </span>
            </button>
          </div>

          <!-- play button -->
          <div class="myicon">
            <!-- IN THE FINAL VERSION THIS SHOULD BE A BUTTON -->
            <button class="">
              <span hidden id="playButton" class="material-symbols-outlined">
                play_arrow
              </span>
              <span id="pauseButton" class="material-symbols-outlined">
                pause
              </span>
            </button>
          </div>


          <!-- timeline slider -->
          <div class="grow flex items-center justify-center" style="position: relative; padding: 0 10px;">
            <div id="temporalLabelSegments" style="position: absolute; left: 10px; right: 10px; height: 20px; top: 50%; transform: translateY(-50%); z-index: 1; pointer-events: none; display: none;"></div>
            <input spellcheck="false"  id="timelineSlider" type="range" value="1" min="1" max="100" step="1"
              class="slider w-full h-1 leading-none bg-gray-500 bg-opacity-40 appearance-none cursor-pointer" style="position: relative; z-index: 2;">
          </div>

          <!-- current frame info -->
          <div class="  text-right	w-[10ch]	">
            <span class="${defaultGray}  whitespace-pre w-[4ch] " id="currentFrame">1000</span>
            <span class="${defaultGray} w-[6ch] " id="maxFrame">/ 234</span>
          </div>


        </div>
    `;



  refreshFollowButton();
  refreshPlayingButton();


  const viewport = document.getElementById("3d-viewport");
  // on viewport spacebar press, stop playing
  viewport.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      g.PLAYING = !g.PLAYING;
      refreshPlayingButton();
    }
  });

  // on viewport arrow right press, go to next frame
  // on viewport arrow left press, go to previous frame
  viewport.addEventListener("keydown", (e) => {
    if (e.code === "ArrowRight") {
      setFrame(g.FRAME + 1, true);
    } else if (e.code === "ArrowLeft") {
      setFrame(g.FRAME - 1, true);
    }
  }); 

  // on timeline slider arrow right press, go to next frame
  // on timeline slider arrow left press, go to previous frame
  document.getElementById("timelineSlider").addEventListener("keydown", (e) => {
    if (e.code === "ArrowRight") {
      e.preventDefault();
      setFrame(g.FRAME + 1, true);
    } else if (e.code === "ArrowLeft") {
      e.preventDefault();
      setFrame(g.FRAME - 1, true);
    }
  });



  // on pressing the play button, start playing
  document.getElementById("playButton").addEventListener("click", () => {
    g.PLAYING = !g.PLAYING;
    refreshPlayingButton();
  });

  // on pressing the pause button, stop playing
  document.getElementById("pauseButton").addEventListener("click", () => {
    g.PLAYING = !g.PLAYING;
    refreshPlayingButton();
  });

  // on pressing the follow button, start following
  document.getElementById("followButton").addEventListener("click", () => {
    g.CAMCON.following = !g.CAMCON.following;
    refreshFollowButton();
  });

  // on pressing the temporal label button, toggle temporal labels
  document.getElementById("temporalLabelButton").addEventListener("click", () => {
    toggleTemporalLabels();
  });

  // on timeline slider change, set frame
  document.getElementById("timelineSlider").addEventListener("input", (e) => {
    setFrame(parseInt(e.target.value) - 1)
  });


  function refreshSkeletonButton() {
    if (!g.MODEL3D || !g.MODEL3D.skeletonHelper) return;
    if (g.MODEL3D.skeletonHelper.visible) {
      document.getElementById("skeletonButton").classList.add("text-gray-700");
    } else {
      document.getElementById("skeletonButton").classList.remove("text-gray-700");
    }
  }

  // on pressing skeleton button, show/hide skeleton
  document.getElementById("skeletonButton").addEventListener("click", () => {
    if (!g.MODEL3D || !g.MODEL3D.skeletonHelper) return;
    g.MODEL3D.skeletonHelper.visible = !g.MODEL3D.skeletonHelper.visible;
    refreshSkeletonButton();

  });

  refreshSkeletonButton();


  // make timeline bar visible
  document.getElementById("timeline").style.visibility = "visible";


  g.UPDATE_LOOP["viewport"] = () => {
    // round to int (we don't show fractional values in the UI)
    const frame = Math.round(g.FRAME);
    document.getElementById("currentFrame").innerText = `${frame}`;
    document.getElementById("timelineSlider").value = frame;
    refreshFrameText();
  };


}
