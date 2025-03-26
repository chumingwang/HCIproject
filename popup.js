
const toggleBtn = document.getElementById('toggleBtn');
chrome.storage.sync.get(['isReadingMode'], (result) => {
  if (result.isReadingMode === undefined) {
    chrome.storage.sync.set({ isReadingMode: false });
  }
  updateButtonState(result.isReadingMode || false);
});

toggleBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ 
    active: true, 
    currentWindow: true 
  });

  const { isReadingMode } = await chrome.storage.sync.get('isReadingMode');
  const newState = !isReadingMode;

  await chrome.storage.sync.set({ isReadingMode: newState });
  
  chrome.tabs.sendMessage(tab.id, { 
    action: 'UPDATE_READING_MODE',
    state: newState 
  }, (response) => {
    if (chrome.runtime.lastError) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }).then(() => {
        
      });
    }
  });

  updateButtonState(newState);
});

function updateButtonState(isActive) {
  toggleBtn.textContent = isActive ? 'off' : 'on';
  toggleBtn.classList.toggle('active', isActive);
}