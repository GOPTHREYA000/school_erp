from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('announcements', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='announcement',
            name='recipient_email',
            field=models.EmailField(
                blank=True,
                help_text='When target_audience is INDIVIDUAL: recipient must match an active user email in the tenant.',
                max_length=254,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name='announcement',
            name='target_audience',
            field=models.CharField(
                choices=[
                    ('ALL', 'All'),
                    ('PARENTS', 'Parents'),
                    ('TEACHERS', 'Teachers'),
                    ('STAFF', 'All staff (non-parent)'),
                    ('CLASS', 'Specific Classes'),
                    ('INDIVIDUAL', 'One person (by email)'),
                ],
                max_length=12,
            ),
        ),
    ]
