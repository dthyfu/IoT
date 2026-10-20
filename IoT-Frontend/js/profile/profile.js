
const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", function () {
        const confirmed = window.confirm("Are you sure you want to log out?");

        if (!confirmed) return;

        sessionStorage.removeItem("loggedInUser");
        window.location.href = "login.html";
    });
}
