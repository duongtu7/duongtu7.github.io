// State
let users = [];
let selectedUsers = [];
let remainingUsers = [];
let doneUsers = [];
let currentUser = null;
let sessionActive = false;
let timerInterval = null;
let timeRemaining = 15 * 60; // 15 minutes in seconds
let memberAvatars = {};
let speakingDurations = {};
let currentUserStartTime = null;

// DOM Elements
const userTableBody = document.getElementById('userTableBody');
const selectedCount = document.getElementById('selectedCount');
const timerDisplay = document.getElementById('timerDisplay');
const pickerDisplay = document.getElementById('pickerDisplay');
const pickerPlaceholder = document.getElementById('pickerPlaceholder');
const pickerUser = document.getElementById('pickerUser');
const pickerUserCode = document.getElementById('pickerUserCode');
const pickerUserName = document.getElementById('pickerUserName');
const pickerUserAvatar = document.getElementById('pickerUserAvatar');
const spinOverlay = document.getElementById('spinOverlay');
const spinName = document.getElementById('spinName');
const startBtn = document.getElementById('startBtn');
const pickBtn = document.getElementById('pickBtn');
const resetBtn = document.getElementById('resetBtn');
const progressCount = document.getElementById('progressCount');
const progressFill = document.getElementById('progressFill');
const sessionComplete = document.getElementById('sessionComplete');

// Assign random avatars to all members
function assignRandomAvatars() {
  const shuffled = [...AVATAR_EMOJIS].sort(() => Math.random() - 0.5);
  users.forEach((_, index) => {
    memberAvatars[index] = shuffled[index % shuffled.length];
  });
}

// Load users from MEMBERS constant
function loadUsers() {
  users = MEMBERS;
  // Assign random avatars
  assignRandomAvatars();
  // Select users based on defaultChecked property
  selectedUsers = users
    .map((user, index) => ({ user, index }))
    .filter(({ user }) => user.defaultChecked !== false)
    .map(({ index }) => index);
  // Initialize speaking durations
  users.forEach((_, index) => {
    speakingDurations[index] = 0;
  });
  renderUserTable();
  updateSelectedCount();
}

// Format duration in mm:ss
function formatDuration(seconds) {
  if (seconds === 0) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Render user table
function renderUserTable() {
  userTableBody.innerHTML = users.map((user, index) => `
    <tr id="user-row-${index}" class="${doneUsers.includes(index) ? 'done' : ''} ${currentUser === index ? 'active' : ''}">
      <td>
        <div class="checkbox-wrapper">
          <input type="checkbox" class="checkbox" 
                 id="check-${index}" 
                 data-index="${index}"
                 ${selectedUsers.includes(index) ? 'checked' : ''}
                 ${sessionActive ? 'disabled' : ''}
                 onchange="toggleUser(${index})">
        </div>
      </td>
      <td style="text-align: center; font-size: 1.5rem; line-height: 1;">${memberAvatars[index] || '👤'}</td>
      <td><span class="user-code">${user.code}</span></td>
      <td style="text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--text-secondary);">${formatDuration(speakingDurations[index] || 0)}</td>
    </tr>
  `).join('');
  
  updateSelectedCount();
}

// Toggle user selection
function toggleUser(index) {
  if (sessionActive) return;
  
  const idx = selectedUsers.indexOf(index);
  if (idx > -1) {
    selectedUsers.splice(idx, 1);
  } else {
    selectedUsers.push(index);
  }
  
  updateSelectedCount();
}

// Update selected count display
function updateSelectedCount() {
  selectedCount.textContent = `${selectedUsers.length} selected`;
  updateProgress();
}

// Update progress bar (count current speaker as done)
function updateProgress() {
  const total = selectedUsers.length;
  const done = Math.min(doneUsers.length + (currentUser !== null ? 1 : 0), total);
  progressCount.textContent = `${done} / ${total}`;
  const percentage = total > 0 ? (done / total) * 100 : 0;
  progressFill.style.width = `${percentage}%`;
}

// Format time display
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update timer display with color states
function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(timeRemaining);
  timerDisplay.classList.remove('warning', 'danger');
  
  if (timeRemaining <= 60) {
    timerDisplay.classList.add('danger');
  } else if (timeRemaining <= 180) {
    timerDisplay.classList.add('warning');
  }
}

// Start timer
function startTimer() {
  timerInterval = setInterval(() => {
    if (timeRemaining > 0) {
      timeRemaining--;
      updateTimerDisplay();
    } else {
      clearInterval(timerInterval);
    }
  }, 1000);
}

// Stop timer
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Start session
function startSession() {
  if (selectedUsers.length === 0) {
    alert('Please select at least one participant');
    return;
  }

  sessionActive = true;
  remainingUsers = [...selectedUsers];
  doneUsers = [];
  currentUser = null;
  timeRemaining = 15 * 60;

  startBtn.style.display = 'none';
  resetBtn.style.display = 'flex';
  pickBtn.style.display = 'flex';
  pickBtn.disabled = false;
  sessionComplete.classList.remove('show');

  pickerPlaceholder.textContent = 'Click "Pick a member" to select first speaker';
  pickerUser.style.display = 'none';
  pickerDisplay.classList.remove('selected');

  renderUserTable();
  startTimer();
  updateProgress();
  
  // Automatically pick the first user
  spinAndPickUser();
}

