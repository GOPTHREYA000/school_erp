from django.contrib import admin
from .models import ExpenseCategory, Vendor, Expense, TransactionLog

@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'branch', 'is_active']
@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'branch', 'is_active']
@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['title', 'amount', 'status', 'expense_date']
    list_filter = ['status']
@admin.register(TransactionLog)
class TransactionLogAdmin(admin.ModelAdmin):
    list_display = ['transaction_type', 'category', 'amount', 'transaction_date']
