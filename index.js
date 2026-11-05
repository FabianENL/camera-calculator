
var slider;
var apertureText;
var aperture = 8;

var focusSlider;
var focusText;
var focusVal;

var focalLengthElement;
var focalLength = 50;
var hyperFocus;

const apertureHalfStops = [0.95, 1, 1.1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3.2, 3.5, 4, 4.5, 5, 5.6, 6.3, 7.1, 8, 9, 10, 11, 13, 14, 16, 18, 20, 22, 25, 29, 32, 36, 40, 45, 51, 57, 64];

const mtoft = 3.28084;

var cocBox;
const cocs = [0.065, 0.055, 0.05, 0.045, 0.03, 0.021, 0.02, 0.015, 0.011];
var coc = 0.03;

var resultBox;
var resultBoxFT;

// Logaritmische focus-slider
const focusMin = 0.1;
const focusMax = 10000;
const sliderMax = 1000;

function sliderToDistance(value) {
  const max = hyperFocus;

  if (value >= sliderMax) return Infinity;

  return focusMin * Math.pow(
      max / focusMin,
      value / sliderMax
  );
}

function distanceToSlider(distance) {
  if (!Number.isFinite(distance)) return sliderMax;

  return sliderMax * Math.log(distance / focusMin) /
      Math.log(hyperFocus / focusMin);
}

function update() {
  focalLength = Number(focalLengthElement.value);
  aperture = apertureHalfStops[slider.value];
  coc = cocs[cocBox.value];

  apertureText.innerHTML = aperture;

  // Hyperfocale afstand in mm
  var hyperfocal = (focalLength * focalLength) / (aperture * coc) + focalLength;

  hyperFocus = hyperfocal / 1000;

  // Focuswaarde ophalen met nieuwe logaritmische schaal
  focusVal = sliderToDistance(Number(focusSlider.value));

  // Focusweergave
  if (!Number.isFinite(focusVal)) {
      focusText.innerHTML = "∞";
  } else {
      focusText.innerHTML = `${focusVal.toFixed(2)}m <br>(= ${Math.round(focusVal * mtoft)}ft)`;
  }

    // DOF berekenen
    var min;
    var max;

    if (!Number.isFinite(focusVal)) {
        // Focus op oneindig
        min = hyperfocal;
        max = Infinity;
    } else {
        var focusMM = focusVal * 1000;

        min = (hyperfocal * focusMM) /
            (hyperfocal + (focusMM - focalLength));

        max = (focusMM >= hyperfocal) ? Infinity :
            (hyperfocal * focusMM) /
            (hyperfocal - (focusMM - focalLength));
    }

    // Resultaten formatteren
    var mintext = (min / 1000).toFixed(1);
    var mintextft = (mtoft * (min / 1000)).toFixed(1);

    var maxtext = Number.isFinite(max) ? (max / 1000).toFixed(1) : "∞";
    var maxtextft = Number.isFinite(max) ? (mtoft * (max / 1000)).toFixed(1) : "∞";

    resultBox.innerHTML = `${mintext}m | ${maxtext}m : hyper: ${hyperFocus.toFixed(1)}m`;

    resultBoxFT.innerHTML = `${mintextft}ft | ${maxtextft}ft : hyper: ${(mtoft * hyperFocus).toFixed(1)}ft`;
}

function setFormat() {
    update();
}

function sliderUpdate() {
    update();
}

function focalLengthChange() {
    update();
}

function focusSliderUpdate() {
    update();
}

document.addEventListener("DOMContentLoaded", function (event) {
    slider = document.getElementById("apertureSlider");
    focusSlider = document.getElementById("focusSlider");
    apertureText = document.getElementById("aperture");
    focalLengthElement = document.getElementById("focallength");
    focusText = document.getElementById("focus");
    cocBox = document.getElementById("format");
    resultBox = document.getElementById("result");
    resultBoxFT = document.getElementById("resultft");

    coc = cocs[cocBox.value];

    // Begin op 10 meter
    focusSlider.value = distanceToSlider(10);

    update();
});
