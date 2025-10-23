// Access Control Logic
document.addEventListener("DOMContentLoaded", function () {
  if (typeof netlifyIdentity !== "undefined") {
    netlifyIdentity.on("init", user => {
      const premium = user && user.user_metadata?.accessLevel === "premium";
      const unlocked = user?.user_metadata?.unlockedModules || [];

      const currentTutorialId = parseInt(new URLSearchParams(window.location.search).get("tutorial"));
      const currentModuleId = parseInt(new URLSearchParams(window.location.search).get("module"));

      const isUnlocked = premium || unlocked.some(entry =>
        entry.tutorialId === currentTutorialId && entry.moduleId === currentModuleId
      );

      if (!isUnlocked) {
        const container = document.querySelector(".container");
        container.innerHTML = `
          <h1>Module Locked 🔒</h1>
          <p>You must purchase this module or upgrade to premium to access it.</p>
          <button id="unlockBtn">Unlock This Module</button>
        `;

        document.getElementById("unlockBtn").addEventListener("click", () => {
          const userId = user.id;
          fetch("/.netlify/functions/unlock-module", {
            method: "POST",
            body: JSON.stringify({
              userId,
              tutorialId: currentTutorialId,
              moduleId: currentModuleId
            })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              alert("Module unlocked! Reloading...");
              location.reload();
            } else {
              alert("Error: " + JSON.stringify(data));
            }
          });
        });
      }
    });

    netlifyIdentity.init();
  }
});
