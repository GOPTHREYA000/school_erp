from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'fees/categories', views.FeeCategoryViewSet, basename='feecategory')
router.register(r'fees/structures', views.FeeStructureViewSet, basename='feestructure')
router.register(r'fees/structure-items', views.FeeStructureItemViewSet, basename='feestructureitem')
router.register(r'fees/concessions', views.FeeConcessionViewSet, basename='feeconcession')
router.register(r'fees/late-rules', views.LateFeeRuleViewSet, basename='latefeerule')
router.register(r'fees/invoices', views.FeeInvoiceViewSet, basename='feeinvoice')
router.register(r'fees/student-fees', views.StudentFeeItemViewSet, basename='studentfeeitem')
router.register(r'fees/approvals', views.FeeApprovalRequestViewSet, basename='feeapprovalrequest')
router.register(r'payments', views.PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
]
