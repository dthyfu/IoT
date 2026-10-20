
const API_BASE_URL = "http://localhost:8080/api";

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");
const togglePassword = document.getElementById("togglePassword");

// Hiện hoặc ẩn mật khẩu

togglePassword.addEventListener("click", function () {
    const showPassword = passwordInput.type === "password";

    passwordInput.type = showPassword ? "text" : "password";

    togglePassword.setAttribute(
        "aria-label",
        showPassword ? "Hide password" : "Show password"
    );

    togglePassword.setAttribute(
        "aria-pressed",
        String(showPassword)
    );

    const eyeIcon = document.getElementById("eyeIcon");

    eyeIcon.innerHTML = showPassword
        ? `
            <path d="M3 3l18 18"/>
            <path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a16 16 0 0 1-4 4.7"/>
            <path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7c1.6 0 3-.4 4.2-1"/>
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>
          `
        : `
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/>
            <circle cx="12" cy="12" r="3"/>
          `;
});


// Gửi thông tin đăng nhập đến Spring Boot
loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    loginMessage.textContent = "";
    loginMessage.className = "login-message";
    loginButton.disabled = true;
    loginButton.textContent = "LOGGING IN...";

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Invalid username or password"
            );
        }

        // Lưu thông tin cơ bản của tài khoản trên trình duyệt
        sessionStorage.setItem("loggedInUser", JSON.stringify({
            id: result.id,
            username: result.username,
            fullName: result.fullName,
            email: result.email
        }));

        loginMessage.textContent = "Logged in successfully!";
        loginMessage.classList.add("success");

        // Chuyển đến Dashboard
        window.location.href = "dashboard.html";

    } catch (error) {
        loginMessage.textContent =
            error instanceof TypeError
                ? "Can not connect to server. Please check backend and CORS."
                : error.message;

        loginMessage.classList.add("error");
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "LOG IN";
    }
});
