import logging
from django.template import Template, Context
logger = logging.getLogger(__name__)


def generate_pdf_from_template(template, context_dict: dict) -> bytes:
    try:
        from weasyprint import HTML
    except (ImportError, OSError, Exception) as e:
        logger.error(f"WeasyPrint not installed or missing C libraries: {e}")
        raise Exception(
            "It looks like your local machine is missing the underlying C-libraries required by WeasyPrint (like pango) to build PDFs locally. "
            "Please run `brew install pango pangoft2` in your Mac terminal, or preview on the deployed server."
        )
        
    html_content = ""
    
    if template.mode == 'HTML' and template.raw_html:
        django_template = Template(template.raw_html)
        html_content = django_template.render(Context(context_dict))
    else:
        cfg = template.config_data or {}
        
        bg_color = cfg.get('background_color', '#ffffff')
        text_color = cfg.get('text_color', '#333333')
        primary_color = cfg.get('primary_color', '#1a56db')
        school_name = cfg.get('school_name') or context_dict.get('tenant_name', 'School Name')
        logo_url = context_dict.get('tenant_logo', '')
        address = context_dict.get('tenant_address', '')
        city = context_dict.get('tenant_city', '')
        state = context_dict.get('tenant_state', '')
        branch_name = context_dict.get('branch_name', '')
        
        if template.type == 'ID_CARD':
            html_content = _build_id_card_html(context_dict, cfg, school_name, logo_url, primary_color, bg_color, text_color, branch_name)
        elif template.type == 'FEE_RECEIPT':
            html_content = _build_fee_receipt_html(context_dict, cfg, school_name, logo_url, primary_color, bg_color, text_color, address, city, state, branch_name)
        else:
            html_content = f"<html><body><h1>Document type {template.type} not configured fully.</h1></body></html>"

    pdf_file = HTML(string=html_content).write_pdf()
    return pdf_file


def _build_id_card_html(ctx, cfg, school_name, logo_url, primary, bg, text, branch):
    student = ctx.get('student', {})
    logo_html = f'<img src="{logo_url}" style="width:50px;height:50px;object-fit:contain;border-radius:6px;" />' if logo_url else '<div style="width:50px;height:50px;background:#e2e8f0;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:20px;color:#64748b;">🏫</div>'
    
    return f"""
    <html>
    <head>
    <style>
        @page {{ size: 85.6mm 53.98mm; margin: 0; }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: 'Helvetica Neue', Arial, sans-serif; width: 85.6mm; height: 53.98mm; }}
        .card {{
            width: 100%; height: 100%;
            background: linear-gradient(135deg, {bg} 0%, #f1f5f9 100%);
            color: {text};
            padding: 8mm 6mm;
            position: relative;
            overflow: hidden;
        }}
        .card::before {{
            content: ''; position: absolute; top: 0; left: 0; right: 0;
            height: 3mm; background: linear-gradient(90deg, {primary}, {primary}cc);
        }}
        .header {{ display: flex; align-items: center; gap: 3mm; margin-top: 1mm; margin-bottom: 3mm; }}
        .school-info h1 {{ font-size: 9pt; font-weight: 800; color: {primary}; letter-spacing: 0.5px; }}
        .school-info p {{ font-size: 6pt; color: #64748b; }}
        .student-info {{ display: flex; flex-direction: column; gap: 1.5mm; }}
        .field {{ display: flex; gap: 2mm; font-size: 7pt; }}
        .field .label {{ color: #94a3b8; font-weight: 700; text-transform: uppercase; font-size: 5pt; letter-spacing: 0.5px; min-width: 18mm; }}
        .field .value {{ color: {text}; font-weight: 600; }}
        .student-name {{ font-size: 10pt; font-weight: 800; color: {text}; margin-bottom: 1mm; }}
    </style>
    </head>
    <body>
        <div class="card">
            <div class="header">
                {logo_html}
                <div class="school-info">
                    <h1>{school_name}</h1>
                    <p>{branch}</p>
                </div>
            </div>
            <div class="student-name">{student.get('first_name', '')} {student.get('last_name', '')}</div>
            <div class="student-info">
                <div class="field"><span class="label">Adm No</span><span class="value">{student.get('admission_number', '')}</span></div>
                <div class="field"><span class="label">Class</span><span class="value">{student.get('class_section', '')}</span></div>
                <div class="field"><span class="label">DOB</span><span class="value">{student.get('date_of_birth', '')}</span></div>
                <div class="field"><span class="label">Guardian</span><span class="value">{student.get('guardian_name', '')}</span></div>
                <div class="field"><span class="label">Contact</span><span class="value">{student.get('contact', '')}</span></div>
            </div>
        </div>
    </body>
    </html>
    """


