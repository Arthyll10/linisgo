// Demo forms only: no requests, database, cookies, or browser storage.
// The script uses defer, so the HTML is already loaded.
const authForm = document.querySelector('#auth-form');

if (authForm) {
  const password = document.querySelector('#password');
  const confirmation = document.querySelector('#confirm-password');
  const fullName = document.querySelector('#full-name');
  const status = document.querySelector('#auth-status');
  const popup = document.querySelector('#auth-success');
  const popupTitle = document.querySelector('#success-title');
  const popupMessage = document.querySelector('#success-message');

  let redirectAfterClose = false;

  // Let the closing animation finish before hiding the dialog.
  function closePopup(redirect = false) {
    if (!popup.open || popup.classList.contains('is-closing')) return;
    redirectAfterClose = redirect;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      popup.close();
      return;
    }
    popup.classList.add('is-closing');
    // Keep this delay equal to the 180ms closing animation in auth.css.
    window.setTimeout(() => popup.close(), 180);
  }

  document.querySelector('#success-close').addEventListener('click', () => closePopup(true));
  popup.addEventListener('cancel', event => {
    event.preventDefault(); 
    closePopup();
  });
  popup.addEventListener('close', () => {
    popup.classList.remove('is-closing');
    if (redirectAfterClose) {
      window.location.href = authForm.dataset.mode === 'register' ? 'login.html' : 'index.html';
    } else {
      document.querySelector('#auth-submit').focus();
    }
  });

  function validateFields() {
    if (fullName) {
      fullName.setCustomValidity(fullName.value.trim() ? '' : 'Please enter your name.');
    }
    if (confirmation) {
      confirmation.setCustomValidity(
        confirmation.value === password.value ? '' : 'Passwords must match.'
      );
    }
  }

  authForm.addEventListener('input', () => {
    status.textContent = '';
    validateFields();
  });

  authForm.addEventListener('submit', event => {
    event.preventDefault(); 
    validateFields();
    if (!authForm.reportValidity()) return;

    const message = authForm.dataset.mode === 'register'
      ? 'Registered! Demo only — no account was created or saved.'
      : 'Logged in! Demo only — no account was checked or signed in.';

    // Clear the entered details after the demo
    authForm.reset();
    status.textContent = message;
    popupTitle.textContent = authForm.dataset.mode === 'register' ? 'Registered!' : 'Logged in!';
    popupMessage.textContent = authForm.dataset.mode === 'register'
      ? 'Registration demo complete. No account was created or saved.'
      : 'Login demo complete. No account was checked or signed in.';
    popup.showModal();
  });

  // Enable submission only after the handler that prevents sending is attached.
  document.querySelector('#auth-submit').disabled = false;
}
