from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'notifications/templates', views.NotificationTemplateViewSet, basename='notificationtemplate')
router.register(r'notifications/logs', views.NotificationLogViewSet, basename='notificationlog')

urlpatterns = [
    path('', include(router.urls)),
    # Universal in-app notifications
    path('notifications/mine/', views.my_notifications, name='my_notifications'),
    path('notifications/mine/<uuid:notification_id>/read/', views.my_mark_read, name='my_mark_read'),
    path('notifications/mine/read-all/', views.my_mark_all_read, name='my_mark_all_read'),
    
    # Admin Custom Dispatch removed in favor of Announcements workflow
]
