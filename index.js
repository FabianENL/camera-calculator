var slider;
var apertureText;

var aperture = 8;

const apertureHalfStops = [0.95,1,1.1,1.2,1.4,1.6,1.8,2,2.2,2.5,2.8,3.2,3.5,4,4.5,5,5.6,6.3,7.1,8,9,10,11,13,14,16,18,20,22,25,29,32,36,40,45,51,57,64];

function sliderUpdate() {
  aperture = apertureHalfStops[slider.value];
  apertureText.innerHTML = aperture;
} 

document.addEventListener("DOMContentLoaded", function(event) { 
  slider = document.getElementById("apertureSlider")
  apertureText = document.getElementById("aperture");
});
