function execute() {
    let count = 0;
    let arr = document.querySelectorAll(".delete");
    for (let i = 0; i < document.querySelectorAll(".delete").length; i++) {
        if (arr[i].checked === true) {
            count = count + 1;
        }
    }
    if (count > 0) {
        document.getElementById("myForm").submit();
    } else {
        window.alert("select atleast one checkbox to delete")
    }
}
document.querySelector(".show").addEventListener("click", execute);
let a = document.querySelectorAll(".delete");

for (let i = 0; i < a.length; i++) {

    a[i].addEventListener("click", strikeoff);
}

function strikeoff() {


    if (this.checked === true) {

        document.getElementById(this.value).innerHTML = "<s>" + document.getElementById(this.value).innerHTML + "</s>";
    } else {
        document.getElementById(this.value).innerHTML = document.getElementById(this.value).innerText;
    }
}
let voices = null;
$(document).ready(function() {
    // Browser support messages. (You might need Chrome 33.0 Beta)
    if (!('speechSynthesis' in window)) {
        alert("You don't have speechSynthesis");
    }

    window.speechSynthesis.onvoiceschanged = function() {
        voices = window.speechSynthesis.getVoices();

    };

});
var currentdate = new Date();
let period = null;
let hour = currentdate.getHours();

if (hour < 12 && hour >= 5) {
    period = "morning";
}
if (hour < 17 && hour >= 12) {
    period = "afternoon";
}
if (hour < 21 && hour >= 17) {
    period = "evening";
}
if ((hour <= 24 && hour >= 21) || hour < 5) {
    period = "night";
}

document.querySelector(".speech").addEventListener("click", function() {

    var speakObj = new SpeechSynthesisUtterance();

    speakObj.text = "hi   " + user + "        " + "Good" + " " + period + "     " + " Hit  plus  to  add  and  minus  to  delete";
    speakObj.voice = voices.filter(function(voice) {

        return voice.name == "Google UK English Female";

    })[0];
    speakObj.rate = 0.85;
    window.speechSynthesis.speak(speakObj);

});