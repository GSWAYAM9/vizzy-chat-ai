from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from api.views import (
    AuthenticationViewSet,
    UserProfileViewSet,
    CollectionViewSet,
    AITaskViewSet
)
from api.media_views import MediaUploadViewSet
from api.social_views import SocialViewSet, ForumViewSet
from api.search_views import SearchViewSet, DiscoveryViewSet, SavedFiltersViewSet

router = DefaultRouter()
router.register(r'auth', AuthenticationViewSet, basename='auth')
router.register(r'profile', UserProfileViewSet, basename='profile')
router.register(r'collections', CollectionViewSet, basename='collections')
router.register(r'ai', AITaskViewSet, basename='ai')
router.register(r'media', MediaUploadViewSet, basename='media')
router.register(r'social', SocialViewSet, basename='social')
router.register(r'forums', ForumViewSet, basename='forums')
router.register(r'search', SearchViewSet, basename='search')
router.register(r'discover', DiscoveryViewSet, basename='discover')
router.register(r'filters', SavedFiltersViewSet, basename='filters')

urlpatterns = [
    path('api/', include(router.urls)),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
