chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "fillForm") {
    const profile = msg.profile || {};

    // Select editable fields (Google Forms)
    const fields = document.querySelectorAll('div[contenteditable="true"]');

    fields.forEach((field) => {
      const label = field.closest("div[role='listitem']")
        ?.querySelector("div[role='heading']")?.innerText?.toLowerCase() || "";

      let value = "";
      if (label.includes("name")) value = profile.name || "";
      else if (label.includes("roll")) value = profile.roll || "";
      else if (label.includes("email")) value = profile.email || "";
      else if (label.includes("phone")) value = profile.phone || "";
      else if (label.includes("department")) value = profile.department || "";

      if (value) {
        field.innerText = "";
        value.split("").forEach((char, i) => {
          setTimeout(() => {
            field.innerText += char;
            field.dispatchEvent(new InputEvent("input", { bubbles: true }));
          }, 50 * i);
        });
      }
    });

    alert("Form auto-fill complete ✅");
  }
});
