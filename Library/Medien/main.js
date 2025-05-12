const cardGrid = document.getElementById("cardGrid");
let media = [];

document.addEventListener("DOMContentLoaded", async () => {
    showLoadingCards();
    media = await fetchMedia();
    if (media) {
        displayMedia(media);
    }
})


async function fetchMedia() {
    try {
        return await (await fetch("http://localhost:8080/api/media/all")).json();
    } catch (error) {
        openAlert("Es ist etwas schiefgelaufen", "danger", 3000);
    }
}

function displayMedia(mediaArray) {
    document.getElementById("cardGrid").style.userSelect = "auto";
    if (mediaArray) {
        console.log(mediaArray);
        cardGrid.innerHTML = "";
        mediaArray.slice().reverse().forEach(media => {
            const template = document.getElementById("mediaCardTemplate").content.cloneNode(true);
            if (media.genre) template.querySelector("#genre").textContent = media.genre;
            const titleElement = template.querySelector("#titel");
            titleElement.childNodes[0].textContent = media.title;
            if (media.fsk) template.querySelector(".fsk").textContent = "(FSK " + media.fsk + ")";
            template.querySelector("#autor").textContent = media.author;
            if (media.isbn) template.querySelector("#isbn").textContent = media.isbn;
            template.querySelector(".edit-button").addEventListener("click", () => {editMedium(media)});
            cardGrid.appendChild(template);
        })
    }
}

function addNewMedium() {
    const template = document.querySelector("#newMediumTemplate").content.cloneNode(true);
    template.querySelector("#new-object-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const response = await submitNewMedium();
        media.push(response);
        openAlert("Medium erfolgreich erstellt", "success", 2500);
        document.body.removeChild(document.querySelector(".new-object-popup"));
        displayMedia(media);
    })
    template.querySelector("button[type='button']").addEventListener("click", () => {
        document.body.removeChild(document.querySelector(".new-object-popup"));
    })
    document.body.appendChild(template);
}

async function editMedium(mediaElement) {
    const template = document.querySelector("#newMediumTemplate").content.cloneNode(true);
    template.querySelector("button[type='submit']").innerHTML = "Aktualisieren";
    template.querySelector("#newObjectTitle").value = mediaElement.title;
    template.querySelector("#newObjectAuthor").value = mediaElement.author;
    if(mediaElement.fsk) template.querySelector("#newObjectFsk").value = mediaElement.fsk;
    if(mediaElement.genre) template.querySelector("#newObjectGenre").value = mediaElement.genre;
    if(mediaElement.code) template.querySelector("#newObjectCode").value = mediaElement.code;
    if(mediaElement.isbn) template.querySelector("#newObjectIsbn").value = mediaElement.isbn;
    let data = {};

    template.querySelector("#new-object-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        data = returnMediaArray(template);
        await updateMedia(data, mediaElement);
        document.body.removeChild(document.querySelector(".new-object-popup"));
    })

    template.querySelector("button[type='button']").addEventListener("click", () => {
        document.body.removeChild(document.querySelector(".new-object-popup"));
    })

    document.body.appendChild(template);
}

async function updateMedia(data, mediaElement){
    debugger;
    try {
        data.id = mediaElement.id;
        console.log(data);
        const response = await (await fetch("http://localhost:8080/api/media", {method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data)})).json();
        let idx = media.indexOf(mediaElement);
        media.splice(idx, 1, response);
        displayMedia(media);
    } catch(error) {
        console.log(error);
        openAlert("Es ist etwas schiefgelaufen", "danger", 2000);
    }
}

async function submitNewMedium() {
    let data = returnMediaArray();
    try {
        const response = (await fetch("http://localhost:8080/api/media/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })).json();
        return response;
    } catch (error) {
        console.log(error);
        openAlert("Es ist etwas schiefgelaufen", "danger", 3000);
    }
}

function returnMediaArray() {
    const form = document;
    let data = {
        title: form.querySelector("#newObjectTitle").value,
        author: form.querySelector("#newObjectAuthor").value
    };
    let genre = form.querySelector("#newObjectGenre").value;
    if (genre) data.genre = genre;

    let fsk = form.querySelector("#newObjectFsk").value;
    if (fsk) data.fsk = fsk;

    let code = form.querySelector("#newObjectCode").value;
    if (code) data.code = code;

    let isbn = form.querySelector("#newObjectIsbn").value;
    if (isbn) data.isbn = isbn;

    return data;
}

async function searchForMedia() {
        let value = document.getElementById("searchInput").value;
        if(value.replace(/\s+/g, "") === ""){
            displayMedia(media);
        }
        try {
            const response = await (await fetch("http://localhost:8080/api/media/title/" + value)).json();
            displayMedia(response);
        } catch (error) {
            console.log(error);
            this.openAlert("Es ist ein Fehler aufgetreten", "danger", "3000");
        }
}

function showLoadingCards() {
    cardGrid.innerHTML = "";

    for (let i = 0; i < 6; i++) {
        const template = document.getElementById("skeletonLoaderCard").content.cloneNode(true);
        cardGrid.appendChild(template);
    }
}

function openAlert(message, status, duration) {
    let alertWrapper = document.querySelector(".alert-wrapper");
    alertWrapper.querySelectorAll(".alert").forEach(alert => alertWrapper.removeChild(alert));
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
    alert.querySelector("#message").textContent = message;
    alertWrapper.appendChild(alert);
    alertWrapper.style.transform = "translateY(0)";
    alertWrapper.querySelector(".close-button").addEventListener("click", closeAlert);
    setTimeout(closeAlert, duration);
}

function closeAlert() {
    let alertWrapper = document.querySelector(".alert-wrapper");
    if (alertWrapper.firstChild) {
        alertWrapper.style.transform = "translateY(100px)";
        alertWrapper.removeChild(alertWrapper.firstChild);
    }
}