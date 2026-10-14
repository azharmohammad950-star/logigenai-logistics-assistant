'use strict';

// Static GitHub Pages implementation of LogiGenAI's deterministic Demo Mode.
// Response structures and task logic mirror the existing Flask prototype.

const PRESETS = [
  { shipment_type: 'FCL Export', pol: 'Mundra', pod: 'Rotterdam', cargo: 'Automotive Parts', weight: '18000 kg', cbm: '32', issue: 'Documentation received after cutoff' },
  { shipment_type: 'LCL Export', pol: 'Nhava Sheva', pod: 'Hamburg', cargo: 'Textile Samples', weight: '850 kg', cbm: '4.2', issue: 'Cargo missed consolidation cutoff' },
  { shipment_type: 'FCL Import', pol: 'Jebel Ali', pod: 'Mundra', cargo: 'Industrial Machinery', weight: '22000 kg', cbm: '38', issue: 'Container arrival delayed' },
  { shipment_type: 'LCL Import', pol: 'Singapore', pod: 'Chennai', cargo: 'Electronic Components', weight: '1200 kg', cbm: '6.5', issue: 'Import documents are incomplete' }
];

const $ = (id) => document.getElementById(id);
const output = $('output');
const resultMode = $('resultMode');
const resultSubtitle = $('resultSubtitle');
let lastEmailText = '';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);
}

function clean(value, fallback = 'Not provided') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function shipmentData() {
  return {
    shipment_type: $('shipment_type').value,
    pol: $('pol').value,
    pod: $('pod').value,
    cargo: $('cargo').value,
    weight: $('weight').value,
    cbm: $('cbm').value,
    issue: $('issue').value
  };
}

function loadPreset(index) {
  const preset = PRESETS[index];
  if (!preset) return;
  Object.entries(preset).forEach(([key, value]) => { $(key).value = value; });
  document.querySelectorAll('.scenario-card').forEach((card, i) => card.classList.toggle('selected', i === index));
  resultMode.className = 'result-mode';
  resultMode.textContent = 'SCENARIO LOADED';
  resultSubtitle.textContent = 'Scenario loaded. Choose a task to generate an output.';
  output.innerHTML = '<div class="empty-state"><div class="empty-graphic"><span>✓</span></div><h4>Scenario loaded.</h4><p>Your shipment details are ready. Select a module to continue.</p></div>';
}

function clearForm() {
  $('shipmentForm').reset();
  $('shipment_type').value = 'FCL Export';
  ['pol', 'pod', 'cargo', 'weight', 'cbm', 'issue'].forEach((id) => { $(id).value = ''; });
  document.querySelectorAll('.scenario-card').forEach((card) => card.classList.remove('selected'));
  resultMode.className = 'result-mode';
  resultMode.textContent = 'WAITING';
  resultSubtitle.textContent = 'Choose a task to generate a response.';
  output.innerHTML = '<div class="empty-state"><div class="empty-graphic"><span>✳</span></div><h4>Your analysis starts here.</h4><p>Fill in the scenario details and choose a module to generate a structured response.</p></div>';
}

function riskLevel(issue) {
  const value = issue.toLowerCase();
  if (['lost', 'damage', 'customs hold', 'detained', 'hazard', 'missing cargo'].some((item) => value.includes(item))) return 'High';
  if (['delay', 'delayed', 'cutoff', 'documentation', 'rollover', 'missed', 'late', 'short'].some((item) => value.includes(item))) return 'Medium';
  return 'Low';
}

