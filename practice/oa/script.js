(() => {
  const openers = [...document.querySelectorAll("[data-dialog]")];
  const dialogs = [...document.querySelectorAll(".system-dialog")];

  const syncBodyLock = () => {
    document.body.classList.toggle("modal-open", dialogs.some((dialog) => dialog.open));
  };

  openers.forEach((opener) => {
    opener.addEventListener("click", () => {
      const dialog = document.getElementById(opener.dataset.dialog);
      if (!(dialog instanceof HTMLDialogElement) || dialog.open) return;

      opener.setAttribute("aria-expanded", "true");
      dialog.showModal();
      syncBodyLock();
    });
  });

  dialogs.forEach((dialog) => {
    dialog.querySelector("[data-close]")?.addEventListener("click", () => dialog.close());

    dialog.addEventListener("click", (event) => {
      const bounds = dialog.getBoundingClientRect();
      const outside =
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom;

      if (outside) dialog.close();
    });

    dialog.addEventListener("close", () => {
      const opener = openers.find((candidate) => candidate.dataset.dialog === dialog.id);
      opener?.setAttribute("aria-expanded", "false");
      syncBodyLock();
    });
  });
})();
