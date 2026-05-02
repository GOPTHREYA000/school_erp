# Generated manually for FEE_REMINDER event type

from django.db import migrations, models

_EVENT_CHOICES = [
    ('INVOICE_GENERATED', 'Invoice Generated'),
    ('PAYMENT_CONFIRMED', 'Payment Confirmed'),
    ('PAYMENT_OVERDUE', 'Payment Overdue'),
    ('ABSENCE_ALERT', 'Absence Alert'),
    ('ANNOUNCEMENT_PUBLISHED', 'Announcement Published'),
    ('HOMEWORK_POSTED', 'Homework Posted'),
    ('PASSWORD_RESET', 'Password Reset'),
    ('WELCOME_ENROLLMENT', 'Welcome Enrollment'),
    ('FEE_REMINDER_3DAYS', 'Fee Reminder 3 Days'),
    ('FEE_REMINDER', 'Fee Reminder'),
    ('CUSTOM_ANNOUNCEMENT', 'Custom Announcement'),
]


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0003_alter_notificationlog_event_type_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notificationlog',
            name='event_type',
            field=models.CharField(choices=_EVENT_CHOICES, max_length=30),
        ),
        migrations.AlterField(
            model_name='notificationtemplate',
            name='event_type',
            field=models.CharField(choices=_EVENT_CHOICES, max_length=30),
        ),
    ]
