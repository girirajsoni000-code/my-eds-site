export default async function decorate(block) {
  const form = document.createElement('form');
  form.className = 'forms-wrapper';

  const headerHtml = `
    <h2 class="title-s">Contact Us</h2>
    <p class="ge-contact-us-form-wrapper__newsletter--subheading">
      We're ready to support you in your moments that matter. For service assistance, call us.
    </p>
    <div class="phone-help-text">
      <p>Would you prefer to speak to us on the phone?</p>
      <a href="#">Need help with an existing order or product support? +</a>
    </div>
  `;
  form.innerHTML = headerHtml;

  // 1. Extract all rows
  const rows = [...block.children];

  // 2. Find any links in the block that might be external data sheets
  const dataLinks = [...block.querySelectorAll('a')];
  const fetchedDataLists = [];

  // Fetch all external sheets concurrently
  await Promise.all(dataLinks.map(async (link) => {
    let url = link.href;
    const text = link.textContent.trim();
    if (!url.endsWith('.json') && text.endsWith('.json')) {
      url = text;
    }

    try {
      const urlObj = new URL(url);
      if (urlObj.pathname.endsWith('.json')) {
        // Keep the search parameters (like ?sheet=name)
        url = urlObj.pathname + urlObj.search;
      }
    } catch (e) {
      // ignore parsing errors
    }

    const fetchAndStore = async (fetchUrl) => {
      try {
        const response = await fetch(fetchUrl);
        if (!response.ok) return;
        const json = await response.json();
        
        // eslint-disable-next-line no-console
        console.log(`[forms.js] Successfully fetched data from ${fetchUrl}:`, json);

        // Handle multisheet JSON where the root object has keys for each sheet
        if (json && !json.data) {
          Object.keys(json).forEach(key => {
            if (json[key] && json[key].data) {
              fetchedDataLists.push(json[key].data);
            }
          });
        }
        
        // Handle standard JSON response
        if (json && json.data) {
          fetchedDataLists.push(json.data);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error fetching external form data from ${fetchUrl}`, error);
      }
    };

    // Fetch the base URL provided by the user
    await fetchAndStore(url);

    // Also explicitly fetch the 'reference' tab for the cascading dropdown master data
    if (!url.includes('sheet=reference')) {
      const refUrl = url.includes('?') ? `${url}&sheet=reference` : `${url}?sheet=reference`;
      await fetchAndStore(refUrl);
    }
  }));

  // 3. Helper to find options from fetched JSONs based on the field name
  const findOptionsForField = (fieldName) => {
    let options = [];
    for (const dataList of fetchedDataLists) {
      if (dataList.length === 0) continue;
      const matchingKey = Object.keys(dataList[0]).find(k => k.toLowerCase() === fieldName.toLowerCase());
      if (matchingKey) {
        options = dataList.map(row => row[matchingKey]).filter(val => val);
        break;
      }

      if (Object.keys(dataList[0]).length === 1) {
        const onlyKey = Object.keys(dataList[0])[0];
        options = dataList.map(row => row[onlyKey]).filter(val => val);
        break;
      }
    }
    // Return unique options
    return [...new Set(options)];
  };

  const selectElements = {};

  // 4. Build the form fields from the rows
  rows.forEach((row) => {
    // If the row just contains a link, we skip generating an input for it
    if (row.querySelector('a') && row.textContent.trim() === row.querySelector('a').textContent.trim()) {
      return;
    }

    const cols = [...row.children];
    const labelText = cols[0] ? cols[0].textContent.trim() : row.textContent.trim();
    if (!labelText) return;

    const fieldId = labelText.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const fieldWrapper = document.createElement('div');
    fieldWrapper.className = `form-group ${fieldId}`;

    const label = document.createElement('label');
    label.htmlFor = fieldId;
    label.textContent = labelText;
    
    // Default label rendering
    if (!fieldId.includes('updates') && !fieldId.includes('help')) {
      fieldWrapper.appendChild(label);
    }

    const optionsText = cols[1] ? cols[1].textContent.trim() : '';
    let input;

    const fetchedOptions = findOptionsForField(labelText);
    const isDropdown = optionsText || fetchedOptions.length > 0 || ['country', 'state', 'city'].includes(fieldId);

    if (fieldId.includes('help') && optionsText) {
      // Render as toggle buttons
      input = document.createElement('input');
      input.type = 'hidden';
      input.id = fieldId;
      input.name = fieldId;

      const buttonGroup = document.createElement('div');
      buttonGroup.className = 'button-group';
      
      const options = optionsText.split(',').map(opt => opt.trim());
      options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'help-btn';
        if (index === 0) {
          btn.classList.add('active');
          input.value = opt;
        }
        btn.textContent = opt;
        btn.addEventListener('click', () => {
          buttonGroup.querySelectorAll('.help-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          input.value = opt;
        });
        buttonGroup.appendChild(btn);
      });
      
      const title = document.createElement('p');
      title.className = 'section-title';
      title.textContent = labelText;
      fieldWrapper.appendChild(title);
      fieldWrapper.appendChild(buttonGroup);
      fieldWrapper.appendChild(input);

    } else if (isDropdown) {
      input = document.createElement('select');
      selectElements[fieldId] = input;

      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = `Select ${labelText}...`;
      input.appendChild(defaultOption);

      let finalOptions = [];
      if (fetchedOptions.length > 0) {
        finalOptions = fetchedOptions;
      } else if (optionsText) {
        finalOptions = optionsText.split(',').map(opt => opt.trim());
      } else {
        if (fieldId === 'country') finalOptions = ['United States', 'Canada', 'United Kingdom', 'Australia', 'India'];
        if (fieldId === 'state') finalOptions = ['California', 'New York', 'Texas', 'Ontario', 'London'];
        if (fieldId === 'city') finalOptions = ['Los Angeles', 'New York City', 'Austin', 'Toronto', 'London'];
      }

      finalOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.toLowerCase().replace(/[^a-z0-9]/g, '-');
        option.textContent = opt;
        input.appendChild(option);
      });
      input.id = fieldId;
      input.name = fieldId;
      input.required = true;
      fieldWrapper.appendChild(input);

    } else if (fieldId.includes('address') || fieldId.includes('message') || fieldId.includes('remarks')) {
      input = document.createElement('textarea');
      input.rows = 4;
      input.placeholder = `I'd like a Price Quote on...`;
      input.id = fieldId;
      input.name = fieldId;
      input.required = true;
      fieldWrapper.appendChild(input);
      
    } else if (fieldId.includes('email')) {
      input = document.createElement('input');
      input.type = 'email';
      input.id = fieldId;
      input.name = fieldId;
      input.required = true;
      fieldWrapper.appendChild(input);
      
    } else if (fieldId.includes('updates')) {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.id = fieldId;
      input.name = fieldId;
      fieldWrapper.appendChild(input);
      fieldWrapper.appendChild(label); // Label goes after checkbox
      
    } else {
      input = document.createElement('input');
      input.type = fieldId.includes('phone') ? 'tel' : 'text';
      input.id = fieldId;
      input.name = fieldId;
      input.required = !fieldId.includes('zip') && !fieldId.includes('phone');
      fieldWrapper.appendChild(input);
    }

    form.appendChild(fieldWrapper);
  });

  // 5. Implementing Cascading Dropdowns Logic
  // Look for the dataset that contains Country, State, City (or at least two of them)
  let cascadingData = null;
  for (const dataList of fetchedDataLists) {
    if (dataList.length === 0) continue;
    const keys = Object.keys(dataList[0]).map(k => k.toLowerCase());
    if (keys.includes('country') && keys.includes('state')) {
      cascadingData = dataList;
      break;
    }
  }

  if (cascadingData) {
    const keys = Object.keys(cascadingData[0]);
    const countryKey = keys.find(k => k.toLowerCase() === 'country');
    const stateKey = keys.find(k => k.toLowerCase() === 'state');
    const cityKey = keys.find(k => k.toLowerCase() === 'city');

    const countrySelect = selectElements['country'];
    const stateSelect = selectElements['state'];
    const citySelect = selectElements['city'];

    // Helper to populate a select element
    const populateSelect = (selectEl, options, placeholderText) => {
      if (!selectEl) return;
      selectEl.innerHTML = '';
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = placeholderText;
      selectEl.appendChild(defaultOption);

      options.forEach(opt => {
        if (!opt) return;
        const option = document.createElement('option');
        option.value = opt.toLowerCase().replace(/[^a-z0-9]/g, '-');
        option.textContent = opt;
        selectEl.appendChild(option);
      });
    };

    if (countrySelect && countryKey) {
      // Initial population of Country
      const uniqueCountries = [...new Set(cascadingData.map(row => row[countryKey]))].filter(Boolean);
      populateSelect(countrySelect, uniqueCountries, 'Select Country...');

      // Disable State and City initially
      if (stateSelect) {
        stateSelect.disabled = true;
        populateSelect(stateSelect, [], 'Select State...');
      }
      if (citySelect) {
        citySelect.disabled = true;
        populateSelect(citySelect, [], 'Select City...');
      }

      // Country Change Event
      countrySelect.addEventListener('change', () => {
        const selectedCountry = countrySelect.options[countrySelect.selectedIndex].text;

        if (stateSelect && stateKey) {
          if (!countrySelect.value) {
            stateSelect.disabled = true;
            populateSelect(stateSelect, [], 'Select State...');
            if (citySelect) {
              citySelect.disabled = true;
              populateSelect(citySelect, [], 'Select City...');
            }
            return;
          }

          stateSelect.disabled = false;
          const filteredStates = [...new Set(cascadingData
            .filter(row => row[countryKey] === selectedCountry)
            .map(row => row[stateKey]))].filter(Boolean);

          populateSelect(stateSelect, filteredStates, 'Select State...');

          if (citySelect) {
            citySelect.disabled = true;
            populateSelect(citySelect, [], 'Select City...');
          }
        }
      });

      // State Change Event
      if (stateSelect && stateKey && citySelect && cityKey) {
        stateSelect.addEventListener('change', () => {
          const selectedCountry = countrySelect.options[countrySelect.selectedIndex].text;
          const selectedState = stateSelect.options[stateSelect.selectedIndex].text;

          if (!stateSelect.value) {
            citySelect.disabled = true;
            populateSelect(citySelect, [], 'Select City...');
            return;
          }

          citySelect.disabled = false;
          const filteredCities = [...new Set(cascadingData
            .filter(row => row[countryKey] === selectedCountry && row[stateKey] === selectedState)
            .map(row => row[cityKey]))].filter(Boolean);

          populateSelect(citySelect, filteredCities, 'Select City...');
        });
      }
    }
  }

  // Clear the block before appending the new form
  block.innerHTML = '';

  const submitWrapper = document.createElement('div');
  submitWrapper.className = 'form-submit-wrapper';

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'button primary';
  submitBtn.textContent = 'Submit';
  submitWrapper.appendChild(submitBtn);

  form.appendChild(submitWrapper);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Form submitted', form);

    // Extract values
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    console.log('Form Data JSON:', data);

    const successMsg = document.createElement('p');
    successMsg.className = 'form-success-message';
    successMsg.textContent = 'Thank you for your submission!';
    form.replaceWith(successMsg);
  });

  block.appendChild(form);
}
