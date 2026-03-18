from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/analytics/', views.analytics, name='analytics'),
    path('api/users/', views.users_list, name='users_list'),
    path('api/jobs/', views.jobs_list, name='jobs_list'),
]
