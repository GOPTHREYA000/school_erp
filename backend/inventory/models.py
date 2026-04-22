import uuid
from django.db import models

class ItemCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='item_categories')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE, related_name='item_categories')
    name = models.CharField(max_length=100) # e.g. "Stationery", "Lab Equipment"
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Item(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='inventory_items')
    branch = models.ForeignKey('tenants.Branch', on_delete=models.CASCADE, related_name='inventory_items')
    category = models.ForeignKey(ItemCategory, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=200)
    current_stock = models.IntegerField(default=0)
    unit = models.CharField(max_length=20, default='pcs') # pcs, boxes, kg
    reorder_level = models.IntegerField(default=10)

    def __str__(self):
        return self.name

class StockLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='stock_logs')
    transaction_type = models.CharField(max_length=10, choices=[('IN', 'Stock In'), ('OUT', 'Stock Out')])
    quantity = models.IntegerField()
    date = models.DateField(auto_now_add=True)
    remarks = models.CharField(max_length=200, blank=True)

    def save(self, *args, **kwargs):
        if not self.pk:
            if self.transaction_type == 'IN':
                self.item.current_stock += self.quantity
            else:
                self.item.current_stock -= self.quantity
            self.item.save()
        super().save(*args, **kwargs)
