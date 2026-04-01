from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'timetable/periods', views.PeriodViewSet, basename='period')
router.register(r'timetable/slots', views.TimetableSlotViewSet, basename='timetableslot')
router.register(r'subjects', views.SubjectViewSet, basename='subject')

urlpatterns = [
    path('', include(router.urls)),
]
