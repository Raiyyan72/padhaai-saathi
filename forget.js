console.log("🔥 FORGET PASSWORD JS LOADED");

const emailInput = document.getElementById("email");
const resetBtn = document.getElementById("resetBtn");

resetBtn.addEventListener("click", async () => {

    const email = emailInput.value.trim();

    if (!email) {
        alert("⚠️ Please enter your email.");
        return;
    }

    resetBtn.innerText = "Sending...";
    resetBtn.disabled = true;

    try {

        console.log("📧 Email:", email);
        console.log("🚀 Calling backend...");

        const response = await fetch(
            "https://padhaai-saathi.onrender.com/api/auth/forgot-password",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email
                })
            }
        );

        console.log("📡 Status:", response.status);

        const data = await response.json();

        console.log("📦 Response:", data);

        if (!response.ok) {

            alert(
                "❌ " +
                (data.message || "Server error")
            );

            resetBtn.innerText = "Send Reset Link";
            resetBtn.disabled = false;

            return;
        }

        alert("📧 Reset link sent successfully!");

        resetBtn.innerText = "Reset Link Sent";

    } catch (error) {

        console.error("🔥 ACTUAL ERROR:", error);

        alert(
            "❌ Connection Error: " +
            error.message
        );

        resetBtn.innerText = "Send Reset Link";
        resetBtn.disabled = false;
    }

});