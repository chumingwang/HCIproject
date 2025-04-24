
async function main(text) {
  console.log('ai test');
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": ``
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{
          role: "user",
          content: `Please summarize this paragraph (no more than 100 words) and extract 3 keywords in the following format:
          Abstract: [Content]
          Keywords: [Word 1, Word 2, Word 3]
          the paragraph is: ${text}` 
        }],
        temperature: 0.7,
        stream: false 
      })
    });

    const data = await response.json();
    const sidebarContent = document.getElementById('sidebar-content');
    sidebarContent.innerHTML = `<p>${data.choices[0].message.content}</p>`;
    console.log(sidebarContent);
  } catch (error) {
    console.log(`error: ${error.message}`);
  }
}

let basicStyleLink = null;
let styleLink = null;
let isReadingMode = false;

let scrollCount = 0;
let timeoutId = null;
let isListening = false;
let onSidebar = false;

let isProcessElement = false;



const transitionStyle = document.createElement('style');
transitionStyle.textContent = `
  body {
    transition: 
      color 0.3s ease,
      background-color 0.3s ease,
      border-color 0.3s ease !important;
  }
  
  .theme-aware-element {
    transition: all 0.5s ease;
  }
`;


chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'UPDATE_READING_MODE') {
    toggleReadingMode(msg.state);
  }
});

function toggleReadingMode(enable) {
  if (enable) {
    // startReadingDetection();
    const article = document.querySelector('article');
    if (!article) {
      alert('This page has no article element. No need to use this extension');
      console.log('This page has no article element');
      // main();
    } else {
      if (!styleLink) {
        styleLink = document.createElement('link');
        styleLink.id = 'reading-mode-stylesheet';
        styleLink.rel = 'stylesheet';
        styleLink.href = chrome.runtime.getURL('reading-mode.css');
        document.head.appendChild(styleLink);
        
        document.body.classList.add('reading-mode');
      }
      if (!isProcessElement) {
        document.querySelectorAll('p').forEach(processElement);
        isProcessElement = true;
      }
      createSidebar();
      addHoverEffect();
      applyBasicMode();
      startListener();
    }
  } else {
    removeReadingMode();
    stopListener();
  }
}

const handleScroll = (e) => {
  if (!this.debounce) {
    scrollCount++;
    this.debounce = setTimeout(() => {
      this.debounce = null;
    }, 100);
  }
};

function resetCounter() {
  if (isListening) {
    if (scrollCount >= 5) { // This is the number of scrolls required to trigger the swap!!!!!!!!!
      if (isReadingMode)
        applyBasicMode();
      //removeReadingMode();
    } else {
      if (!isReadingMode){
        if (!onSidebar)
          applyReadingMode();
      }
      
    }
  }
  scrollCount = 0;
  timeoutId = null;
  if (isListening)
    timeoutId = setTimeout(resetCounter, 5000);
}

function startListener() {
  if (!isListening) {
      isListening = true;
      document.addEventListener('wheel', handleScroll, { passive: true });
      timeoutId = setTimeout(resetCounter, 5000);
  }
}

function stopListener() {
  isListening = false;
  document.removeEventListener('wheel', handleScroll);
}

function applyBasicMode() {
  if (!basicStyleLink) {
    basicStyleLink = document.createElement('link');
    basicStyleLink.id = 'basic-mode-stylesheet';
    basicStyleLink.rel = 'stylesheet';
    basicStyleLink.href = chrome.runtime.getURL('basic-mode.css');
    document.head.appendChild(basicStyleLink);
    document.body.classList.add('basic-mode');
  }
  else {
    basicStyleLink.disabled = false;
    setTimeout(() => {
      styleLink.disabled = true;
    }, 300);
  }
  isReadingMode = false;
}

function applyReadingMode() {
  if (!styleLink) {
    styleLink = document.createElement('link');
    styleLink.id = 'reading-mode-stylesheet';
    styleLink.rel = 'stylesheet';
    styleLink.href = chrome.runtime.getURL('reading-mode.css');
    document.head.appendChild(styleLink);
    document.body.classList.add('reading-mode');

    // document.querySelectorAll('p, li, dd').forEach(processElement);
  }
  else {
    styleLink.disabled = false;
    // document.querySelectorAll('p, li, dd').forEach(processElement);
    setTimeout(() => {
      basicStyleLink.disabled = true;
    }, 300);
  }
  isReadingMode = true;
}

function processElement(element) {
  const textNodes = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.trim()) {
      textNodes.push(node);
    }
  }

  let totalWords = 0;
  textNodes.forEach(node => {
    totalWords += node.nodeValue.split(/\s+/).filter(w => w).length;
  });

  let globalIndex = 0;

  textNodes.forEach(node => {
    const words = node.nodeValue.split(/(\s+)/);
    const newHTML = words
      .map(word => {
        if (word.match(/^\s*$/)) return word;
        const lightness = totalWords > 1 
          ? 30 + (35 * globalIndex / (totalWords - 1))
          : 30;
        globalIndex++;
        const firstLetter = word[0];
        const rest = word.slice(firstLetter.length);
        return `<span class="bionic-word" style="--lightness: ${lightness}%"><span class="bionic-letter">${firstLetter}</span>${rest}</span>`;
      })
      .join('');

    const span = document.createElement("span");
    span.innerHTML = newHTML;
    node.parentNode.replaceChild(span, node);
  });
}

function removeReadingMode() {
  styleLink.remove();
  document.body.classList.remove('reading-mode');
  styleLink = null;
  basicStyleLink.remove();
  document.body.classList.remove('basic-mode');
  basicStyleLink = null;

  const sidebar = document.getElementById('my-sidebar');
  if (sidebar) {
    sidebar.remove();
  }
  
}

function createSidebar() {
  const sidebar = document.createElement('div');
  sidebar.id = 'my-sidebar';

  const content = document.createElement('div');
  content.id = 'sidebar-content';
  
  sidebar.appendChild(content);
  content.innerHTML = '<h1>Hover over a paragraph to see its content</h1>';
  
  document.body.appendChild(sidebar);
  sidebar.addEventListener('mouseenter', (event) => {
    onSidebar = true;
  });
  sidebar.addEventListener('mouseleave', (event) => {
    onSidebar = false;
  });
}

function updateSidebarContent(text) {
  const sidebarContent = document.getElementById('sidebar-content');
  sidebarContent.innerHTML = `<h1>Summarizing...</h1>`;
  // console.log(sidebarContent);
}

function addHoverEffect() {
  const paragraphs = document.querySelectorAll('p');
  paragraphs.forEach(paragraph => {
    paragraph.addEventListener('mouseenter', (event) => {
      const text = event.target.innerText;
      updateSidebarContent(text);
      main(text);
    });
  });
}
