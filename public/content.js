// content.js (overwrite existing content.js that your manifest references)
(function(){
  console.log("[GFF] content script loaded");

  function normalize(s=''){ return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,''); }

  // Try to set React-controlled input safely
  function setReactValue(el, value) {
    try {
      // try native setter on prototype first
      const proto = Object.getPrototypeOf(el);
      const desc = Object.getOwnPropertyDescriptor(proto, 'value');
      if (desc && desc.set) {
        desc.set.call(el, value);
      } else {
        el.value = value;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch (e) {
      console.warn('[GFF] setReactValue error', e);
      try {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      } catch(e2) {
        console.warn('[GFF] fallback set value failed', e2);
        return false;
      }
      return true;
    }
  }

  async function simulateTyping(el, text, delay=35) {
    try {
      el.focus();
      if (el.isContentEditable) {
        el.innerText = "";
        for (const ch of text) {
          el.innerText += ch;
          el.dispatchEvent(new InputEvent('input', { bubbles: true }));
          await new Promise(r => setTimeout(r, delay));
        }
      } else {
        // for inputs: progressively set value via React setter
        for (let i=0;i<text.length;i++){
          const partial = text.slice(0,i+1);
          setReactValue(el, partial);
          await new Promise(r => setTimeout(r, delay));
        }
      }
      return true;
    } catch (e) {
      console.warn('[GFF] simulateTyping failed', e);
      return false;
    }
  }

  // core fill routine
  async function doFill(profile) {
    console.log("[GFF] doFill profile:", profile);
    if (!profile || Object.keys(profile).length === 0) {
      console.log("[GFF] no profile data");
      alert("No saved profile to fill.");
      return;
    }

    // question wrappers commonly used by Google Forms
    const wrappers = document.querySelectorAll('.Qr7Oae, .freebirdFormviewerViewItemsItemItem, [role="listitem"]');
    if (!wrappers || wrappers.length === 0) {
      // as fallback, attempt to find label spans directly
      const fallback = Array.from(document.querySelectorAll('.M7eMe'));
      if (!fallback.length) {
        console.log("[GFF] no question wrappers found");
        alert("Could not find form fields on this page.");
        return;
      }
    }

    const qs = document.querySelectorAll('.Qr7Oae, .freebirdFormviewerViewItemsItemItem, [role="listitem"]');
    let filled = 0;
    for (const q of qs) {
      // label element (question title)
      const labelEl = q.querySelector('.M7eMe, .freebirdFormviewerComponentsQuestionBaseTitle') || null;
      const label = labelEl ? (labelEl.innerText || '').trim() : (q.innerText||'').split('\n')[0];
      const nid = normalize(label);

      // find the entry element: prefer inputs, then contenteditable divs
      let entry = q.querySelector('input.whsOnd, textarea.whsOnd, input[type="text"], input[type="email"]') ||
                  q.querySelector("div[contenteditable='true'], textarea");

      if (!entry) {
        console.log("[GFF] no input entry found for label:", label);
        continue;
      }

      // determine which profile field to use
      let value = "";
      if (nid.includes("name") || nid.includes("fullname") || nid.includes("yourname")) value = profile.name || profile.fullname || "";
      else if (nid.includes("roll") || nid.includes("studentid") || nid.includes("registration")) value = profile.roll || profile.studentid || "";
      else if (nid.includes("email") || nid.includes("e-mail")) value = profile.email || "";
      else if (nid.includes("phone") || nid.includes("mobile")) value = profile.phone || "";
      else if (nid.includes("department") || nid.includes("dept")) value = profile.department || "";

      // last resort: try to match any saved key names
      if (!value) {
        for (const key of Object.keys(profile)) {
          if (nid.includes(normalize(key))) { value = profile[key]; break; }
        }
      }

      if (!value) {
        console.log("[GFF] skipping (no match) label:", label);
        continue;
      }

      // fill depending on element type
      if (entry.tagName.toLowerCase() === "div" && entry.isContentEditable) {
        entry.focus();
        // set innerText + input event
        entry.innerText = value;
        entry.dispatchEvent(new InputEvent('input', { bubbles: true }));
        entry.dispatchEvent(new Event('change', { bubbles: true }));
        console.log("[GFF] filled contenteditable:", label, value);
        filled++;
      } else {
        // try React-aware setter
        const ok = setReactValue(entry, value);
        if (!ok) {
          // fallback: simulate typing
          await simulateTyping(entry, value, 40);
        }
        console.log("[GFF] filled input:", label, value);
        filled++;
      }
    }

    console.log(`[GFF] finished, fields filled: ${filled}`);
    alert(`Form auto-fill complete ✅ (${filled} fields filled)`);
  }

  // Listen for popup message
  chrome.runtime.onMessage.addListener((msg, sender, resp) => {
    if (msg && msg.action === "fillForm") {
      if (msg.profile) {
        doFill(msg.profile);
      } else {
        // fallback read from storage
        chrome.storage.local.get(['profile'], ({profile}) => {
          doFill(profile||{});
        });
      }
    }
  });

  console.log("[GFF] content script ready");
})();
