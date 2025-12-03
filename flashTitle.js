let flashing = false;
let intervalId;

export function flashTitle(message = "🔔 توجه!") {
  if (flashing) return;
  flashing = true;

  const original = document.title;

  intervalId = setInterval(() => {
    document.title = document.title === original ? message : original;
  }, 700);

  return () => {
    clearInterval(intervalId);
    document.title = original;
    flashing = false;
  };
}