// Kept aligned with build_demo_response() in the original app.py.
function buildDemoResponse(task, shipment) {
  const st = clean(shipment.shipment_type);
  const pol = clean(shipment.pol);
  const pod = clean(shipment.pod);
  const cargo = clean(shipment.cargo);
  const weight = clean(shipment.weight);
  const cbm = clean(shipment.cbm);
  const issue = clean(shipment.issue);

  if (task === 'shipment') {
    return {
      summary: `The shipment is a ${st} movement from ${pol} to ${pod}, involving ${cargo} cargo. The stated operational issue is: ${issue}`,
      risk_level: riskLevel(issue),
      issues: [issue, `The next feasible operational milestone for this ${st.toLowerCase()} movement needs to be confirmed.`, 'Shipment documentation, cargo readiness and customer communication should be checked.'],
      actions: ['Verify current cargo readiness and warehouse/CFS receiving status.', 'Confirm the next available operational milestone, consolidation or sailing with the relevant provider.', 'Verify documentation completeness before the next movement.', 'Update the shipment record with the latest confirmed milestone.', 'Communicate the verified status and next step to the customer.'],
      assumptions: [`POL entered by user: ${pol}; POD entered by user: ${pod}.`, `Cargo entered by user: ${cargo}; weight: ${weight}; CBM: ${cbm}.`, 'No carrier-specific schedule, contractual SLA or legal/customs source was supplied.']
    };
  }
  if (task === 'docs') {
    return {
      summary: `For this ${st.toLowerCase()} shipment from ${pol} to ${pod}, the following project-level document checks should be verified against actual carrier, forwarder, origin, destination and cargo requirements.`,
      documents: [
        ['Commercial Invoice', 'Verify', 'Check commercial/value information and shipment references.'],
        ['Packing List', 'Verify', 'Check packages, cargo description and packing details.'],
        ['Shipping Instructions', 'Verify', 'Check information needed for transport documentation.'],
        ['Shipping Bill / export filing evidence', 'Verify', 'Confirm the applicable export filing process where relevant.'],
        ['VGM / weight information', 'Verify', `Check the declared shipment weight: ${weight}.`],
        ['Customer-specific documents', 'Check', `Confirm requirements for ${cargo} and destination ${pod}.`]
      ],
      warning: 'This checklist is an operational aid for the academic prototype and is not legal or customs advice.'
    };
  }
  if (task === 'exception') {
    return {
      summary: `The current exception for the ${st.toLowerCase()} shipment from ${pol} to ${pod} is: ${issue}. The immediate objective is to establish the next feasible movement while preventing additional delays.`,
      possible_causes: ['Cargo was not received before the applicable cutoff.', 'Documentation or approval was incomplete.', 'Warehouse/CFS receiving coordination was delayed.', 'Booking or consolidation capacity changed.'],
      actions: ['Confirm the exact missed or delayed milestone and its timestamp.', 'Check cargo physical status and receiving confirmation.', 'Verify documentation status and outstanding approvals.', 'Check the next available operational movement with the relevant provider.', 'Record the confirmed root cause and revised milestone.', 'Communicate the revised plan to the customer.'],
      escalation: 'Escalate when the revised movement affects a committed customer delivery date, creates storage/demurrage exposure, or requires a commercial decision.'
    };
  }
  if (task === 'email') {
    return {
      subject: `Shipment Update: ${pol} to ${pod}`,
      body: `Dear Customer,\n\nWe would like to provide an update regarding your ${st.toLowerCase()} shipment from ${pol} to ${pod} involving ${cargo} cargo.\n\nCurrent issue: ${issue}\n\nWe are checking the shipment status, documentation and the next available operational milestone. We will share the confirmed update once the relevant details have been verified.\n\nRegards,\nLogistics Operations Team`
    };
  }
  if (task === 'evaluation') {
    return {
      criteria: [
        ['Factuality', 'Pass', 'Uses user-entered shipment facts and avoids invented schedules.'],
        ['Relevance', 'Pass', 'Outputs stay focused on logistics operations.'],
        ['Completeness', 'Pass', 'Task-specific output contains the expected sections.'],
        ['Assumption Control', 'Pass', 'Unknown carrier/customs details are clearly marked for verification.'],
        ['Human Verification', 'Required', 'An operator must validate any output before operational use.']
      ],
      note: 'This is a prototype evaluation rubric for the academic demonstration; it is not a statistical accuracy benchmark.'
    };
  }
  throw new Error('Unsupported task');
}

function setProcessing(task) {
  resultMode.className = 'result-mode processing';
  resultMode.textContent = 'PROCESSING';
  resultSubtitle.textContent = task === 'evaluation' ? 'Running the prototype evaluation rubric.' : 'Building a structured demo response.';
  output.innerHTML = '<div class="loading-state"><span>✳</span>Preparing the structured response…</div>';
}

function runTask(task) {
  setProcessing(task);
  // Brief delay gives the interface a clear processing state. Outputs are simulated locally.
  window.setTimeout(() => {
    try {
      const result = buildDemoResponse(task, shipmentData());
      resultMode.className = 'result-mode demo-ready';
      resultMode.textContent = 'DEMO OUTPUT';
      renderResult(result, task);
    } catch (error) {
      resultMode.className = 'result-mode';
      resultMode.textContent = 'ERROR';
      output.innerHTML = `<div class="error-box">${escapeHtml(error.message || 'The output could not be generated.')}</div>`;
    }
  }, 180);
}

