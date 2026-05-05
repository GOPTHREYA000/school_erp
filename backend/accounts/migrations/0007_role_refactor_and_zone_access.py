from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0008_zone_branch_zone'),
        ('accounts', '0006_user_mfa_totp'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('OWNER', 'Owner (Platform Level)'),
                    ('SUPER_ADMIN', 'Super Admin (Tenant Level)'),
                    ('ZONAL_ADMIN', 'Zonal Admin'),
                    ('CHIEF_ACCOUNTANT', 'Chief Accountant'),
                    ('PRINCIPAL', 'Principal'),
                    ('BRANCH_ADMIN', 'Branch Admin (School Level)'),
                    ('ACCOUNTANT', 'Accountant'),
                    ('TEACHER', 'Teacher'),
                    ('STUDENT', 'Student'),
                    ('PARENT', 'Parent'),
                    ('SCHOOL_ADMIN', 'School Admin (Legacy)'),
                ],
                max_length=30,
            ),
        ),
        migrations.CreateModel(
            name='UserZoneAccess',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='zone_accesses', to='accounts.user')),
                ('zone', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_accesses', to='tenants.zone')),
            ],
            options={
                'unique_together': {('user', 'zone')},
            },
        ),
        migrations.AddField(
            model_name='user',
            name='zones',
            field=models.ManyToManyField(blank=True, related_name='users', through='accounts.UserZoneAccess', to='tenants.zone'),
        ),
    ]
