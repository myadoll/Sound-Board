document.querySelectorAll("button").forEach(button => {
  button.addEventListener("click", () => {
    const soundName = button.getAttribute("data-sound");
    const audio = new Audio(`sounds/${soundName}.mp3`);
    audio.play();
  });
});
