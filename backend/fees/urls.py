from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .online_views import (
    CreateRazorpayOrderView,
    OnlinePaymentConfigView,
    RazorpayWebhookView,
)
from .transition_views import (
    AcademicYearClosingViewSet,
    PromotionViewSet,
    ClassPromotionMapViewSet,
    StudentAcademicRecordViewSet,
    FeeCarryForwardViewSet,
    AllocatedPaymentViewSet,
    FeeWriteOffViewSet,
    FeeStructureFinalizeViewSet,
    StudentDropoutViewSet,
)

router = DefaultRouter()
# Existing routes
router.register(r'fees/categories', views.FeeCategoryViewSet, basename='feecategory')
router.register(r'fees/structures', views.FeeStructureViewSet, basename='feestructure')
router.register(r'fees/structure-items', views.FeeStructureItemViewSet, basename='feestructureitem')
router.register(r'fees/concessions', views.FeeConcessionViewSet, basename='feeconcession')
router.register(r'fees/late-rules', views.LateFeeRuleViewSet, basename='latefeerule')
router.register(r'fees/invoices', views.FeeInvoiceViewSet, basename='feeinvoice')
router.register(r'fees/student-fees', views.StudentFeeItemViewSet, basename='studentfeeitem')
router.register(r'fees/approvals', views.FeeApprovalRequestViewSet, basename='feeapprovalrequest')
router.register(r'fees/payments', views.PaymentViewSet, basename='payment')

# Academic Year Transition routes
router.register(r'academic-year-closing', AcademicYearClosingViewSet, basename='academic-year-closing')
router.register(r'promotions', PromotionViewSet, basename='promotion')
router.register(r'promotion-maps', ClassPromotionMapViewSet, basename='promotion-map')
router.register(r'academic-records', StudentAcademicRecordViewSet, basename='academic-record')
router.register(r'fees/carry-forwards', FeeCarryForwardViewSet, basename='carry-forward')
router.register(r'allocated-payments', AllocatedPaymentViewSet, basename='allocated-payment')
router.register(r'fees/write-offs', FeeWriteOffViewSet, basename='write-off')
router.register(r'fee-finalize', FeeStructureFinalizeViewSet, basename='fee-finalize')
router.register(r'student-lifecycle', StudentDropoutViewSet, basename='student-lifecycle')

urlpatterns = [
    path(
        'fees/payments/online/config/',
        OnlinePaymentConfigView.as_view(),
        name='online-payment-config',
    ),
    path(
        'fees/payments/online/create-order/',
        CreateRazorpayOrderView.as_view(),
        name='razorpay-create-order',
    ),
    path(
        'fees/payments/webhooks/razorpay/',
        RazorpayWebhookView.as_view(),
        name='razorpay-webhook',
    ),
    path('', include(router.urls)),
]
