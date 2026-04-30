from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsSchoolAdminOrAbove, IsAccountantOrAbove
from django.http import HttpResponse

from .models import DocumentTemplate
from .serializers import DocumentTemplateSerializer
from .services import generate_pdf_from_template

class DocumentTemplateViewSet(viewsets.ModelViewSet):
    """
    CRUD API for storing dynamic HTML and configuration-based templates.
    """
    serializer_class = DocumentTemplateSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdminOrAbove]

    def get_queryset(self):
        user = self.request.user
        qs = DocumentTemplate.objects.filter(tenant=user.tenant)
        
        template_type = self.request.query_params.get('type')
        if template_type:
            qs = qs.filter(type=template_type)
            
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        branch = None
        if user.role != 'SUPER_ADMIN':
            branch = user.branch if getattr(user, 'branch', None) else None
        serializer.save(tenant=user.tenant, branch=branch, created_by=user)

    @action(detail=False, methods=['get'], url_path='generate/student/(?P<student_id>[^/.]+)')
    def generate_id_card(self, request, student_id=None):
        """
        Generates PDF for a student ID Card using the default ID_CARD template.
        """
        from students.models import Student
        try:
            student = Student.objects.get(id=student_id, tenant=request.user.tenant)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

        template = DocumentTemplate.objects.filter(
            tenant=request.user.tenant, type='ID_CARD', is_active=True
        ).order_by('-is_default', '-created_at').first()

        if not template:
            return Response({'error': 'No active ID Card template found.'}, status=status.HTTP_400_BAD_REQUEST)

        context = {
            'tenant_name': student.tenant.name,
            'tenant_logo': student.tenant.logo_url or '',
            'tenant_address': student.tenant.address or '',
            'tenant_city': student.tenant.city or '',
            'tenant_state': student.tenant.state or '',
            'branch_name': student.branch.name if student.branch else '',
            'student': {
                'first_name': student.first_name,
                'last_name': student.last_name,
                'admission_number': student.admission_number or '',
                'date_of_birth': str(student.date_of_birth) if student.date_of_birth else '',
                'class_section': str(student.class_section) if student.class_section else '',
                'guardian_name': student.guardian_name if hasattr(student, 'guardian_name') and student.guardian_name else '',
                'contact': student.phone if hasattr(student, 'phone') and student.phone else '',
                'blood_group': student.blood_group if hasattr(student, 'blood_group') and student.blood_group else '',
            }
        }
        
        try:
            pdf_bytes = generate_pdf_from_template(template, context)
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="ID_CARD_{student.admission_number}.pdf"'
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='generate/receipt/(?P<payment_id>[^/.]+)', permission_classes=[IsAuthenticated])
    def generate_receipt(self, request, payment_id=None):
        """
        Generates PDF for a Fee Receipt using the default FEE_RECEIPT template.
        """
        from fees.models import Payment
        try:
            payment = Payment.objects.get(id=payment_id, tenant=request.user.tenant)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found.'}, status=status.HTTP_404_NOT_FOUND)

        template = DocumentTemplate.objects.filter(
            tenant=request.user.tenant, type='FEE_RECEIPT', is_active=True
        ).order_by('-is_default', '-created_at').first()

        if not template:
            return Response({'error': 'No active Fee Receipt template found.'}, status=status.HTTP_400_BAD_REQUEST)

        invoice = payment.invoice
        student = payment.student
        context = {
            'tenant_name': request.user.tenant.name,
            'tenant_logo': request.user.tenant.logo_url or '',
            'tenant_address': request.user.tenant.address or '',
            'tenant_city': request.user.tenant.city or '',
            'tenant_state': request.user.tenant.state or '',
            'branch_name': invoice.branch.name if invoice.branch else '',
            'student': {
                'first_name': student.first_name,
                'last_name': student.last_name,
                'admission_number': student.admission_number or '',
                'class_section': str(student.class_section) if student.class_section else '',
            },
            'invoice': {
                'invoice_number': invoice.invoice_number,
                'month': invoice.month or '',
                'net_amount': str(invoice.net_amount),
                'outstanding_amount': str(invoice.outstanding_amount),
                'academic_year': str(invoice.academic_year) if invoice.academic_year else '',
            },
            'payment': {
                'receipt_number': payment.receipt_number,
                'amount': str(payment.amount),
                'payment_date': str(payment.payment_date),
                'payment_mode': payment.payment_mode,
                'reference_number': payment.reference_number or '',
                'collected_by': f'{payment.collected_by.first_name} {payment.collected_by.last_name}' if payment.collected_by else '',
            }
        }
        
        try:
            pdf_bytes = generate_pdf_from_template(template, context)
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="RECEIPT_{payment.receipt_number}.pdf"'
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='preview')
    def preview_template(self, request):
        """
        Generates a preview PDF from an unsaved template payload.
        """
        data = request.data
        mode = data.get('mode', 'CONFIG')
        template_type = data.get('type', 'ID_CARD')
        
        # Create an unsaved dummy template object
        dummy_template = DocumentTemplate(
            name="Preview",
            type=template_type,
            mode=mode,
            config_data=data.get('config_data', {}),
            raw_html=data.get('raw_html', ''),
            tenant=request.user.tenant
        )

        context = {
            'tenant_name': request.user.tenant.name or "Demo School",
            'tenant_logo': request.user.tenant.logo_url or '',
            'tenant_address': request.user.tenant.address or '123 School Road',
            'tenant_city': request.user.tenant.city or 'City',
            'tenant_state': request.user.tenant.state or 'State',
            'branch_name': 'Main Branch',
            'student': {
                'first_name': 'John',
                'last_name': 'Doe',
                'admission_number': 'STD-2026-001',
                'date_of_birth': '2010-05-15',
                'class_section': 'Grade 5 - A',
                'guardian_name': 'Jane Doe',
                'contact': '9876543210',
            },
            'invoice': {
                'invoice_number': 'INV-MAIN-2026-04-0001',
                'month': '2026-04',
                'net_amount': '15000.00',
                'outstanding_amount': '5000.00',
                'academic_year': '2025-2026',
            },
            'payment': {
                'receipt_number': 'REC-9999',
                'amount': '10000.00',
                'payment_date': '2026-04-28',
                'payment_mode': 'UPI',
                'reference_number': 'TXN-ABC123456',
                'collected_by': 'Office Staff',
            }
        }

        try:
            pdf_bytes = generate_pdf_from_template(dummy_template, context)
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = 'inline; filename="PREVIEW.pdf"'
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='generate/bulk-id-cards')
    def bulk_id_cards(self, request):
        """
        Generates a multi-page PDF containing ID cards for multiple students.
        Accepts: { student_ids: [...] } OR { class_section_id: "..." } OR { branch_id: "..." }
        """
        from students.models import Student

        student_ids = request.data.get('student_ids', [])
        class_section_id = request.data.get('class_section_id')
        branch_id = request.data.get('branch_id')

        students = Student.objects.filter(tenant=request.user.tenant, status='ACTIVE')
        if student_ids:
            students = students.filter(id__in=student_ids)
        elif class_section_id:
            students = students.filter(class_section_id=class_section_id)
        elif branch_id:
            students = students.filter(branch_id=branch_id)
        else:
            return Response({'error': 'Provide student_ids, class_section_id, or branch_id.'}, status=400)

        if not students.exists():
            return Response({'error': 'No active students found for the given filter.'}, status=404)

        template = DocumentTemplate.objects.filter(
            tenant=request.user.tenant, type='ID_CARD', is_active=True
        ).order_by('-is_default', '-created_at').first()

        if not template:
            return Response({'error': 'No active ID Card template found. Create one in System Settings → Templates.'}, status=400)

        try:
            from weasyprint import HTML
        except (ImportError, OSError, Exception) as e:
            return Response({'error': f'WeasyPrint not available: {e}'}, status=500)

        from .services import _build_id_card_html

        html_pages = []
        cfg = template.config_data or {}
        primary = cfg.get('primary_color', '#1a56db')
        bg = cfg.get('background_color', '#ffffff')
        text = cfg.get('text_color', '#1e293b')

        for student in students.select_related('tenant', 'branch', 'class_section'):
            school_name = cfg.get('school_name') or student.tenant.name
            logo_url = student.tenant.logo_url or ''
            branch_name = student.branch.name if student.branch else ''

            ctx = {
                'tenant_name': school_name,
                'tenant_logo': logo_url,
                'branch_name': branch_name,
                'student': {
                    'first_name': student.first_name,
                    'last_name': student.last_name,
                    'admission_number': student.admission_number or '',
                    'date_of_birth': str(student.date_of_birth) if student.date_of_birth else '',
                    'class_section': str(student.class_section) if student.class_section else '',
                    'guardian_name': student.guardian_name if hasattr(student, 'guardian_name') and student.guardian_name else '',
                    'contact': student.phone if hasattr(student, 'phone') and student.phone else '',
                    'blood_group': student.blood_group if hasattr(student, 'blood_group') and student.blood_group else '',
                }
            }
            page_html = _build_id_card_html(ctx, cfg, school_name, logo_url, primary, bg, text, branch_name)
            html_pages.append(page_html)

        # Merge all pages into one HTML document
        combined_html = f"""
        <html>
        <head>
        <style>
            @page {{ size: 85.6mm 53.98mm; margin: 0; }}
            .page-break {{ page-break-after: always; }}
        </style>
        </head>
        <body>
        {''.join(f'<div class="page-break">{self._extract_body(page)}</div>' for page in html_pages)}
        </body>
        </html>
        """

        try:
            pdf_bytes = HTML(string=combined_html).write_pdf()
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="ID_Cards_Bulk_{len(html_pages)}.pdf"'
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @staticmethod
    def _extract_body(html_string: str) -> str:
        """Extract content between <body> tags from an HTML string."""
        import re
        match = re.search(r'<body[^>]*>(.*?)</body>', html_string, re.DOTALL)
        return match.group(1) if match else html_string
