const cardGrid = document.getElementById("cardGrid");
let customers = {}

document.addEventListener("DOMContentLoaded", async () => {
    showLoadingCards();
    customers = await getCustomers();
    if (customers) {
        displayCustomers(customers);
    }
})

function showLoadingCards() {
    let cardGrid = document.getElementById("cardGrid");
    cardGrid.innerHTML = "";

    for (let i = 0; i < 6; i++) {
        const template = document.getElementById("skeletonLoaderCard").content.cloneNode(true);
        cardGrid.appendChild(template);
    }
}

function displayCustomers(customerArray) {
    if (customerArray) {
        cardGrid.innerHTML = "";
        customerArray.slice().reverse().forEach((customer, index) => {
            const template = document.getElementById("customerCardTemplate").content.cloneNode(true);
            template.querySelector("#customerId").textContent = customer.id;
            template.querySelector("#name").childNodes[0].textContent = customer.firstname + " " + customer.lastname;
            let date = new Date(customer.birthdate);
            template.querySelector("#birthdate").textContent = String(date.getDate()).padStart(2, '0') + "." + String(date.getMonth() + 1).padStart(2, '0') + "." + date.getFullYear();
            template.querySelector("#email").textContent = customer.email;
            template.querySelector("#addressWrapper #street").textContent = customer.address.address;
            template.querySelector("#addressWrapper #place").textContent = customer.address.city;
            template.querySelector("#addressWrapper #plz").textContent = customer.address.zip;
            template.querySelector("#addressWrapper").id = `addressWrapper-${index}`;
            template.querySelector("#icon").id = `icon-${index}`;
            template.querySelector("#collapse").setAttribute("data-bs-target", `#addressWrapper-${index}`);
            //TODO link machen zu allen Ausleihen mit ID oder so
            template.querySelector(`#addressWrapper-${index}`).addEventListener("show.bs.collapse", () => {
                document.querySelector(`#icon-${index}`).style.transform = "rotate(180deg)";
            })
            template.querySelector(`#addressWrapper-${index}`).addEventListener("hide.bs.collapse", () => {
                document.querySelector(`#icon-${index}`).style.transform = "rotate(0)";
            })
            template.querySelector(".edit-button").addEventListener("click", () => {
                editCustomer(customer)
            });
            template.querySelector(".delete-button").addEventListener("click", () => {
                deleteCustomer(customer);
            })
            cardGrid.appendChild(template);
        })
    }
}

async function deleteCustomer(customer) {
    if (confirm("Möchten sie den User (" + customer.id + "): " + customer.firstname + " " + customer.lastname + " endgültig löschen?")) {
        try {
            await fetch("http://localhost:8080/api/customers/delete", {method: "DELETE", headers: {id: customer.id}})
            customers.splice(customers.indexOf(customer), 1);
            displayCustomers(customers);
            openAlert("Kunde wurde gelöscht", "info", 2000);
        } catch (error) {
            openAlert("Kunde konnte nicht gelöscht werden", "warning", 2500);
        }
    }
}

async function addNewCustomer() {
    const template = document.getElementById("newCustomerTemplate").content.cloneNode(true);
    template.querySelector("#new-object-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        let data = returnFormData();
        const response = await submitNewCustomer(data);
        customers.push(response);
        openAlert("Kunde erfolgreich erfasst", "success", 2500);
        document.body.removeChild(document.querySelector(".new-object-popup"));
        displayCustomers(customers);
    })
    template.querySelector(".new-object-popup").addEventListener("click", (e) => {
        if(e.target.classList.contains("new-object-popup")) {
            document.body.removeChild(document.querySelector(".new-object-popup"));
        }
    })
    template.querySelector("button[type='button']").addEventListener("click", () => {
        document.body.removeChild(document.querySelector(".new-object-popup"));
    })
    document.body.appendChild(template);
}

async function submitNewCustomer(data) {
    try {
        return await (await fetch("http://localhost:8080/api/customers/create", {
            method: "POST", headers: {
                "Content-Type": "application/json"
            }, body: JSON.stringify(data)
        })).json();
    } catch (error) {
        openAlert("User konnte nicht erstellt werden", "danger", 3000);
    }
}

async function searchForCustomer() {
    let value = document.querySelector("#searchInput").value;

    if (value.replace(/\s+/g, "") === "") {
        displayCustomers(customers);
        return;
    }

    if (!isNaN(parseInt(value))) {
        try {
            const response = await fetch("http://localhost:8080/api/customers/id/" + value);
            let data = [];
            if (response.ok) data.push(await response.json());
            displayCustomers(data);
        } catch (error) {
            this.openAlert(error.message, "warning", "3000");
        }
    } else {
        try {
            const response = await(await fetch("http://localhost:8080/api/customers/lastname/" + value)).json();
            displayCustomers(response);
        } catch (error) {
            this.openAlert(error.message, "warning", "3000");
        }
    }
}

