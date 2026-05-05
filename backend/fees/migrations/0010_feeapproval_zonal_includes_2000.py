# Zonal routing includes discount amount exactly ₹2,000 (was exclusive before).

from decimal import Decimal

from django.db import migrations


def recompute_routing_inclusive_2000(apps, schema_editor):
    FeeApprovalRequest = apps.get_model('fees', 'FeeApprovalRequest')
    for r in FeeApprovalRequest.objects.select_related('branch').all().iterator():
        d = r.discount_amount
        if d is None:
            d = r.standard_total - r.offered_total
        if d < 0:
            d = Decimal('0')
        zone_id = getattr(r.branch, 'zone_id', None)
        routing = 'ZONAL' if zone_id and d <= Decimal('2000') else 'TENANT_SUPER'
        if r.routing != routing or r.discount_amount != d:
            FeeApprovalRequest.objects.filter(pk=r.pk).update(
                discount_amount=d,
                routing=routing,
            )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('fees', '0009_feeapprovalrequest_discount_routing'),
    ]

    operations = [
        migrations.RunPython(recompute_routing_inclusive_2000, noop),
    ]
