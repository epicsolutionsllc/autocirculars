// begin variable definitions
// import CSV parsing lib
import { parse } from "./dependencies/csv.js";
// set up all needed variables
let parsedCsv;
const fakeInput = document.querySelector("#fakeInput");
const fileInput = document.querySelector("#fileInput");
const goodAlert = document.querySelector("#goodAlert");
const table = document.querySelector("#preview");
const itemDetails = document.querySelector("#itemDetails");
const tableDetails = document.querySelector("#tableDetails");
const mappingDetails = document.querySelector("#mappingDetails");
const saveMappings = document.querySelector("#saveMappings");
const deleteCsv = document.querySelector("#removeCsv");
const buttonsParent = document.querySelector("#buttons");
const truncated = document.querySelector("#truncated");
const previewRow = document.querySelector("#previewRow");
let currentRowPreview = 7;
const mappingOpts = {
  prefix: document.querySelector("#mPrefix"),
  ing: document.querySelector("#mIng"),
  deal: document.querySelector("#mDeal"),
  unit: document.querySelector("#mUnit"),
  cat: document.querySelector("#mCat"),
  details: document.querySelector("#mDetails"),
};
let currentMappings = {
  prefix: "m-please-select",
  ing: "m-please-select",
  deal: "m-please-select",
  unit: "m-please-select",
  cat: "m-please-select",
  details: "m-please-select",
};

// end variable definitions
// begin function definitions

// show alert
const showAlert = (t) => {
  if (t == "good") {
    goodAlert.style.display = "flex";
    goodAlert.classList.add("visible");
    setTimeout(() => {
      goodAlert.classList.remove("visible");
      setTimeout(() => {
        goodAlert.style.display = "none";
      }, 1000);
    }, 1000);
  } else {
    alert("Unhandled error!");
  }
};

// add event listeners to all form elements
const addMappingListeners = () => {
  Object.keys(mappingOpts).forEach((el) => {
    mappingOpts[el].addEventListener("change", () => {
      currentMappings[el] = mappingOpts[el].value;
      createItemPreview(parsedCsv[8]);
    });
  });
};

// sets whether or not a file has been opened
const hasUpload = (b) => {
  const main = document.querySelector("main");
  if (b) {
    main.classList.remove("no-file");
  } else {
    main.classList.add("no-file");
  }
};

// generate mapping options
const addMappings = (row) => {
  Object.keys(mappingOpts).forEach((el) => {
    el = mappingOpts[el]; // fix stringify by Object.keys
    el.innerText = "";
    let def = document.createElement("option");
    def.value = "m-please-select";
    def.innerText = "please select";
    el.appendChild(def);
    // loop through columns
    row.forEach((col, i) => {
      // create options for each column
      let c = document.createElement("option");
      c.value = i;
      c.innerText = `${i + 1} - ${col}`;
      el.appendChild(c);
    });
  });
};

// creates the table preview
const createTable = (data) => {
  table.innerText = ""; // reset the table
  // loop through rows
  for (let i = 0; i < 10; i++) {
    const row = data[i];
    if (i == 0) addMappings(row);
    let toAdd = "";
    // loop through columns
    for (let j = 0; j < row.length; j++) {
      // append a cell to the row
      toAdd += `<td>${row[j]}</td>`;
    }
    let tr = document.createElement("tr");
    tr.innerHTML = toAdd;
    table.appendChild(tr);
    if (data.length > 10) {
      truncated.style.display = "block";
    }
  }
  // tell the UI that the file was uploaded
  hasUpload(true);
  addMappingListeners();
  // show the options
  mappingDetails.style.display = "block";
  tableDetails.style.display = "block";
  itemDetails.style.display = "block";
  buttonsParent.style.display = "block";
};

const createItemPreview = () => {
  const row = parsedCsv[currentRowPreview - 1];
  const template = `<h3 class="item-prefix">${
    row[currentMappings.prefix]
  }</h3><h2 class="item-ing">${row[currentMappings.ing]}</h2><p>${
    row[currentMappings.deal]
  }</p>`;
  itemPreview.innerHTML = template;
};

// end function definitions
// begin event listeners

// forwards the fake input button click to the file upload
fakeInput.addEventListener("click", (e) => {
  e.preventDefault();
  fileInput.click();
});

// handles uploading a file
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  // when file is fully read
  reader.addEventListener("load", (r) => {
    const read = r.target.result;
    parse(read, (err, data) => {
      // parse the file from text to a JSON object
      if (err) {
        alert(err);
      } else {
        // create the table preview and mappings
        createTable(data);
        parsedCsv = data;
      }
    });
  });
  reader.readAsText(file);
});

// changes the currently previewed item
previewRow.addEventListener("change", () => {
  currentRowPreview = previewRow.value;
  createItemPreview();
});

// saves all cells and mappings
saveMappings.addEventListener("click", (e) => {
  e.preventDefault();
  showAlert("good");
  // save to Chrome local storage (not window.localStorage)
  chrome.storage.local.set({
    parsedCsv,
    currentMappings,
  });
  chrome.tabs.query({}, (tabs) => {
    const message = { autocircularsRefresh: true };
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, message);
    });
  });
});

// removes the currently saved CSV
deleteCsv.addEventListener("click", (e) => {
  e.preventDefault();
  showAlert("good");
  // clear all stored values
  chrome.storage.local.clear();
  // tell the UI that nothing is uploaded
  hasUpload(false);
  // hide all settings
  itemDetails.style.display = "none";
  tableDetails.style.display = "none";
  mappingDetails.style.display = "none";
  buttonsParent.style.display = "none";
});

// gets currently saved CSV when popup loads
window.addEventListener("load", () => {
  // retrieve from local Chrome storage
  chrome.storage.local.get(["parsedCsv", "currentMappings"], (res) => {
    if (res.parsedCsv) {
      parsedCsv = res.parsedCsv;
      // inform the UI that a file is uploaded
      hasUpload(true);
      // generate the preview table
      createTable(parsedCsv);
      if (res.currentMappings) {
        currentMappings = res.currentMappings;
        Object.keys(currentMappings).forEach((map) => {
          mappingOpts[map].value = currentMappings[map];
        });
        createItemPreview();
      }
    }
  });
});
