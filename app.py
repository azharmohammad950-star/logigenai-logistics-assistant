import os
import json
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

# Safe academic default: deterministic Demo Mode; no API credits are consumed.
FORCE_DEMO_MODE = os.getenv('FORCE_DEMO_MODE', 'true').lower() == 'true'

SYSTEM_PROMPT = """You are LogiGenAI, a logistics operations assistant for freight-forwarding workflows.
Use only the shipment information supplied by the user and clearly label assumptions.
Do not invent carrier schedules, rates, ETAs, customs rules, legal requirements, or shipment facts.
For documentation, present items as verify/check unless authoritative requirements are supplied.
For exceptions, identify the issue, possible causes, immediate actions, and escalation triggers.
For customer emails, use professional neutral wording and do not promise unconfirmed schedules.
Return JSON only.
"""

TASKS={'shipment','docs','exception','email','evaluation'}

def clean(value, fallback='Not provided'):
    value=str(value or '').strip()
    return value if value else fallback

def risk_level(issue):
    s=issue.lower()
    if any(x in s for x in ['lost','damage','customs hold','detained','hazard','missing cargo']): return 'High'
    if any(x in s for x in ['delay','delayed','cutoff','documentation','rollover','missed','late','short']): return 'Medium'
    return 'Low'

def build_demo_response(task, shipment):
    st=clean(shipment.get('shipment_type')); pol=clean(shipment.get('pol')); pod=clean(shipment.get('pod'))
    cargo=clean(shipment.get('cargo')); weight=clean(shipment.get('weight')); cbm=clean(shipment.get('cbm')); issue=clean(shipment.get('issue'))
    if task=='shipment':
        return {'summary':f'The shipment is a {st} movement from {pol} to {pod}, involving {cargo} cargo. The stated operational issue is: {issue}',
        'risk_level':risk_level(issue),
        'issues':[issue,f'The next feasible operational milestone for this {st.lower()} movement needs to be confirmed.','Shipment documentation, cargo readiness and customer communication should be checked.'],
        'actions':['Verify current cargo readiness and warehouse/CFS receiving status.','Confirm the next available operational milestone, consolidation or sailing with the relevant provider.','Verify documentation completeness before the next movement.','Update the shipment record with the latest confirmed milestone.','Communicate the verified status and next step to the customer.'],
        'assumptions':[f'POL entered by user: {pol}; POD entered by user: {pod}.',f'Cargo entered by user: {cargo}; weight: {weight}; CBM: {cbm}.','No carrier-specific schedule, contractual SLA or legal/customs source was supplied.']}
    if task=='docs':
        return {'summary':f'For this {st.lower()} shipment from {pol} to {pod}, the following project-level document checks should be verified against actual carrier, forwarder, origin, destination and cargo requirements.',
        'documents':[['Commercial Invoice','Verify','Check commercial/value information and shipment references.'],['Packing List','Verify','Check packages, cargo description and packing details.'],['Shipping Instructions','Verify','Check information needed for transport documentation.'],['Shipping Bill / export filing evidence','Verify','Confirm the applicable export filing process where relevant.'],['VGM / weight information','Verify',f'Check the declared shipment weight: {weight}.'],['Customer-specific documents','Check',f'Confirm requirements for {cargo} and destination {pod}.']],
        'warning':'This checklist is an operational aid for the academic prototype and is not legal or customs advice.'}
    if task=='exception':
        return {'summary':f'The current exception for the {st.lower()} shipment from {pol} to {pod} is: {issue}. The immediate objective is to establish the next feasible movement while preventing additional delays.',
        'possible_causes':['Cargo was not received before the applicable cutoff.','Documentation or approval was incomplete.','Warehouse/CFS receiving coordination was delayed.','Booking or consolidation capacity changed.'],
        'actions':['Confirm the exact missed or delayed milestone and its timestamp.','Check cargo physical status and receiving confirmation.','Verify documentation status and outstanding approvals.','Check the next available operational movement with the relevant provider.','Record the confirmed root cause and revised milestone.','Communicate the revised plan to the customer.'],
        'escalation':'Escalate when the revised movement affects a committed customer delivery date, creates storage/demurrage exposure, or requires a commercial decision.'}
    if task=='email':
        return {'subject':f'Shipment Update: {pol} to {pod}','body':('Dear Customer,\n\n' + f'We would like to provide an update regarding your {st.lower()} shipment from {pol} to {pod} involving {cargo} cargo.\n\n' + f'Current issue: {issue}\n\n' + 'We are checking the shipment status, documentation and the next available operational milestone. We will share the confirmed update once the relevant details have been verified.\n\nRegards,\nLogistics Operations Team')}
    if task=='evaluation':
        return {'criteria':[['Factuality','Pass','Uses user-entered shipment facts and avoids invented schedules.'],['Relevance','Pass','Outputs stay focused on logistics operations.'],['Completeness','Pass','Task-specific output contains the expected sections.'],['Assumption Control','Pass','Unknown carrier/customs details are clearly marked for verification.'],['Human Verification','Required','An operator must validate any output before operational use.']],
        'note':'This is a prototype evaluation rubric for the academic demonstration; it is not a statistical accuracy benchmark.'}
    raise ValueError('Unsupported task')

def call_ai(task, shipment):
    if FORCE_DEMO_MODE or not os.getenv('OPENAI_API_KEY'):
        return build_demo_response(task, shipment), True
    try:
        from openai import OpenAI
        client=OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        response=client.responses.create(model=os.getenv('OPENAI_MODEL','gpt-5.6-luna'), instructions=SYSTEM_PROMPT, input=json.dumps({'task':task,'shipment':shipment},ensure_ascii=False))
        try: return json.loads(response.output_text), False
        except json.JSONDecodeError: return {'summary':response.output_text,'warning':'Review the model output before operational use.'}, False
    except Exception as exc:
        return {'error':'AI request failed','details':str(exc)}, False

@app.route('/')
def index(): return render_template('index.html')

@app.post('/api/analyze')
def analyze():
    data=request.get_json(silent=True) or {}; task=data.get('task','shipment')
    if task not in TASKS: return jsonify({'error':'Unsupported task'}),400
    result,demo=call_ai(task,data.get('shipment',{}))
    return jsonify({'task':task,'demo_mode':demo,'result':result})

if __name__=='__main__': app.run(debug=True)
