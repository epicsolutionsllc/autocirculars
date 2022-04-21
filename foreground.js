window.addEventListener("load", () => {
  const fixCaps = (str) => {
    if (str) {
      let upper = true;
      let newStr = "";
      for (let i = 0, l = str.length; i < l; i++) {
        if (str[i] == " ") {
          upper = true;
          newStr += str[i];
          continue;
        }
        newStr += upper ? str[i].toUpperCase() : str[i].toLowerCase();
        upper = false;
      }
      return newStr;
    } else {
      return "";
    }
  };
  // handles beautification of currency formats
  const convertCurrency = (str) => {
    // formatted "1/2.00 or 1/.59 or 2/0.28 or 2.59/lb"
    if (str.includes("/")) {
      const split = str.split("/");
      if (Number(split[1]) < 1) {
        return `${split[0]} / ${Number(split[1]) * 100}¢`;
      } else if (split[1].toLowerCase().includes("lb")) {
        return `${split[0]} / LB`;
      } else {
        return `${split[0]} / $${split[1]}`;
      }
      // other simple formats
    } else {
      if (Number(str) < 1) {
        return `${Number(str) * 100}¢`;
      } else {
        return `$${Number(str)}`;
      }
    }
  };

  let lastDiv = null;
  let dialog = null;
  let parsedCsv, map;
  let autocomplete = document.createElement("div");
  let autoOptions = chrome.storage.local.get(
    ["parsedCsv", "currentMappings"],
    (res) => {
      parsedCsv = res.parsedCsv;
      map = res.currentMappings;
      autocomplete.classList.add("autocirculars");
    }
  );

  const fillItem = (row) => {
    const allInputs = dialog.querySelectorAll("input, textarea");
    // all of this event dispatching is to play well with React
    allInputs[0].value = fixCaps(row[3]);
    allInputs[0].dispatchEvent(new Event("input", { bubbles: true }));
    allInputs[1].value = fixCaps(row[3]);
    allInputs[1].dispatchEvent(new Event("input", { bubbles: true }));
    allInputs[2].value = convertCurrency(row[map.deal]);
    allInputs[2].dispatchEvent(new Event("input", { bubbles: true }));
    allInputs[3].value = fixCaps(row[map.cat]);
    allInputs[3].dispatchEvent(new Event("input", { bubbles: true }));
    allInputs[4].value = fixCaps(row[map.details]);
    allInputs[4].dispatchEvent(new Event("input", { bubbles: true }));
    // allow the user to split item names between the prefix and the ingredient by holding down the Control key and clicking the input
    allInputs[0].addEventListener("click", (e) => {
      if (e.ctrlKey) {
        allInputs[1].value = e.target.value
          .slice(e.target.selectionStart)
          .trim();
        allInputs[1].dispatchEvent(new Event("input", { bubbles: true }));
        e.target.value = e.target.value
          .slice(0, e.target.selectionStart)
          .trim();
        e.target.dispatchEvent(new Event("input", { bubbles: true }));
        e.target.blur();
      }
      // allow the user to quickly remove the first or last parts of a field's value by holding down the Alt key and clicking the input
      allInputs.forEach((input) => {
        input.addEventListener("click", (e) => {
          if (e.altKey && e.shiftKey) {
            e.target.value = e.target.value
              .slice(e.target.selectionStart)
              .trim();
          } else if (e.altKey) {
            e.target.value = e.target.value
              .slice(0, e.target.selectionStart)
              .trim();
          }
        });
      });
    });
  };

  const createAutocomplete = (el) => {
    if (!el.getAttribute("data-hasautocomplete")) {
      el.setAttribute("data-hasautocomplete", "true");
      el.parentElement.style.position = "relative";
      el.parentElement.appendChild(autocomplete);
      updateAutocomplete(el.value);
      dialog
        .querySelector('svg[data-icon="close-circle"]')
        .addEventListener("mouseup", () => {
          dialog = null;
          lastDiv = document.querySelector("div.ant-popover:last-of-type");
        });
      dialog
        .querySelector(".ant-btn-primary:last-of-type")
        .addEventListener("mouseup", () => {
          dialog = null;
          lastDiv = document.querySelector("div.ant-popover:last-of-type");
        });
    }
  };

  const updateAutocomplete = (query) => {
    autocomplete.innerHTML = "";
    parsedCsv.forEach((row) => {
      const ing = row[map.ing];
      if (ing.toUpperCase().includes(query.toUpperCase())) {
        let item = document.createElement("li");
        item.innerText = fixCaps(ing);
        item.addEventListener("mousedown", (e) => {
          fillItem(row);
        });
        autocomplete.appendChild(item);
      }
    });
  };

  const checkForLast = () => {
    if (lastDiv && lastDiv.id != "root") {
      dialog = lastDiv;
      const firstInput = dialog.querySelector("input");
      if (parsedCsv) {
        createAutocomplete(firstInput);
        firstInput.addEventListener("keyup", () => {
          updateAutocomplete(firstInput.value);
        });
      }
    } else {
      dialog = null;
    }
  };
  document.documentElement.addEventListener("click", () => {
    lastDiv = document.querySelector("div.ant-popover:last-of-type");
    checkForLast();
  });

  chrome.runtime.onMessage.addListener((req) => {
    chrome.storage.local.get(["parsedCsv", "currentMappings"], (res) => {
      parsedCsv = res.parsedCsv;
      map = res.currentMappings;
      autocomplete.parentElement
        .querySelector("input")
        .removeAttribute("data-hasautocomplete");
      autocomplete.parentElement.removeChild(autocomplete);
      const firstInput = dialog.querySelector("input");
      createAutocomplete(firstInput);
    });
  });
});
