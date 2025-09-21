document.querySelectorAll("button").forEach(button => {
  button.addEventListener("click", () => {
    const soundName = button.getAttribute("data-sound");
    const filePath = `./sounds/${soundName}.mp3`;  // relative path
    const audio = new Audio(filePath);

    // Log if the sound can’t be loaded
    audio.addEventListener("error", () => {
      console.error(`❌ Could not load sound: ${filePath}`);
    });

    audio.currentTime = 0; // restart if already playing
    audio.play().catch(err => {
      console.error(`⚠️ Error playing ${filePath}:`, err);
    });
  });
});
