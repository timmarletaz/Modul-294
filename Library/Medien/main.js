const cardGrid = document.getElementById("cardGrid");
let media = [];

document.addEventListener("DOMContentLoaded", async () => {
    showLoadingCards();
    media = await fetchMedia();
    console.log(media);
    displayMedia(media);
})


async function fetchMedia() {
    try {
        return await (await fetch("http://localhost:8080/api/media/all")).json();
    } catch (error) {
        openAlert("Es ist etwas schiefgelaufen", "danger", 3000);
    }
}

function displayMedia(media) {
    document.getElementById("cardGrid").style.userSelect = "auto";
    if (media) {
        cardGrid.innerHTML = "";
        media.forEach(media => {
            const template = document.getElementById("mediaCardTemplate").content.cloneNode(true);
            if(media.genre) template.querySelector("#genre").textContent = media.genre;

            template.querySelector("#titel").textContent = media.title;
            template.querySelector("#autor").textContent = media.author;
            if(media.fsk) template.querySelector("#fsk").textContent = media.fsk;
            if(media.isbn) template.querySelector("#isbn").textContent = media.isbn;
            let availability = template.querySelector("#availability");
            //TODO check if the media thing is borrowed
            cardGrid.appendChild(template);
        })
    }
}

function addNewMedium() {
    //TODO
}

function searchForMedia() {
    let value = document.getElementById("searchInput").value;
    console.log(value);
    let filteredList = media.filter(object => object.title.includes(value) || object.author.includes(value));
    console.log(filteredList);
    displayMedia(filteredList);
}

function showLoadingCards() {
    cardGrid.innerHTML = "";

    for(let i = 0; i<6; i++){
        const template = document.getElementById("skeletonLoaderCard").content.cloneNode(true);
        cardGrid.appendChild(template);
    }
}

function openAlert(message, status, duration) {
    let alert = document.getElementById("alert").content.cloneNode(true);
    switch (status) {
        case "danger":
            alert.querySelector(".status-icon").className = "fa-solid fa-circle-exclamation status-icon";
            alert.querySelector("#alertContentWrapper").style.backgroundColor = "var(--bs-danger) !important";
            break;
        case "warning":
            alert.querySelector(".status-icon").className = "fa-solid fa-triangle-exclamation status-icon";
            alert.querySelector("#alertContentWrapper").style.backgroundColor = "var(--bs-warning) !important";
            break;
        case "success":
            alert.querySelector(".status-icon").className = "fa-solid fa-check status-icon";
            alert.querySelector("#alertContentWrapper").style.backgroundColor = "var(--bs-success) !important";
            break;
        default:
            alert.querySelector(".status-icon").className = "fa-solid fa-circle-info status-icon";
            alert.querySelector("#alertContentWrapper").style.backgroundColor = "var(--bs-info) !important";
    }
    let alertWrapper = document.querySelector(".alert-wrapper");
    alert.querySelector("#message").textContent = message;
    alertWrapper.appendChild(alert);
    alertWrapper.style.transform = "translateY(0)";
    alertWrapper.querySelector(".close-button").addEventListener("click", closeAlert);
    setTimeout(closeAlert, duration);
}

function closeAlert() {
    let alertWrapper = document.querySelector(".alert-wrapper");
    if(alertWrapper.firstChild){
        alertWrapper.style.transform = "translateY(100px)";
        alertWrapper.removeChild(alertWrapper.firstChild);
    }
}