from django.db import migrations, models
import django.db.models.deletion
import uuid


def backfill_branch_zones(apps, schema_editor):
    Tenant = apps.get_model('tenants', 'Tenant')
    Zone = apps.get_model('tenants', 'Zone')
    Branch = apps.get_model('tenants', 'Branch')

    for tenant in Tenant.objects.all().iterator():
        default_zone, _ = Zone.objects.get_or_create(
            tenant=tenant,
            name='Default Zone',
            defaults={'is_active': True},
        )
        Branch.objects.filter(tenant=tenant, zone__isnull=True).update(zone=default_zone)


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0007_academicyear_closed_at_academicyear_closed_by_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Zone',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=120)),
                ('is_active', models.BooleanField(default=True)),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='zones', to='tenants.tenant')),
            ],
            options={
                'unique_together': {('tenant', 'name')},
            },
        ),
        migrations.AddField(
            model_name='branch',
            name='zone',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='branches', to='tenants.zone'),
        ),
        migrations.RunPython(backfill_branch_zones, migrations.RunPython.noop),
    ]
