from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
router = DefaultRouter()
router.register(r'notifications/templates', views.NotificationTemplateViewSet, basename='notificationtemplate')
router.register(r'notifications/logs', views.NotificationLogViewSet, basename='notificationlog')
urlpatterns = [path('', include(router.urls))]
