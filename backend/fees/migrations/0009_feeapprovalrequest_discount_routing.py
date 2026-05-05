# Generated manually for fee approval routing

from decimal import Decimal

from django.db import migrations, models


def backfill_discount_and_routing(apps, schema_editor):
    FeeApprovalRequest = apps.get_model('fees', 'FeeApprovalRequest')
    for r in FeeApprovalRequest.objects.select_related('branch').all().iterator():
        d = r.standard_total - r.offered_total
        if d < 0:
            d = Decimal('0')
        zone_id = getattr(r.branch, 'zone_id', None)
        # Inclusive ₹2,000 ceiling for zonal routing (matches fees.approval_routing.FEE_DISCOUNT_ZONAL_MAX).
        routing = 'ZONAL' if zone_id and d <= Decimal('2000') else 'TENANT_SUPER'
        FeeApprovalRequest.objects.filter(pk=r.pk).update(discount_amount=d, routing=routing)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('fees', '0008_feecarryforward_feestructure_finalized_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='feeapprovalrequest',
            name='discount_amount',
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                help_text='standard_total − offered_total at request time',
                max_digits=10,
            ),
        ),
        migrations.AddField(
            model_name='feeapprovalrequest',
            name='routing',
            field=models.CharField(
                choices=[('ZONAL', 'Zonal admin'), ('TENANT_SUPER', 'School admin')],
                default='TENANT_SUPER',
                max_length=20,
            ),
        ),
        migrations.RunPython(backfill_discount_and_routing, noop),
    ]