def _build_fee_receipt_html(ctx, cfg, school_name, logo_url, primary, bg, text, address, city, state, branch):
    student = ctx.get('student', {})
    invoice = ctx.get('invoice', {})
    payment = ctx.get('payment', {})
    
    logo_html = f'<img src="{logo_url}" style="height:100px;max-width:300px;object-fit:contain;margin-bottom:12px;" />' if logo_url else '<div style="width:100px;height:100px;margin:0 auto 12px auto;background:linear-gradient(135deg,{primary},{primary}aa);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:40px;color:white;">🏫</div>'
    
    address_parts = [p for p in [address, city, state] if p]
    address_line = ', '.join(address_parts) if address_parts else ''

    return f"""
    <html>
    <head>
    <style>
        @page {{ size: A4; margin: 15mm; }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Helvetica Neue', Arial, sans-serif;
            color: {text};
            background: {bg};
            font-size: 10pt;
            line-height: 1.5;
        }}
        .receipt {{
            max-width: 180mm;
            margin: 0 auto;
            border: 1.5px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            background: white;
        }}
        .receipt-header {{
            background: white;
            color: {text};
            padding: 25px 20px 15px 20px;
            text-align: center;
        }}
        .receipt-header h1 {{ font-size: 18pt; font-weight: 800; color: {primary}; margin-bottom: 4px; }}
        .receipt-header p {{ font-size: 9pt; opacity: 0.7; color: #64748b; }}
        .receipt-badge {{
            text-align: center;
            padding: 8px;
            background: #f0fdf4;
            border-bottom: 1px solid #e2e8f0;
        }}
        .receipt-badge span {{
            background: #16a34a;
            color: white;
            padding: 4px 16px;
            border-radius: 20px;
            font-size: 8pt;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
        }}
        .receipt-body {{ padding: 20px; }}
        .meta-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
        }}
        .meta-item {{
            padding: 10px 14px;
            background: #f8fafc;
            border-radius: 6px;
            border: 1px solid #f1f5f9;
        }}
        .meta-label {{
            font-size: 7pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #94a3b8;
            margin-bottom: 2px;
        }}
        .meta-value {{
            font-size: 10pt;
            font-weight: 600;
            color: {text};
        }}
        .amount-box {{
            text-align: center;
            padding: 18px;
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            border: 2px solid #bbf7d0;
            border-radius: 8px;
            margin: 16px 0;
        }}
        .amount-box .label {{ font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #16a34a; }}
        .amount-box .value {{ font-size: 22pt; font-weight: 800; color: #15803d; margin-top: 4px; }}
        .divider {{
            border: none;
            border-top: 1px dashed #e2e8f0;
            margin: 16px 0;
        }}
        .footer {{
            text-align: center;
            padding: 12px 20px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            font-size: 7pt;
            color: #94a3b8;
        }}
        .footer p {{ margin: 2px 0; }}
        .sig-area {{
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            padding-top: 10px;
        }}
        .sig-block {{ text-align: center; }}
        .sig-block .line {{ width: 100px; border-top: 1px solid #cbd5e1; margin-bottom: 4px; }}
        .sig-block .title {{ font-size: 7pt; color: #94a3b8; font-weight: 600; text-transform: uppercase; }}
    </style>
    </head>
    <body>
        <div class="receipt">
            <div class="receipt-header">
                {logo_html}
                <div>
                    <h1>{school_name}</h1>
                    <p>{branch}{(' • ' + address_line) if address_line else ''}</p>
                </div>
            </div>

            <div class="receipt-badge">
                <span>✓ Fee Receipt</span>
            </div>

            <div class="receipt-body">
                <div class="meta-grid">
                    <div class="meta-item">
                        <div class="meta-label">Receipt Number</div>
                        <div class="meta-value">{payment.get('receipt_number', '')}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Payment Date</div>
                        <div class="meta-value">{payment.get('payment_date', '')}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Student Name</div>
                        <div class="meta-value">{student.get('first_name', '')} {student.get('last_name', '')}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Admission Number</div>
                        <div class="meta-value">{student.get('admission_number', '')}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Class / Section</div>
                        <div class="meta-value">{student.get('class_section', '-')}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Academic Year</div>
                        <div class="meta-value">{invoice.get('academic_year', '-')}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Invoice Number</div>
                        <div class="meta-value">{invoice.get('invoice_number', '-')}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Payment Mode</div>
                        <div class="meta-value">{payment.get('payment_mode', 'CASH')}</div>
                    </div>
                </div>

                <div class="amount-box">
                    <div class="label">Amount Received</div>
                    <div class="value">₹{payment.get('amount', '0.00')}</div>
                </div>

                <div class="meta-grid">
                    <div class="meta-item">
                        <div class="meta-label">Total Invoice Amount</div>
                        <div class="meta-value">₹{invoice.get('net_amount', '-')}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Balance Outstanding</div>
                        <div class="meta-value">₹{invoice.get('outstanding_amount', '-')}</div>
                    </div>
                </div>

                {'<div class="meta-item" style="margin-bottom:10px;"><div class="meta-label">Reference / Txn ID</div><div class="meta-value">' + payment.get('reference_number', '') + '</div></div>' if payment.get('reference_number') else ''}

                <div class="sig-area">
                    <div class="sig-block">
                        <div class="line"></div>
                        <div class="title">Collected By: {payment.get('collected_by', '')}</div>
                    </div>
                    <div class="sig-block">
                        <div class="line"></div>
                        <div class="title">Authorized Signatory</div>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p>This is a computer-generated receipt and does not require a physical signature.</p>
                <p>{school_name} • {address_line}</p>
            </div>
        </div>
    </body>
    </html>
    """
