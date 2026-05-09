from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0015_student_legacy_admission_number'),
    ]

    operations = [
        migrations.AddField(
            model_name='student',
            name='admission_fee_marked_paid_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='admission_fee_marked_paid_earlier',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='student',
            name='fixed_deposit_marked_paid_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='fixed_deposit_marked_paid_earlier',
            field=models.BooleanField(default=False),
        ),
    ]

