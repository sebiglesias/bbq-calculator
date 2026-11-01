document.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  let state = {
    men: 8,
    women: 6,
    kids: 4,
    appetite: 'standard',
    totalCost: 0,
    venmo: localStorage.getItem('bbqcalc-venmo') || ''
  };

  if (state.venmo && $('#bbq-venmo')) {
    $('#bbq-venmo').value = state.venmo;
  }

  // Steppers
  const bindStepper = (prefix, key) => {
    $(`#${prefix}-minus`).onclick = () => {
      if (state[key] > 0) {
        state[key]--;
        render();
      }
    };
    $(`#${prefix}-plus`).onclick = () => {
      state[key]++;
      render();
    };
  };

  bindStepper('men', 'men');
  bindStepper('women', 'women');
  bindStepper('kids', 'kids');

  // Appetite
  $('#appetite-seg').querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      $('#appetite-seg').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      state.appetite = btn.dataset.v;
      render();
    };
  });

  $('#total-bbq-cost').oninput = e => {
    state.totalCost = parseFloat(e.target.value) || 0;
    updateCostSplit();
  };

  $('#bbq-venmo').oninput = e => {
    state.venmo = e.target.value.trim();
    localStorage.setItem('bbqcalc-venmo', state.venmo);
  };

  function calculate() {
    // Target cooked meat per person (in lbs)
    let cookedTargetPerMan = state.appetite === 'light' ? 0.65 : (state.appetite === 'meatlover' ? 1.15 : 0.85);
    let cookedTargetPerWoman = state.appetite === 'light' ? 0.45 : (state.appetite === 'meatlover' ? 0.85 : 0.60);
    let cookedTargetPerKid = state.appetite === 'light' ? 0.25 : (state.appetite === 'meatlover' ? 0.50 : 0.35);

    const totalCookedTarget = (state.men * cookedTargetPerMan) + (state.women * cookedTargetPerWoman) + (state.kids * cookedTargetPerKid);

    // Blended smoker shrink factor: average ~45% (so divide by 0.55 to get raw lbs)
    const rawTotalLbs = totalCookedTarget / 0.55;

    // Classic 3-Meat American BBQ Breakdown:
    // 1. Smoked Beef Brisket (40% of meat menu, 50% shrink)
    const brisketCooked = totalCookedTarget * 0.40;
    const brisketRawLbs = (brisketCooked / 0.50).toFixed(1);

    // 2. Pulled Pork Butt (35% of meat menu, 45% shrink)
    const porkCooked = totalCookedTarget * 0.35;
    const porkRawLbs = (porkCooked / 0.55).toFixed(1);

    // 3. Smoked Sausage Links (15% of menu, 20% shrink)
    const sausageCooked = totalCookedTarget * 0.15;
    const sausageRawLbs = (sausageCooked / 0.80).toFixed(1);
    const sausageLinks = Math.round(parseFloat(sausageRawLbs) * 3); // ~3 links per lb

    // 4. St. Louis Pork Ribs (10% of menu, ~2.5 lbs per rack)
    const totalAdults = state.men + state.women;
    const ribRacks = Math.max(1, Math.ceil(totalAdults * 0.25));

    // Sides & Supplies
    const totalGuests = totalAdults + state.kids;
    const sliderBuns = Math.ceil(totalGuests * 1.5);
    const coleslawLbs = (totalGuests * 0.25).toFixed(1); // 4 oz per person
    const macAndCheeseLbs = (totalGuests * 0.30).toFixed(1); // 5 oz per person
    const woodPelletsLbs = Math.max(10, Math.round(totalGuests * 1.2)); // ~1 lb pellets per hr smoke

    return {
      totalGuests,
      totalAdults,
      totalCookedTarget: totalCookedTarget.toFixed(1),
      rawTotalLbs: rawTotalLbs.toFixed(1),
      brisketRawLbs,
      porkRawLbs,
      sausageRawLbs,
      sausageLinks,
      ribRacks,
      sliderBuns,
      coleslawLbs,
      macAndCheeseLbs,
      woodPelletsLbs
    };
  }

  function updateCostSplit() {
    const adults = (state.men + state.women) || 1;
    if (state.totalCost > 0) {
      $('#cost-per-adult').textContent = `$${(state.totalCost / adults).toFixed(2)}`;
    } else {
      $('#cost-per-adult').textContent = '$0.00';
    }
  }

  function render() {
    $('#men-val').textContent = state.men;
    $('#women-val').textContent = state.women;
    $('#kids-val').textContent = state.kids;

    const res = calculate();
    $('#total-raw-lbs').textContent = res.rawTotalLbs;
    $('#total-cooked-lbs').textContent = `~${res.totalCookedTarget} lbs`;
    $('#total-guests-count').textContent = `${res.totalGuests} guests (${res.totalAdults} adults, ${state.kids} kids)`;

    // Butcher List
    const butcherContainer = $('#butcher-list');
    butcherContainer.innerHTML = `
      <div class="butcher-card">
        <div class="meat-title">
          <span class="meat-name">🥩 Whole Packer Beef Brisket</span>
          <span class="meat-qty">${res.brisketRawLbs} lbs raw</span>
        </div>
        <span class="meat-sub">Trim 1/4" fat cap · yields ~${(parseFloat(res.brisketRawLbs) * 0.5).toFixed(1)} lbs cooked slices & burnt ends</span>
      </div>
      <div class="butcher-card">
        <div class="meat-title">
          <span class="meat-name">🐖 Pork Shoulder / Boston Butt</span>
          <span class="meat-qty">${res.porkRawLbs} lbs raw</span>
        </div>
        <span class="meat-sub">Bone-in butt · yields ~${(parseFloat(res.porkRawLbs) * 0.55).toFixed(1)} lbs shredded pulled pork</span>
      </div>
      <div class="butcher-card">
        <div class="meat-title">
          <span class="meat-name">🌭 Smoked Sausage Links</span>
          <span class="meat-qty">${res.sausageRawLbs} lbs (~${res.sausageLinks} links)</span>
        </div>
        <span class="meat-sub">Jalapeño cheddar or beef hot links</span>
      </div>
      <div class="butcher-card">
        <div class="meat-title">
          <span class="meat-name">🍖 St. Louis Cut Pork Ribs</span>
          <span class="meat-qty">${res.ribRacks} Full Racks</span>
        </div>
        <span class="meat-sub">Remove membrane · ~${res.ribRacks * 12} individual ribs</span>
      </div>
    `;

    // Sides & Fuel
    const sidesContainer = $('#sides-grid');
    sidesContainer.innerHTML = `
      <div class="side-item">
        <span class="side-name">Brioche Slider Buns:</span>
        <strong class="side-val">${res.sliderBuns} buns</strong>
      </div>
      <div class="side-item">
        <span class="side-name">Creamy Coleslaw:</span>
        <strong class="side-val">${res.coleslawLbs} lbs</strong>
      </div>
      <div class="side-item">
        <span class="side-name">Smoked Mac & Cheese:</span>
        <strong class="side-val">${res.macAndCheeseLbs} lbs</strong>
      </div>
      <div class="side-item">
        <span class="side-name">Wood Pellets / Hardwood:</span>
        <strong class="side-val">~${res.woodPelletsLbs} lbs fuel</strong>
      </div>
    `;

    updateCostSplit();
  }

  // Copy Order
  $('#btn-copy-bbq').onclick = () => {
    const res = calculate();
    const btn = $('#btn-copy-bbq');
    const venmo = state.venmo ? `\n💸 Venmo/Zelle: ${state.venmo}` : '';
    const cost = state.totalCost > 0 ? `\n💰 Total: $${state.totalCost.toFixed(2)} ($${(state.totalCost / res.totalAdults).toFixed(2)} per adult)` : '';

    const text = `🍖 BBQ & Smoker Butcher List (${res.totalGuests} guests):
• Whole Packer Brisket: ${res.brisketRawLbs} lbs raw
• Pork Shoulder (Butt): ${res.porkRawLbs} lbs raw
• Smoked Sausage: ${res.sausageRawLbs} lbs (~${res.sausageLinks} links)
• Pork Ribs: ${res.ribRacks} full racks
---------------------------
Sides & Supplies:
• Slider Buns: ${res.sliderBuns} buns
• Coleslaw: ${res.coleslawLbs} lbs
• Mac & Cheese: ${res.macAndCheeseLbs} lbs
• Smoker Fuel: ~${res.woodPelletsLbs} lbs pellets/wood${cost}${venmo}

Calculated with: https://sebiglesias.com.ar/bbq-calculator/`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.innerHTML;
        btn.innerHTML = '<span>✅</span> Butcher List Copied to Clipboard!';
        btn.style.background = '#059669';
        setTimeout(() => {
          btn.innerHTML = orig;
          btn.style.background = '';
        }, 2500);
      });
    }
  };

  render();
});
