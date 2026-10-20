const passwordInput = document.querySelector("#password");
const togglePasswordButton = document.querySelector("#toggle-password");
const loginForm = document.querySelector("#login-form");
const formMessage = document.querySelector("#form-message");

togglePasswordButton.addEventListener("click", () => {
    const isPasswordHidden = passwordInput.type === "password";
    passwordInput.type = isPasswordHidden ? "text" : "password";
    togglePasswordButton.textContent = isPasswordHidden ? "Ocultar" : "Mostrar";
    togglePasswordButton.setAttribute("aria-pressed", String(isPasswordHidden));
});