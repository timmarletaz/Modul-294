let from = document.getElementById("selectFrom");
let to = document.getElementById("selectTo");
let inputField = document.getElementById("inputField");
let outputField = document.getElementById("outputField");

window.addEventListener("DOMContentLoaded", () => {
   change();
})

function convert() {
    if(!isNaN(Number(inputField.value)) && inputField.value.replace(/\s/g,'') !== ""){
        if(from.options[0].selected){
            value = inputField.value * 0.621371;
            outputField.setAttribute("placeholder", value);
        }else{
            value = inputField.value * 1.60934;
            outputField.setAttribute("placeholder", value);
        }
    }
}

function change() {
    if(from.options[0].selected){
        to.options[1].selected = true;
    }else{
        to.options[0].selected = true;
    }
    convert();
}