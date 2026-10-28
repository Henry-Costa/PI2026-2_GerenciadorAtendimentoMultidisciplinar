const passwordInput = document.querySelector("#password");
const emailInput = document.querySelector("#email");
const togglePasswordButton = document.querySelector("#toggle-password");
const loginForm = document.querySelector("#login-form");
const formMessage = document.querySelector("#form-message");

emailInput.addEventListener("invalid", () => {
    if (emailInput.validity.valueMissing) {
        emailInput.setCustomValidity("Informe seu e-mail.");
    } else if (emailInput.validity.typeMismatch) {
        emailInput.setCustomValidity("Digite um e-mail válido.");
    }
});

emailInput.addEventListener("input", () => {
    emailInput.setCustomValidity("");
});

togglePasswordButton.addEventListener("click", () => {
    const isPasswordHidden = passwordInput.type === "password";
    passwordInput.type = isPasswordHidden ? "text" : "password";
    togglePasswordButton.textContent = isPasswordHidden ? "Ocultar" : "Mostrar";
    togglePasswordButton.setAttribute("aria-pressed", String(isPasswordHidden));
});

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    formMessage.textContent = "Os campos foram preenchidos, mas a autenticação ainda não está conectada.";
});