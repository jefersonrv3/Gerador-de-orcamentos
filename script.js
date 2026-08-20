let partCounter = 0;
let serviceCounter = 0;

const fmt = (n) => (isNaN(n) ? 0 : n).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

// ---------- Init date ----------
document.getElementById('budgetDate').value = new Date().toISOString().slice(0, 10);

// ---------- Parts ----------
function addPartRow() {
    partCounter++;
    const id = 'part-' + partCounter;
    document.getElementById('partsEmpty')?.remove();
    const div = document.createElement('div');
    div.className = 'row-item';
    div.id = id;
    div.innerHTML = `
    <div class="grid cols-4">
      <div class="field"><label>Nome da peça</label><input type="text" class="part-name" placeholder="Ex: Pastilha de freio"></div>
      <div class="field"><label>Qtd.</label><input type="number" class="part-qty" min="1" step="1" value="1"></div>
      <div class="field"><label>Unidade</label><input type="text" class="part-unit" list="unidades" placeholder="Unidade, par, kit..."></div>
      <div class="field"><label>Valor unit. (R$)</label><input type="number" class="part-price" min="0" step="0.01" value="0"></div>
      <button class="remove-btn" title="Remover peça" onclick="document.getElementById('${id}').remove(); checkEmpty('parts'); calcTotals();">✕</button>
    </div>`;
    document.getElementById('partsList').appendChild(div);
    div.querySelectorAll('input').forEach(inp => inp.addEventListener('input', calcTotals));
}

function addServiceRow() {
    serviceCounter++;
    const id = 'service-' + serviceCounter;
    document.getElementById('servicesEmpty')?.remove();
    const div = document.createElement('div');
    div.className = 'row-item';
    div.id = id;
    div.innerHTML = `
    <div class="grid" style="grid-template-columns:3fr 1fr auto;">
      <div class="field"><label>Descrição do serviço</label><input type="text" class="service-name" placeholder="Ex: Troca de óleo e filtro"></div>
      <div class="field"><label>Valor cobrado (R$)</label><input type="number" class="service-price" min="0" step="0.01" value="0"></div>
      <button class="remove-btn" title="Remover serviço" onclick="document.getElementById('${id}').remove(); checkEmpty('services'); calcTotals();">✕</button>
    </div>`;
    document.getElementById('servicesList').appendChild(div);
    div.querySelectorAll('input').forEach(inp => inp.addEventListener('input', calcTotals));
}

function checkEmpty(kind) {
    if (kind === 'parts' && !document.querySelector('#partsList .row-item')) {
        document.getElementById('partsList').innerHTML = '<p class="empty-hint" id="partsEmpty">Nenhuma peça adicionada ainda.</p>';
    }
    if (kind === 'services' && !document.querySelector('#servicesList .row-item')) {
        document.getElementById('servicesList').innerHTML = '<p class="empty-hint" id="servicesEmpty">Nenhum serviço adicionado ainda.</p>';
    }
}

document.getElementById('addPartBtn').addEventListener('click', addPartRow);
document.getElementById('addServiceBtn').addEventListener('click', addServiceRow);

function getParts() {
    return [...document.querySelectorAll('#partsList .row-item')].map(row => ({
        name: row.querySelector('.part-name').value.trim(),
        qty: parseFloat(row.querySelector('.part-qty').value) || 0,
        unit: row.querySelector('.part-unit').value.trim() || 'Unidade',
        price: parseFloat(row.querySelector('.part-price').value) || 0
    })).filter(p => p.name);
}

function getServices() {
    return [...document.querySelectorAll('#servicesList .row-item')].map(row => ({
        name: row.querySelector('.service-name').value.trim(),
        price: parseFloat(row.querySelector('.service-price').value) || 0
    })).filter(s => s.name);
}

function calcTotals() {
    const partsTotal = getParts().reduce((sum, p) => sum + p.qty * p.price, 0);
    const servicesTotal = getServices().reduce((sum, s) => sum + s.price, 0);
    document.getElementById('totalParts').textContent = fmt(partsTotal);
    document.getElementById('totalServices').textContent = fmt(servicesTotal);
    document.getElementById('totalGrand').textContent = fmt(partsTotal + servicesTotal);
}