function returnFormData() {
    return {
        firstname: document.querySelector("#newObjectFirstname").value,
        lastname: document.querySelector("#newObjectLastname").value,
        birthdate: document.querySelector("#newObjectBirthdate").value,
        email: document.querySelector("#newObjectEmail").value,
        address: {
            address: document.querySelector("#newObjectStreet").value,
            city: document.querySelector("#newObjectCity").value,
            zip: document.querySelector("#newObjectPlz").value
        }
    };
}

function editCustomer(customer) {
    const template = document.querySelector("#newCustomerTemplate").content.cloneNode(true);
    template.querySelector("#newObjectFirstname").value = customer.firstname;
    template.querySelector("#newObjectLastname").value = customer.lastname;
    template.querySelector("#newObjectEmail").value = customer.email;
    template.querySelector("#newObjectBirthdate").value = formatDate(customer.birthdate.toString());
    template.querySelector("#newObjectStreet").value = customer.address.address;
    template.querySelector("#newObjectCity").value = customer.address.city;
    template.querySelector("#newObjectPlz").value = customer.address.zip;
    template.querySelector("button[type='submit']").textContent = "Speichern";

    template.querySelector("button[type='button']").addEventListener("click", () => {
        document.body.removeChild(document.querySelector(".new-object-popup"));
    })

    template.querySelector(".new-object-popup").addEventListener("click", (e) => {
        if(e.target.classList.contains("new-object-popup")) {
            document.body.removeChild(document.querySelector(".new-object-popup"));
        }
    })

    template.querySelector("#new-object-form").addEventListener("submit", async (e) => {
        event.preventDefault();
        let editedCustomer = await submitCustomerChanges(customer);
        customers.splice(customers.indexOf(customer), 1, editedCustomer);
        displayCustomers(customers);
        document.body.removeChild(document.querySelector(".new-object-popup"));
    })

    document.body.appendChild(template);
}

async function submitCustomerChanges(customer){
    let data = returnFormData();
    data.id = customer.id;
    try {
        const response = await (await fetch("http://localhost:8080/api/customers/update", {method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data)})).json();
        openAlert("Erfolgreich geändert", "info", 2500);
        return response;
    } catch (error) {
        openAlert(error.message, "warning", 3000);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; // Format für <input type="date">
}


async function getCustomers() {
    try {
        const response = await (await fetch("http://localhost:8080/api/customers/all")).json();
        return response;
    } catch (error) {
        openAlert("Etwas ist schiefgelaufen", "danger", 3000);
    }
}


function openAlert(message, status, duration) {
    let alertWrapper = document.querySelector(".alert-wrapper");
    document.querySelectorAll(".alert-content-wrapper").forEach(alert => alert.remove());
    let alert = document.getElementById("alert").content.cloneNode(true);
    switch (status) {
        case "danger":
            alert.querySelector(".status-icon").className = "fa-solid fa-circle-exclamation status-icon";
            alert.querySelector(".alert-content-wrapper").style.backgroundColor = "var(--bs-danger) !important";
            break;
        case "warning":
            alert.querySelector(".status-icon").className = "fa-solid fa-triangle-exclamation status-icon";
            alert.querySelector(".alert-content-wrapper").style.backgroundColor = "var(--bs-warning) !important";
            break;
        case "success":
            alert.querySelector(".status-icon").className = "fa-solid fa-check status-icon";
            alert.querySelector(".alert-content-wrapper").style.backgroundColor = "var(--bs-success) !important";
            break;
        default:
            alert.querySelector(".status-icon").className = "fa-solid fa-circle-info status-icon";
            alert.querySelector(".alert-content-wrapper").style.backgroundColor = "var(--bs-info) !important";
    }
    alert.querySelector("#message").textContent = message;
    alertWrapper.appendChild(alert);
    alertWrapper.style.transform = "translateY(0)";
    alertWrapper.querySelector(".close-button").addEventListener("click", closeAlert);
    setTimeout(closeAlert, duration);
}

function closeAlert() {
    const alertWrapper = document.querySelector(".alert-wrapper");
    const alertItem = alertWrapper.querySelector(".alert-content-wrapper");
    if (alertItem) {
        alertWrapper.style.transform = "translateY(100px)";
        alertItem.remove();
    }
}