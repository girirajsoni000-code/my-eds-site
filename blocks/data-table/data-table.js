export default async function decorate(block) {
  const link = block.querySelector('a[href$=".json"]');
  if (!link) return;

  const url = link.href;
  try {
    const response = await fetch(url);
    const json = await response.json();

    if (json && json.data && json.data.length > 0) {
      const table = document.createElement('table');
      table.className = 'data-table';

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

      block.innerHTML = '';
      block.appendChild(table);
    } else {
      block.innerHTML = '<p>No data found.</p>';
    }
  } catch (error) {
    console.error('Error fetching data for data-table block', error);
    block.innerHTML = '<p>Failed to load data.</p>';
  }
}
