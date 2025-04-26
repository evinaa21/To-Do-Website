document.addEventListener('DOMContentLoaded', () => {
    const timerDisplay = document.getElementById('timerDisplay');
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    const resetBtn = document.getElementById('resetTimer');
    const statusDisplay = document.getElementById('timerStatus');
    const cycleCountDisplay = document.getElementById('cycleCount');

    let timerInterval;
    let totalSeconds = 25 * 60; // Default work time
    let isRunning = false;
    let isWorkSession = true;
    let cyclesCompleted = 0;

    const workTime = 25 * 60;
    const shortBreakTime = 5 * 60;
    const longBreakTime = 15 * 60;

    function updateDisplay() {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.title = `${timerDisplay.textContent} - ${isWorkSession ? 'Work' : 'Break'} - PixelTask`;
    }

    function startTimer() {
        if (isRunning) return;
        isRunning = true;
        statusDisplay.textContent = isWorkSession ? "Focus time!" : "Take a break!";
        timerInterval = setInterval(() => {
            if (totalSeconds <= 0) {
                clearInterval(timerInterval);
                isRunning = false;
                handleSessionEnd();
                return;
            }
            totalSeconds--;
            updateDisplay();
        }, 1000);
    }

    function pauseTimer() {
        if (!isRunning) return;
        isRunning = false;
        clearInterval(timerInterval);
        statusDisplay.textContent = "Paused";
    }

    function resetTimer(switchToWork = true) {
        pauseTimer();
        isWorkSession = switchToWork;
        totalSeconds = isWorkSession ? workTime : (cyclesCompleted % 4 === 0 && cyclesCompleted > 0) ? longBreakTime : shortBreakTime;
        updateDisplay();
        statusDisplay.textContent = "Ready";
        if (!switchToWork) {
             statusDisplay.textContent += " for break";
        }
    }

    function handleSessionEnd() {
        // Basic notification (consider using browser Notification API for more robust alerts)
        alert(isWorkSession ? "Work session finished! Time for a break." : "Break's over! Time to focus.");

        if (isWorkSession) {
            cyclesCompleted++;
            cycleCountDisplay.textContent = cyclesCompleted;
            resetTimer(false); // Switch to break
        } else {
            resetTimer(true); // Switch to work
        }
        // Optionally auto-start the next session
        // startTimer();
    }

    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', () => resetTimer(true)); // Reset always goes back to work session start

    // Initial display
    updateDisplay();
});