from django.contrib import admin
from .models import (
    FeeCategory, FeeStructure, FeeStructureItem, StudentWallet,
    FeeConcession, StudentConcession, LateFeeRule,
    FeeInvoice, FeeInvoiceItem, Payment,
)

@admin.register(FeeCategory)
class FeeCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'branch', 'is_active']

@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ['name', 'branch', 'grade', 'academic_year', 'is_active']

@admin.register(FeeInvoice)
class FeeInvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'student', 'net_amount', 'paid_amount', 'outstanding_amount', 'status']
    list_filter = ['status']

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['receipt_number', 'student', 'amount', 'payment_mode', 'status']
    list_filter = ['status', 'payment_mode']

admin.site.register(FeeStructureItem)
admin.site.register(StudentWallet)
admin.site.register(FeeConcession)
admin.site.register(StudentConcession)
admin.site.register(LateFeeRule)
admin.site.register(FeeInvoiceItem)
