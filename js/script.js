document.addEventListener("DOMContentLoaded", function () {
  if (typeof netlifyIdentity !== "undefined") {
    netlifyIdentity.on("init", user => {
      const hasAccess = user && user.user_metadata?.accessLevel === "premium";

      const paywallButtons = document.querySelectorAll(
        ".enroll-course-btn, .instant-access-btn, .premium-access-btn"
      );

      paywallButtons.forEach(button => {
        button.addEventListener("click", function (e) {
          if (!hasAccess) {
            e.preventDefault();
            const redirectTo = window.location.pathname;
            window.location.href = `login.html?redirectTo=${encodeURIComponent(redirectTo)}`;
          }
        });
      });

      const status = document.getElementById("access-status");
      if (status) {
        status.textContent = hasAccess
          ? "✅ You have Premium Access"
          : "🔒 Access restricted. Login or upgrade.";
      }
    });

    netlifyIdentity.init();
  }
});
