let counterDisplay = document.getElementById("counter");
let count = 0;


function increaseCounter(){
    count += 1;
    counterDisplay.innerHTML = count;
}

function resetCounter() {
    count = 0;
    counterDisplay.innerHTML = count;
}