from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0014_csvimportjob'),
    ]

    operations = [
        migrations.AddField(
            model_name='student',
            name='legacy_admission_number',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
    ]