// ---------- Generate PDF (print) ----------
document.getElementById('generateBtn').addEventListener('click', () => {
    const clientName = document.getElementById('clientName').value.trim();
    if (!clientName) {
        alert('Preencha ao menos o nome do cliente antes de gerar o orçamento.');
        return;
    }

    const clientPhone = document.getElementById('clientPhone').value.trim();
    const dateVal = document.getElementById('budgetDate').value;
    const dateFmt = dateVal ? new Date(dateVal + 'T00:00:00').toLocaleDateString('pt-BR') : '';
    const carPlate = document.getElementById('carPlate').value.trim().toUpperCase();
    const carModel = document.getElementById('carModel').value.trim();
    const carIssue = document.getElementById('carIssue').value.trim();

    const parts = getParts();
    const services = getServices();
    const partsTotal = parts.reduce((s, p) => s + p.qty * p.price, 0);
    const servicesTotal = services.reduce((s, srv) => s + srv.price, 0);
    const grandTotal = partsTotal + servicesTotal;

    const orcamentoNum = 'JJ-' + (dateVal ? dateVal.replace(/-/g, '') : '') + '-' + Math.floor(Math.random() * 900 + 100);

    let partsRows = parts.map(p => `
    <tr>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.unit)}</td>
      <td class="num">${p.qty}</td>
      <td class="num">${fmt(p.price)}</td>
      <td class="num">${p.qty > 1 ? fmt(p.qty*p.price) : '—'}</td>
    </tr>`).join('');
    if (!partsRows) partsRows = `<tr><td colspan="5" style="color:#999;font-style:italic;">Nenhuma peça informada</td></tr>`;

    let servicesRows = services.map(s => `
    <tr>
      <td colspan="4">${escapeHtml(s.name)}</td>
      <td class="num">${fmt(s.price)}</td>
    </tr>`).join('');
    if (!servicesRows) servicesRows = `<tr><td colspan="5" style="color:#999;font-style:italic;">Nenhum serviço informado</td></tr>`;

    // Pega a logo estática usada no cabeçalho da página (assets/Logo.png)
    const headerLogo = document.querySelector('.logo-JJ-autocenter img');
    const logoSrc = headerLogo ? headerLogo.getAttribute('src') : '';

    const html = `
    <div class="doc">
      <div class="doc-header">
        <div class="brand">
          ${logoSrc ? `<img class="logo" src="${logoSrc}">` : ''}
          <div>
            <div class="brand-name"></div>
          </div>
        </div>
        <div class="doc-title">
          <div class="tag">Orçamento</div>
          <div class="num">${orcamentoNum}</div>
          <div class="date">${dateFmt}</div>
        </div>
      </div>

      <div class="info-block">
        <div class="info-box">
          <h3>Cliente</h3>
          <p><b>Nome:</b> ${escapeHtml(clientName)}</p>
          <p><b>Telefone:</b> ${escapeHtml(clientPhone) || '—'}</p>
        </div>
        <div class="info-box">
          <h3>Veículo</h3>
          <p><b>Modelo:</b> ${escapeHtml(carModel) || '—'}</p>
          <p><b>Placa:</b> ${escapeHtml(carPlate) || '—'}</p>
        </div>
      </div>

      ${carIssue ? `
      <div class="info-box" style="margin-bottom:18px;">
        <h3>Motivo da entrada / defeito relatado</h3>
        <p>${escapeHtml(carIssue)}</p>
      </div>` : ''}

      <div class="doc-section-title">Peças</div>
      <table class="doc-table">
        <thead><tr><th>Descrição</th><th>Unidade</th><th class="num">Qtd.</th><th class="num">Valor unit.</th><th class="num">Total</th></tr></thead>
        <tbody>${partsRows}</tbody>
      </table>

      <div class="doc-section-title">Serviços técnicos</div>
      <table class="doc-table">
        <thead><tr><th colspan="4">Descrição</th><th class="num">Valor</th></tr></thead>
        <tbody>${servicesRows}</tbody>
      </table>

      <div class="doc-totals">
        <table>
          <tr><td class="label">Total em peças</td><td class="val">${fmt(partsTotal)}</td></tr>
          <tr><td class="label">Total em serviços</td><td class="val">${fmt(servicesTotal)}</td></tr>
          <tr class="grand"><td class="label">TOTAL GERAL</td><td class="val">${fmt(grandTotal)}</td></tr>
        </table>
      </div>

      <div class="doc-footer">
        <div class="sign-line">Assinatura do cliente</div>
        <div style="align-self:flex-end;">Orçamento válido por 7 dias.</div>
      </div>
    </div>
  `;

    document.getElementById('print-area').innerHTML = html;
    setTimeout(() => window.print(), 100);
});

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

// start with one part and one service row for convenience
addPartRow();
addServiceRow();
calcTotals();