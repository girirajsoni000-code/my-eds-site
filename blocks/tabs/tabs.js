import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const tabsList = document.createElement('div');
  tabsList.classList.add('tabs-list');
  const tabsContent = document.createElement('div');
  tabsContent.classList.add('tabs-content');

  const rows = [...block.children];
  
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const [titleEl, contentEl] = row.children;
    
    // Create Tab Button
    const tabBtn = document.createElement('button');
    tabBtn.classList.add('tab-btn');
    tabBtn.innerHTML = titleEl.innerHTML;
    
    // Create Tab Panel
    const tabPanel = document.createElement('div');
    tabPanel.classList.add('tab-panel');
    
    // Check if content is a fragment link
    const link = contentEl.querySelector('a');
    let isFragment = false;
    let fragmentPath = '';
    
    if (link) {
      try {
        const url = new URL(link.href);
        if (url.pathname === new URL(link.textContent).pathname || link.textContent.includes(url.pathname)) {
          isFragment = true;
          fragmentPath = url.pathname;
        }
      } catch (e) {
        // Not a valid URL, ignore
      }
    }

    if (isFragment) {
      // It's a fragment link, load the content dynamically
      const fragment = await loadFragment(fragmentPath);
      if (fragment) {
        tabPanel.replaceChildren(...fragment.childNodes);
      }
    } else {
      // It's just regular content (text, images, etc.)
      tabPanel.innerHTML = contentEl.innerHTML;
    }

    // Handle Tab Clicks
    tabBtn.addEventListener('click', () => {
      // Remove active from all tabs and panels
      tabsList.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
      tabsContent.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
      
      // Set current tab and panel as active
      tabBtn.classList.add('active');
      tabPanel.classList.add('active');
    });

    // Set the first tab as active by default
    if (i === 0) {
      tabBtn.classList.add('active');
      tabPanel.classList.add('active');
    }

    tabsList.append(tabBtn);
    tabsContent.append(tabPanel);
  }

  block.textContent = '';
  block.append(tabsList, tabsContent);
}
