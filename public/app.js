document.getElementById("cta").addEventListener("click", () => {
  const name = prompt("What's your name?");
  const msg = name ? `Hello, ${name}! 👋` : "Hello, world! 👋";
  document.getElementById("greeting").textContent = msg;
});