function listSection(title, items, ordered = true) {
  if (!Array.isArray(items) || items.length === 0) return '';
  const tag = ordered ? 'ol' : 'ul';
  const listClass = ordered ? 'output-list' : 'output-list output-bullets';
  return `<h4 class="output-section-title">${escapeHtml(title)}</h4><${tag} class="${listClass}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</${tag}>`;
}

function renderResult(result, task) {
  if (task === 'evaluation') {
    resultSubtitle.textContent = 'Original LogiGenAI prototype evaluation criteria.';
    const rows = result.criteria.map((row) => `<div class="evaluation-output-row"><div><b>${escapeHtml(row[0])}</b><small>${escapeHtml(row[2])}</small></div><span class="criteria-result ${row[1] === 'Required' ? 'required' : ''}">${escapeHtml(row[1].toUpperCase())}</span></div>`).join('');
    output.innerHTML = `${rows}<div class="warning-box">${escapeHtml(result.note)}</div>`;
    return;
  }
  let html = '';
  if (result.summary) html += `<div class="summary-box">${escapeHtml(result.summary)}</div>`;
  if (result.risk_level) {
    const cls = result.risk_level.toLowerCase();
    html += `<div class="risk-line"><span>Indicative risk level</span><b class="risk-badge ${cls}">${escapeHtml(result.risk_level.toUpperCase())}</b></div>`;
  }
  html += listSection('Identified issues', result.issues);
  html += listSection('Recommended actions', result.actions);
  html += listSection('Possible causes', result.possible_causes);
  if (Array.isArray(result.documents)) {
    html += '<h4 class="output-section-title">Documentation checklist</h4><div class="docs-table-wrap"><table class="docs-table"><thead><tr><th>Document</th><th>Status</th><th>Purpose</th></tr></thead><tbody>';
    html += result.documents.map((row) => `<tr><td>${escapeHtml(row[0])}</td><td><span class="status-chip">${escapeHtml(row[1])}</span></td><td>${escapeHtml(row[2])}</td></tr>`).join('');
    html += '</tbody></table></div>';
  }
  if (result.escalation) html += `<h4 class="output-section-title">Escalation trigger</h4><div class="summary-box">${escapeHtml(result.escalation)}</div>`;
  if (result.assumptions) html += listSection('Details to verify', result.assumptions, false);
  if (result.subject) {
    lastEmailText = `${result.subject}\n\n${result.body || ''}`;
    html += `<h4 class="output-section-title">${escapeHtml(result.subject)}</h4><pre class="email-draft">${escapeHtml(result.body)}</pre><div class="copy-row"><button type="button" class="copy-btn" id="copyEmailBtn">Copy email draft ↗</button></div>`;
  }
  if (result.warning) html += `<div class="warning-box">${escapeHtml(result.warning)}</div>`;
  output.innerHTML = html || '<div class="empty-state"><h4>No output was returned.</h4></div>';
  resultSubtitle.textContent = ({ shipment: 'Shipment analysis generated from the supplied scenario.', docs: 'Document checks to verify against actual shipment requirements.', exception: 'Recovery actions and escalation guidance generated.', email: 'A neutral customer email draft is ready for review.' })[task] || 'Structured result generated.';
  const copyButton = $('copyEmailBtn');
  if (copyButton) copyButton.addEventListener('click', copyEmail);
}

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(lastEmailText);
    $('copyEmailBtn').textContent = 'Copied';
  } catch (_) {
    const area = document.createElement('textarea');
    area.value = lastEmailText;
    area.style.position = 'fixed'; area.style.opacity = '0';
    document.body.appendChild(area); area.select();
    const ok = document.execCommand('copy');
    area.remove();
    $('copyEmailBtn').textContent = ok ? 'Copied' : 'Select and copy manually';
  }
}

function runEvaluation() {
  // Evaluation is the same fifth task included in the existing Flask prototype.
  runTask('evaluation');
  $('workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => loadPreset(Number(button.dataset.preset))));
document.querySelectorAll('[data-task]').forEach((button) => button.addEventListener('click', () => runTask(button.dataset.task)));
$('clearBtn').addEventListener('click', clearForm);
$('evalBtn').addEventListener('click', runEvaluation);
