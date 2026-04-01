from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'classes', views.ClassSectionViewSet, basename='classsection')
router.register(r'admissions/inquiries', views.AdmissionInquiryViewSet, basename='inquiry')
router.register(r'admissions/applications', views.AdmissionApplicationViewSet, basename='application')
router.register(r'students', views.StudentViewSet, basename='student')
router.register(r'parent-relations', views.ParentStudentRelationViewSet, basename='parentrelation')

urlpatterns = [
    path('', include(router.urls)),
]
