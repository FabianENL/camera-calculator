var slider;
var apertureText;
var aperture = 8;

var focusSlider;
var focusText;
var focusVal;

var focalLengthElement;
var focalLength = 50;

const apertureHalfStops = [0.95,1,1.1,1.2,1.4,1.6,1.8,2,2.2,2.5,2.8,3.2,3.5,4,4.5,5,5.6,6.3,7.1,8,9,10,11,13,14,16,18,20,22,25,29,32,36,40,45,51,57,64];

function sliderUpdate() {
  aperture = apertureHalfStops[slider.value];
  apertureText.innerHTML = aperture;
} 

function focalLengthChange(){
  focalLength = focalLengthElement.value;
  focusSlider.max = ((focalLength * 400) / 1000) + 0.1;
}

function focusSliderUpdate(){
  focusVal = focusSlider.value;
  
  if(focusVal == (focusSlider.max)){
    focusText.innerHTML = "∞";
  } else{
    focusText.innerHTML = focusVal;
  }
  console.log(focusSlider.value);
}

document.addEventListener("DOMContentLoaded", function(event) { 
  slider = document.getElementById("apertureSlider")
  focusSlider = document.getElementById("focusSlider")
  apertureText = document.getElementById("aperture");
  focalLengthElement = document.getElementById("focallength");
  focusText = document.getElementById("focus");
});
