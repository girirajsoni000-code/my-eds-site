export default async function decorate(block) {
  const link = block.querySelector('a');
  if (!link) return;

  // The author might paste the Google Sheet link which has a .json text content,
  // or they might paste the direct .json link.
  let url = link.href;
  const text = link.textContent.trim();
  if (!url.endsWith('.json') && text.endsWith('.json')) {
    url = text;
  }

  // Convert to relative path to ensure it works across localhost, .page, and .live
  try {
    const urlObj = new URL(url);
    if (urlObj.pathname.endsWith('.json')) {
      url = urlObj.pathname;
    }
  } catch (e) {
    // ignore
  }

  // Clear the block immediately so we can build our UI
  block.innerHTML = '';

  // Create Dropdown wrapper
  const controls = document.createElement('div');
  controls.className = 'table-controls';
  
  const select = document.createElement('select');
  select.className = 'table-sheet-selector';
  
  const optDefault = document.createElement('option');
  optDefault.value = 'default';
  optDefault.textContent = 'Default';
  select.appendChild(optDefault);

  const optAsia = document.createElement('option');
  optAsia.value = 'asia';
  optAsia.textContent = 'Asia';
  select.appendChild(optAsia);

  controls.appendChild(select);
  block.appendChild(controls);

  // Create Table container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'table-container';
  block.appendChild(tableContainer);

  const fetchAndRenderTable = async (sheetName) => {
    tableContainer.innerHTML = '<p style="padding: 1rem;">Loading...</p>';
    
    let fetchUrl = url;
    if (sheetName && sheetName !== 'default') {
      fetchUrl = `${url}?sheet=${sheetName}`;
    }

    try {
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const json = await response.json();

      if (json && json.data && json.data.length > 0) {
        const table = document.createElement('table');

        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = Object.keys(json.data[0]);
        headers.forEach((headerText) => {
          const th = document.createElement('th');
          th.textContent = headerText;
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create body
        const tbody = document.createElement('tbody');
        json.data.forEach((row) => {
          const tr = document.createElement('tr');
          headers.forEach((header) => {
            const td = document.createElement('td');
            td.textContent = row[header];
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        tableContainer.innerHTML = '';
        tableContainer.appendChild(table);
      } else {
        tableContainer.innerHTML = '<p style="padding: 1rem;">No data found.</p>';
      }
    } catch (error) {
      console.error('Error fetching data for table block', error);
      tableContainer.innerHTML = '<p style="padding: 1rem;">Failed to load data.</p>';
    }
  };

  // Add event listener to dropdown
  select.addEventListener('change', (e) => {
    fetchAndRenderTable(e.target.value);
  });

  // Initial load
  fetchAndRenderTable('default');
}
