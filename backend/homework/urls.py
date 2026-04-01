from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
router = DefaultRouter()
router.register(r'homework', views.HomeworkViewSet, basename='homework')
urlpatterns = [path('', include(router.urls))]
