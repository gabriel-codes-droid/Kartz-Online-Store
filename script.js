// Clears the calculator display
function clearScreen() {
    document.getElementById("result").value = "";
}

// Appends the clicked button's value to the display
function setScreenValue(value) {
    document.getElementById("result").value += value;
}

// Calculates and displays the result
function calculateResult() {
    const resultElement = document.getElementById("result");
    const expression = resultElement.value.trim();

    // Check for empty input
    if (expression === '') {
        resultElement.value = 'Enter an expression';
        return;
    }

    // Evaluate expression and handle errors
    try {
        resultElement.value = eval(expression);
    } catch (e) {
        resultElement.value = 'Invalid expression';
    }
}
// pulse effect on click
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn');
  if(!btn) return;
  btn.classList.remove('pulse');
  // reflow to restart animation
  void btn.offsetWidth;
  btn.classList.add('pulse');
  setTimeout(()=> btn.classList.remove('pulse'), 700);
});

// compute simple seller earnings (sum of sold amounts recorded in orders collection)
// show earnings in renderConnectArea() area for signed-in sellers
async function loadSellerEarnings() {
  const user = auth.currentUser;
  if(!user) return null;
  // orders should be recorded by webhook and have metadata.sellerId and amount_total (cents)
  const q = await db.collection('orders').where('metadata.sellerId','==',user.uid).get();
  let totalCents = 0;
  q.forEach(d => {
    const ord = d.data();
    if(ord.amount_total) totalCents += Number(ord.amount_total || 0);
  });
  const dollars = (totalCents/100).toFixed(2);
  return dollars;
}

// modify renderConnectArea to call loadSellerEarnings and display it
async function renderConnectArea() {
  const area = document.getElementById('connectArea');
  area.innerHTML = '';
  const user = auth.currentUser;
  if (!user) { area.innerHTML = `<div class="small-muted">Login to connect Stripe and see earnings.</div>`; return; }
  const prof = await db.collection('profiles').doc(user.uid).get();
  const acct = prof.exists ? prof.data().stripeAccount : null;
  const earnings = await loadSellerEarnings();
  const earnHtml = `<div class="small-muted">Earnings (recorded): $${earnings||'0.00'}</div>`;
  if (acct) {
    area.innerHTML = `${earnHtml}<div class="small-muted">Connected Stripe Account: ${acct}</div><button class="btn" id="disconnectStripe">Disconnect</button>`;
    document.getElementById('disconnectStripe').addEventListener('click', async ()=> {
      await db.collection('profiles').doc(user.uid).update({ stripeAccount: firebase.firestore.FieldValue.delete() });
      alert('Disconnected locally.'); renderConnectArea();
    });
  } else {
    area.innerHTML = `${earnHtml}<div class="small-muted">You are not connected to Stripe.</div><button class="btn" id="connectStripe">Connect Stripe</button>`;
    document.getElementById('connectStripe').addEventListener('click', async ()=> {
      const getLink = functions.httpsCallable('createStripeConnectLink');
      const resp = await getLink({ uid: user.uid, returnUrl: window.location.href });
      if (!resp?.data?.url) return alert('Failed to get connect link');
      window.location.href = resp.data.url;
    });
  }
}
