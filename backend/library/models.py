import uuid
from django.db import models
from django.conf import settings

class Book(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='library_books')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE, related_name='library_books')
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=200)
    isbn = models.CharField(max_length=20, blank=True)
    publisher = models.CharField(max_length=200, blank=True)
    total_copies = models.IntegerField(default=1)
    available_copies = models.IntegerField(default=1)
    location = models.CharField(max_length=100, blank=True, help_text="e.g. Rack A1, Shelf 3")

    def __str__(self):
        return f"{self.title} by {self.author}"

class IssueLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='issue_logs')
    issued_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='issued_books')
    issued_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    returned_date = models.DateField(null=True, blank=True)
    fine_amount = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    status = models.CharField(max_length=15, choices=[('ISSUED', 'Issued'), ('RETURNED', 'Returned'), ('LOST', 'Lost')], default='ISSUED')

    def save(self, *args, **kwargs):
        if not self.pk and self.status == 'ISSUED':
            self.book.available_copies -= 1
            self.book.save()
        elif self.pk:
            old_log = IssueLog.objects.get(pk=self.pk)
            # if transitioning from ISUSED to RETURNED
            if old_log.status == 'ISSUED' and self.status in ['RETURNED', 'LOST']:
                if self.status == 'RETURNED':
                    self.book.available_copies += 1
                # If lost, the copy is not available anymore. Total copies might need adjustment later
                self.book.save()
        super().save(*args, **kwargs)
