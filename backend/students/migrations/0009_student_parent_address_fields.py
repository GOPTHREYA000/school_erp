# Generated manually - Add parent/address/staff fields back to Student model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0008_student_doc_aadhaar_submitted_and_more'),
    ]

    operations = [
        # Parent - Father
        migrations.AddField(
            model_name='student',
            name='father_name',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='father_phone',
            field=models.CharField(blank=True, max_length=15, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='father_email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='father_qualification',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='father_occupation',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='father_aadhaar',
            field=models.CharField(blank=True, max_length=12, null=True),
        ),
        # Parent - Mother
        migrations.AddField(
            model_name='student',
            name='mother_name',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='mother_phone',
            field=models.CharField(blank=True, max_length=15, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='mother_email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='mother_qualification',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='mother_occupation',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='mother_aadhaar',
            field=models.CharField(blank=True, max_length=12, null=True),
        ),
        # Guardian
        migrations.AddField(
            model_name='student',
            name='guardian_name',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='guardian_phone',
            field=models.CharField(blank=True, max_length=15, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='guardian_relation',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        # Address
        migrations.AddField(
            model_name='student',
            name='address_line1',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='apartment_name',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='address_line2',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='landmark',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='city',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='mandal',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='district',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='state',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='pincode',
            field=models.CharField(blank=True, max_length=6, null=True),
        ),
        # Admin Staff
        migrations.AddField(
            model_name='student',
            name='admission_staff_name',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AddField(
            model_name='student',
            name='admission_staff_phone',
            field=models.CharField(blank=True, max_length=15, null=True),
        ),
    ]
