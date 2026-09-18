export default function decorate(block) {
  const main = block.closest('main');
  
  // 1. Re-structure the page to create a 2-column layout
  // We wrap the sidebar in one div, and ALL the other content in another div
  const sidebarNavWrapper = document.createElement('div');
  sidebarNavWrapper.classList.add('sidebar-nav-wrapper');
  
  const contentWrapper = document.createElement('div');
  contentWrapper.classList.add('sidebar-nav-content');
  
  // Move all sections into the content wrapper
  [...main.children].forEach((child) => {
    // Don't move the section that contains the block just yet
    // Actually, in Edge Delivery, the block is inside a section. 
    // We should move everything into the contentWrapper.
    contentWrapper.append(child);
  });
  
  // Append our wrappers to main
  main.append(sidebarNavWrapper, contentWrapper);
  main.classList.add('has-sidebar-nav');
  
  // Move the block itself into the sidebar wrapper
  sidebarNavWrapper.append(block);

  // 2. Build the Navigation list
  const navList = document.createElement('ul');
  navList.classList.add('sidebar-nav-list');
  
  // Find all H2 headings in the content
  const headings = contentWrapper.querySelectorAll('h2');
  
  headings.forEach((h2, index) => {
    // Give the heading an ID if it doesn't have one so we can jump to it
    if (!h2.id) {
      h2.id = `heading-${index}`;
    }
    
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.classList.add('sidebar-nav-btn');
    btn.textContent = h2.textContent;
    
    // Scroll to heading on click
    btn.addEventListener('click', () => {
      // Offset for the sticky header if you have one
      const offset = 80; 
      const top = h2.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
    
    li.append(btn);
    navList.append(li);
  });

  // Clear any default content from the block and add our list
  block.textContent = '';
  block.append(navList);

  // 3. Highlight the active section as you scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Remove active class from all buttons
        navList.querySelectorAll('.sidebar-nav-btn').forEach((btn) => btn.classList.remove('active'));
        
        // Find which button matches this heading
        const index = Array.from(headings).indexOf(entry.target);
        if (index >= 0) {
          navList.children[index].querySelector('.sidebar-nav-btn').classList.add('active');
        }
      }
    });
  }, { rootMargin: '-100px 0px -60% 0px' });

  // Start observing all headings
  headings.forEach((h2) => observer.observe(h2));
  
  // Set first item active by default on load
  if (navList.children.length > 0) {
    navList.children[0].querySelector('.sidebar-nav-btn').classList.add('active');
  }
}