// Spin animation for picking user
async function spinAndPickUser() {
  // Save speaking duration for previous user immediately
  if (currentUser !== null && currentUserStartTime !== null) {
    const duration = Math.floor((Date.now() - currentUserStartTime) / 1000);
    speakingDurations[currentUser] = duration;
    renderUserTable();
  }

  // If this is the last user, end the session directly
  if (remainingUsers.length === 1 && currentUser !== null) {
    doneUsers.push(currentUser);
    remainingUsers = [];
    endSession();
    return;
  }

  if (remainingUsers.length === 0) {
    endSession();
    return;
  }

  pickBtn.disabled = true;
  pickerDisplay.classList.add('spinning');
  pickerDisplay.classList.remove('selected');
  spinOverlay.classList.add('active');
  pickerPlaceholder.style.display = 'none';
  pickerUser.style.display = 'none';

  // Animation duration: 1 second
  const duration = 1000;
  const startTime = Date.now();
  let spinInterval = 50;

  // Spinning animation
  const spin = () => {
    const elapsed = Date.now() - startTime;
    
    if (elapsed < duration) {
      // Pick random user to display
      const randomIdx = remainingUsers[Math.floor(Math.random() * remainingUsers.length)];
      const user = users[randomIdx];
      spinName.textContent = user.code;
      
      // Slow down near the end
      if (elapsed > duration * 0.7) {
        spinInterval = 100 + (elapsed - duration * 0.7) / 3;
      }
      
      setTimeout(spin, spinInterval);
    } else {
      // Final selection
      selectRandomUser();
    }
  };

  spin();
}

// Select random user after animation
function selectRandomUser() {
  // Mark previous user as done
  if (currentUser !== null) {
    doneUsers.push(currentUser);
    remainingUsers = remainingUsers.filter(i => i !== currentUser);
  }

  if (remainingUsers.length === 0) {
    spinOverlay.classList.remove('active');
    pickerDisplay.classList.remove('spinning');
    endSession();
    return;
  }

  // Pick random from remaining
  const randomIndex = Math.floor(Math.random() * remainingUsers.length);
  currentUser = remainingUsers[randomIndex];
  currentUserStartTime = Date.now();
  const user = users[currentUser];

  // Update display
  spinOverlay.classList.remove('active');
  pickerDisplay.classList.remove('spinning');
  pickerDisplay.classList.add('selected');
  
  pickerUserCode.textContent = '';
  pickerUserAvatar.textContent = memberAvatars[currentUser];
  pickerUserName.textContent = user.code;
  pickerUser.style.display = 'block';
  
  pickBtn.disabled = false;
  
  // Update progress immediately when user starts speaking
  updateProgress();
  
  // Check if this is the last user - change button text
  if (remainingUsers.length === 1) {
    pickBtn.innerHTML = '<span class="btn-icon">✓</span> End Session';
  }
  
  renderUserTable();
}

// End session
function endSession() {
  // Save speaking duration for last user
  if (currentUser !== null && currentUserStartTime !== null) {
    const duration = Math.floor((Date.now() - currentUserStartTime) / 1000);
    speakingDurations[currentUser] = duration;
  }

  // Mark last user as done if not already
  if (currentUser !== null && !doneUsers.includes(currentUser)) {
    doneUsers.push(currentUser);
  }

  sessionActive = false;
  currentUserStartTime = null;
  stopTimer();
  
  pickBtn.disabled = true;
  pickerUser.style.display = 'none';
  pickerDisplay.classList.remove('spinning', 'selected');
  pickerDisplay.style.display = 'none';
  document.querySelector('.timer-section').style.display = 'none';
  
  // Show random quote
  const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.getElementById('completeQuote').textContent = `"${randomQuote}"`;
  
  sessionComplete.classList.add('show');
  
  renderUserTable();
  updateProgress();
}

// Reset session
function resetSession() {
  sessionActive = false;
  stopTimer();
  
  remainingUsers = [];
  doneUsers = [];
  currentUser = null;
  currentUserStartTime = null;
  timeRemaining = 15 * 60;
  
  // Reset speaking durations
  users.forEach((_, index) => {
    speakingDurations[index] = 0;
  });
  
  // Assign new random avatars for next session
  assignRandomAvatars();

  startBtn.style.display = 'flex';
  resetBtn.style.display = 'none';
  pickBtn.style.display = 'none';
  pickBtn.disabled = true;
  pickBtn.innerHTML = '<span class="btn-icon">🎲</span> Pick a member';
  sessionComplete.classList.remove('show');
  
  // Restore timer and picker display
  document.querySelector('.timer-section').style.display = 'block';
  pickerDisplay.style.display = 'flex';
  
  pickerPlaceholder.textContent = 'Click "Start Session" to begin';
  pickerPlaceholder.style.display = 'block';
  pickerUser.style.display = 'none';
  pickerDisplay.classList.remove('spinning', 'selected');
  spinOverlay.classList.remove('active');

  updateTimerDisplay();
  renderUserTable();
  updateProgress();
}

// Event Listeners
startBtn.addEventListener('click', startSession);
pickBtn.addEventListener('click', spinAndPickUser);
resetBtn.addEventListener('click', resetSession);

// Initialize
loadUsers();
