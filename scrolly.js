import { StepData } from "./common.js";
import { ScrollyError } from "./common.js";

import { fetchAllDataFromGoogleSheet } from "./google-sheet.js";

let main = null;
let scrolly = null;
let stickyImage = null;
let prevStickyImage = null;
let stickyMap = null;
let story = null;
let steps = null;

// initialize the scrollama
let scroller = scrollama();

document.addEventListener("DOMContentLoaded", async function () {
  main = document.querySelector("main");
  scrolly = main.querySelector("#scrolly-container");
  stickyImage = scrolly.querySelector("#sticky-image");
  stickyMap = scrolly.querySelector("#sticky-map");
  story = scrolly.querySelector("article");

  //createScrollyContentFromCSVFile();
  try {
    const allScrollyData = await fetchAllDataFromGoogleSheet();
    createAllScrollyContentInHTML(allScrollyData);
  } catch (scrollyError) {
    displayThenThrowError(scrollyError);
  }
});

function createAllScrollyContentInHTML(allScrollyData) {
  createStoryContentInHtml(allScrollyData.storyData);
  createStepsContentInHtml(allScrollyData.stepData);
}

function createStoryContentInHtml(storyData) {
  const title = document.getElementById("title");
  title.innerHTML = storyData.title;

  const subtitle = document.getElementById("subtitle");
  subtitle.innerHTML = storyData.subtitle;

  const endText = document.getElementById("end-text");
  endText.innerHTML = storyData.endText;
}

/* This creates all the steps in HTML for the scrolly story 
    from a stepDataArry 
*/
function createStepsContentInHtml(stepDataArray) {
  var stepNumber = 1;
  stepDataArray.forEach((stepData) => {
    var stepElement = document.createElement("div");
    stepElement.classList.add("step");
    // dataset is the scrollama element that maps to HTML
    // so updating dataset updates the HTML attributes
    stepElement.dataset.step = stepNumber;
    stepElement.dataset.contentType = stepData.contentType;
    if (stepData.filePath) {
      stepElement.dataset.filePath = stepData.filePath;
    }
    if (stepData.latitude) {
      stepElement.dataset.latitude = stepData.latitude;
    }
    if (stepData.longitude) {
      stepElement.dataset.longitude = stepData.longitude;
    }
    if (stepData.zoomLevel) {
      stepElement.dataset.zoomLevel = stepData.zoomLevel;
    }

    stepElement.innerHTML = `<p class="step-content">${stepData.text}</p>`;
    story.appendChild(stepElement);
    stepNumber++;
  });

  // re-query the steps after creating them from CSV data
  steps = story.querySelectorAll(".step");

  // initialize scrollama only after the scrolly content has been created
  initScrollama();
}

function isParseError(parseErrors, papaErrors) {
  return false;
}

function displayThenThrowError(stepError) {
  const errorAction = document.getElementById("error-action");
  errorAction.innerHTML = stepError.action;

  const errorMessage = document.getElementById("error-message");
  errorMessage.innerHTML = stepError.message;

  const errorContainer = document.getElementById("error-container");
  errorContainer.style.display = "flex"; // Show the error container

  // Since stepError a subclass of Error, we want to throw it after
  // we display the error in HTML so that the full stack trace is available
  // to the user in the console
  throw stepError;
}

// scrollama event handlers
function handleStepEnter(response) {
  var el = response.element;

  // Set active step state to is-active and all othe steps not active
  steps.forEach((step) => step.classList.remove("is-active"));
  el.classList.add("is-active");

  replaceStepStickyContent(el.dataset);
}

/* As we enter a step in the story, replace or modify the sticky content
   in HTML based on the step data
*/
function replaceStepStickyContent(stepData) {
  activateStickyContentContainer(stepData.contentType);

  if (stepData.contentType === "image") {
    displayStickyImage(stepData);
  } else if (stepData.contentType === "map") {
    displayStickyMap(stepData.latitude, stepData.longitude, stepData.zoomLevel);
    prevStickyImage = null;
  }
}

function activateStickyContentContainer(activateContentType) {
  if (activateContentType === "image") {
    stickyImage.style.display = "flex";
    stickyMap.style.display = "none";
  } else if (activateContentType === "map") {
    stickyImage.style.display = "none";
    stickyMap.style.display = "block";
  }
}

function displayStickyImage(stepData) {
  const img = document.getElementById("the-sticky-image");

  // only replace the <img> tag if the image has changed, to avoid flickering
  if (stepData.filePath && prevStickyImage != stepData.filePath) {
    img.style.opacity = 0;

    // fade in the image after the opacity transition
    setTimeout(() => {
      // Change the image source
      img.src = stepData.filePath;
      img.alt = "TODO Have user supply the Alt Text";

      // Fade in the new image
      img.style.opacity = 1;
    }, 300); // Match the duration of the CSS transition

    //stickyImage.innerHTML = `<img src="${stepData.filePath}" alt="Image Alt Text" />`;
    prevStickyImage = stepData.filePath;
  }
  if (stepData.zoomLevel) {
    img.style.transform = `scale(${stepData.zoomLevel})`;
  }
}

/* Marks a step as active and fades in/out the content */
function activateNewStickyContent(newSrc) {
  const img = document.getElementById("myImage");

  // Fade out the current image
  img.style.opacity = 0;

  // Wait for the fade-out transition to complete
  setTimeout(() => {
    // Change the image source
    img.src = newSrc;

    // Fade in the new image
    img.style.opacity = 1;
  }, 500); // Match the duration of the CSS transition
}

function initScrollama() {
  scroller
    .setup({
      step: "#scrolly-container article .step",
      offset: 0.5, // what % from the top of the viewport the step should be considered "entered"
      debug: false,
    })
    .onStepEnter(handleStepEnter);

  // setup resize event
  window.addEventListener("resize", scroller.resize);
}
