let customers = {}

document.addEventListener("DOMContentLoaded", () => {
    getCustomers();
})



async function getCustomers() {
    try {
      const response = await (await fetch("http://localhost:8080/api/customers"))
    } catch (error){

    }
}