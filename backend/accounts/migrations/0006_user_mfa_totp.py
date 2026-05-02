from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_add_must_change_password'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='mfa_totp_secret',
            field=models.CharField(
                blank=True,
                default='',
                max_length=64,
                help_text='Base32 TOTP secret (empty until user enrolls).',
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='mfa_enabled',
            field=models.BooleanField(default=False),
        ),
    ]
